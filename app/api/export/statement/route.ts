/**
 * GET /api/export/statement
 * Member-only. Returns the logged-in member's ledger as CSV.
 */
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  const memberId = session?.user.memberId
  if (!memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const account = await prisma.account.findUnique({ where: { memberId } })
  if (!account) {
    return NextResponse.json({ error: "No account found" }, { status: 404 })
  }

  const entries = await prisma.ledgerEntry.findMany({
    where: { accountId: account.id },
    include: {
      transaction: {
        include: {
          payerAccount: { include: { member: { select: { displayName: true } } } },
          payeeAccount: { include: { member: { select: { displayName: true } } } },
        },
      },
    },
    orderBy: { postedAt: "asc" },
  })

  // Compute running balance
  let running = 0
  const rows = entries.map((e) => {
    const debit = Number(e.debit)
    const credit = Number(e.credit)
    running += credit - debit
    const tx = e.transaction
    const isSelf = tx.payerAccount.memberId === memberId
    const counterparty = isSelf
      ? tx.payeeAccount.member.displayName
      : tx.payerAccount.member.displayName

    return [
      new Date(e.postedAt).toISOString().slice(0, 10),
      `"${tx.description.replace(/"/g, '""')}"`,
      counterparty,
      debit > 0 ? "debit" : "credit",
      (debit > 0 ? -debit : credit).toFixed(2),
      running.toFixed(2),
      Number(tx.taxableValueUsd).toFixed(2),
      tx.id,
    ].join(",")
  })

  const header = [
    "date",
    "description",
    "counterparty",
    "type",
    "amount_cc",
    "running_balance_cc",
    "taxable_value_usd",
    "transaction_id",
  ].join(",")

  const csv = [header, ...rows].join("\n")
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: { displayName: true },
  })
  const slug = member?.displayName.toLowerCase().replace(/\s+/g, "-") ?? "member"
  const filename = `commoncredit-statement-${slug}-${new Date().toISOString().slice(0, 10)}.csv`

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
