/**
 * GET /api/export/transactions
 * Admin-only. Returns all posted transactions as a CSV for accounting/tax.
 * Columns match the taxable_value_usd spec: creditAmount + cashAmount = taxableValueUsd (1 CC = 1 USD).
 */
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (session?.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const transactions = await prisma.transaction.findMany({
    where: { status: "POSTED" },
    include: {
      payerAccount: { include: { member: { select: { name: true, email: true } } } },
      payeeAccount: { include: { member: { select: { name: true, email: true } } } },
    },
    orderBy: { createdAt: "asc" },
  })

  const header = [
    "date",
    "payer_name",
    "payer_email",
    "payee_name",
    "payee_email",
    "description",
    "credit_amount_cc",
    "cash_amount_usd",
    "taxable_value_usd",
    "reference_type",
    "reference_id",
    "transaction_id",
  ].join(",")

  const rows = transactions.map((tx) => {
    const cols = [
      new Date(tx.createdAt).toISOString().slice(0, 10),
      tx.payerAccount.member.name,
      tx.payerAccount.member.email,
      tx.payeeAccount.member.name,
      tx.payeeAccount.member.email,
      `"${tx.description.replace(/"/g, '""')}"`,
      Number(tx.creditAmount).toFixed(2),
      Number(tx.cashAmount).toFixed(2),
      Number(tx.taxableValueUsd).toFixed(2),
      tx.referenceType ?? "DIRECT",
      tx.referenceId ?? "",
      tx.id,
    ]
    return cols.join(",")
  })

  const csv = [header, ...rows].join("\n")
  const filename = `commoncredit-transactions-${new Date().toISOString().slice(0, 10)}.csv`

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
