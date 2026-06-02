/**
 * Ledger reconciliation checks.
 *
 * Run on a schedule (e.g. every hour via a cron job or Vercel cron).
 * Also callable manually from the admin dashboard.
 *
 * The network-sum invariant (Σ all balances = 0) cannot be enforced
 * cheaply at the row level — a full Account scan is required.
 * These checks are the safety net; lib/ledger.ts is the first line
 * of defence.
 */

import { PrismaClient, Prisma } from "@prisma/client"

const prisma = new PrismaClient()

export type ReconciliationResult = {
  ok: boolean
  checks: ReconciliationCheck[]
  ranAt: Date
}

type ReconciliationCheck = {
  name: string
  passed: boolean
  detail: string
}

export async function runReconciliation(): Promise<ReconciliationResult> {
  const checks = await Promise.all([
    checkNetworkSum(),
    checkAccountBalancesMatchLedger(),
    checkOrphanedLedgerEntries(),
    checkTransactionPairCount(),
  ])

  return {
    ok: checks.every((c) => c.passed),
    checks,
    ranAt: new Date(),
  }
}

// ============================================================
// Check 1: Σ all Account.balance = 0
// The core mutual credit invariant: credits issued = credits owed.
// ============================================================
async function checkNetworkSum(): Promise<ReconciliationCheck> {
  const result = await prisma.account.aggregate({
    _sum: { balance: true },
  })

  const sum = result._sum.balance ?? new Prisma.Decimal(0)
  const passed = sum.equals(0)

  return {
    name: "network_sum_zero",
    passed,
    detail: passed
      ? "Network balance sums to zero."
      : `VIOLATION: Network balance sums to ${sum.toFixed(2)} CC (expected 0).`,
  }
}

// ============================================================
// Check 2: Each Account.balance matches its LedgerEntry sum
// Catches any case where balance was updated without a ledger entry,
// or a ledger entry was written without updating the balance.
// ============================================================
async function checkAccountBalancesMatchLedger(): Promise<ReconciliationCheck> {
  // Sum credits and debits per account directly from LedgerEntry
  const ledgerTotals: Array<{ accountId: string; net: Prisma.Decimal }> =
    await prisma.$queryRaw`
      SELECT
        "accountId",
        SUM(credit - debit) AS net
      FROM "LedgerEntry"
      GROUP BY "accountId"
    `

  const accounts = await prisma.account.findMany({
    select: { id: true, balance: true },
  })

  const balanceMap = new Map(accounts.map((a) => [a.id, a.balance]))
  const mismatches: string[] = []

  for (const { accountId, net } of ledgerTotals) {
    const recorded = balanceMap.get(accountId)
    if (recorded === undefined) {
      mismatches.push(`Account ${accountId}: in ledger but not in Account table`)
      continue
    }
    if (!recorded.equals(net)) {
      mismatches.push(
        `Account ${accountId}: balance is ${recorded.toFixed(2)} but ledger sums to ${net.toFixed(2)}`
      )
    }
  }

  const passed = mismatches.length === 0

  return {
    name: "account_balances_match_ledger",
    passed,
    detail: passed
      ? "All account balances match their ledger entry sums."
      : `VIOLATION: ${mismatches.length} mismatch(es):\n${mismatches.join("\n")}`,
  }
}

// ============================================================
// Check 3: No LedgerEntry references a missing Transaction
// Catches orphaned entries from failed partial writes.
// ============================================================
async function checkOrphanedLedgerEntries(): Promise<ReconciliationCheck> {
  const orphans: Array<{ id: string; transactionId: string }> =
    await prisma.$queryRaw`
      SELECT le.id, le."transactionId"
      FROM "LedgerEntry" le
      LEFT JOIN "Transaction" t ON t.id = le."transactionId"
      WHERE t.id IS NULL
    `

  const passed = orphans.length === 0

  return {
    name: "no_orphaned_ledger_entries",
    passed,
    detail: passed
      ? "No orphaned ledger entries."
      : `VIOLATION: ${orphans.length} orphaned LedgerEntry row(s) with no parent Transaction.`,
  }
}

// ============================================================
// Check 4: Every POSTED Transaction has exactly 2 LedgerEntry rows
// The DB trigger enforces this at write time, but this check
// catches anything that bypassed the ORM (e.g. manual SQL edits).
// ============================================================
async function checkTransactionPairCount(): Promise<ReconciliationCheck> {
  const violations: Array<{ transactionId: string; entryCount: bigint }> =
    await prisma.$queryRaw`
      SELECT
        t.id AS "transactionId",
        COUNT(le.id) AS "entryCount"
      FROM "Transaction" t
      LEFT JOIN "LedgerEntry" le ON le."transactionId" = t.id
      WHERE t.status = 'POSTED'
      GROUP BY t.id
      HAVING COUNT(le.id) <> 2
    `

  const passed = violations.length === 0

  return {
    name: "transaction_pair_count",
    passed,
    detail: passed
      ? "All posted transactions have exactly 2 ledger entries."
      : `VIOLATION: ${violations.length} transaction(s) with wrong entry count:\n` +
        violations
          .map((v) => `  Transaction ${v.transactionId}: ${v.entryCount} entries`)
          .join("\n"),
  }
}
