/**
 * Demo seed — 8 founding members, offers, needs, and 6 posted transactions.
 * Network sum after seeding = 0 CC (verified at end).
 *
 * Run: node --env-file=.env.local ./node_modules/.bin/prisma db seed
 */

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true },
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

async function postTransaction(
  payerAccountId: string,
  payeeAccountId: string,
  amount: number,
  description: string,
  postedAt: Date,
) {
  await prisma.$transaction(async (tx) => {
    const txn = await tx.transaction.create({
      data: {
        payerAccountId,
        payeeAccountId,
        creditAmount: amount,
        cashAmount: 0,
        taxableValueUsd: amount,
        description,
        status: "POSTED",
        referenceType: "DIRECT",
      },
    })
    await tx.ledgerEntry.createMany({
      data: [
        // Payer loses balance → debit
        {
          transactionId: txn.id,
          accountId: payerAccountId,
          debit: amount,
          credit: 0,
          postedAt,
        },
        // Payee gains balance → credit
        {
          transactionId: txn.id,
          accountId: payeeAccountId,
          debit: 0,
          credit: amount,
          postedAt,
        },
      ],
    })
    // Update running balances
    await tx.account.update({
      where: { id: payerAccountId },
      data: { balance: { decrement: amount } },
    })
    await tx.account.update({
      where: { id: payeeAccountId },
      data: { balance: { increment: amount } },
    })
  })
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("🌱  Seeding CommonCredit demo data…")

  // ── Wipe existing data (FK order) ───────────────────────────────────────
  await prisma.ledgerEntry.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.offer.deleteMany()
  await prisma.need.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.account.deleteMany()
  await prisma.membershipApplication.deleteMany()
  await prisma.member.deleteMany()

  console.log("   Cleared existing data")

  // ── Members ─────────────────────────────────────────────────────────────
  const memberDefs = [
    {
      name: "Maya Chen",
      email: "maya@example.com",
      type: "INDIVIDUAL" as const,
      bio: "Licensed acupuncturist and community herbalist. 12 years of practice.",
      offerSummary:
        "Acupuncture, herbal consultations, and preventive wellness coaching",
      needsSummary: "Fresh produce, bookkeeping help",
      joinedAt: daysAgo(45),
    },
    {
      name: "Green Roots Farm",
      email: "hello@greenroots.example.com",
      type: "BUSINESS" as const,
      bio: "Family-run organic farm, 8 acres. Eggs, seasonal veg, and preserves.",
      offerSummary:
        "Weekly veggie boxes, eggs by the dozen, seasonal preserves",
      needsSummary: "Website updates, printed marketing materials",
      joinedAt: daysAgo(43),
    },
    {
      name: "Solidarity Press",
      email: "print@solidarity.example.com",
      type: "COOPERATIVE" as const,
      bio: "Worker-owned print shop specialising in risograph and short-run offset.",
      offerSummary:
        "Print design, risograph printing, offset, zine production",
      needsSummary: "Fresh food, cleaning services",
      joinedAt: daysAgo(40),
    },
    {
      name: "Urban Repair Collective",
      email: "fix@urbanrepair.example.com",
      type: "NONPROFIT" as const,
      bio: "Volunteer-run repair café. Electronics, appliances, clothing.",
      offerSummary: "Electronics repair, appliance diagnosis, clothing mends",
      needsSummary: "Carpentry work, office supplies, catering for events",
      joinedAt: daysAgo(38),
    },
    {
      name: "Marcus Johnson",
      email: "marcus@example.com",
      type: "INDIVIDUAL" as const,
      bio: "Custom furniture maker and finish carpenter. 20 years in the trade.",
      offerSummary:
        "Custom furniture, shelving, finish carpentry, furniture repair",
      needsSummary: "Acupuncture, graphic design, accounting",
      joinedAt: daysAgo(35),
    },
    {
      name: "Bright Minds Tutoring",
      email: "learn@brightminds.example.com",
      type: "BUSINESS" as const,
      bio: "K–12 tutoring in math, science, and reading. Remote or in-home.",
      offerSummary: "Tutoring in math, science, reading; SAT/ACT prep",
      needsSummary: "Logo refresh, social media graphics, web help",
      joinedAt: daysAgo(30),
    },
    {
      name: "Luna Rodriguez",
      email: "luna@example.com",
      type: "INDIVIDUAL" as const,
      bio: "Brand identity designer. Specialise in co-ops, nonprofits, and food businesses.",
      offerSummary:
        "Logo design, brand identity, flyer and poster design, illustration",
      needsSummary: "Tutoring for my kids, fresh produce, accounting",
      joinedAt: daysAgo(28),
    },
    {
      name: "Pedro Santos",
      email: "pedro@example.com",
      type: "INDIVIDUAL" as const,
      bio: "Full-stack web developer. React, Next.js, and accessible design.",
      offerSummary:
        "Website builds, React development, SEO audits, accessibility fixes",
      needsSummary: "Acupuncture, fresh food, carpentry",
      joinedAt: daysAgo(25),
    },
  ]

  const members: Record<string, string> = {} // name → memberId

  for (const def of memberDefs) {
    const m = await prisma.member.create({
      data: {
        displayName: def.name,
        email: def.email,
        type: def.type,
        bio: def.bio,
        status: "APPROVED",
        joinedAt: def.joinedAt,
        application: {
          create: {
            offerSummary: def.offerSummary,
            needsSummary: def.needsSummary,
            status: "APPROVED",
            reviewedAt: def.joinedAt,
          },
        },
        account: {
          create: {
            balance: 0,
            creditLimit: 500,
            debitLimit: -200,
            status: "ACTIVE",
          },
        },
      },
    })
    members[def.name] = m.id
  }

  console.log(`   Created ${memberDefs.length} members`)

  // ── Fetch accounts ───────────────────────────────────────────────────────
  const accounts = await prisma.account.findMany({
    include: { member: true },
  })
  const acct = (name: string) => {
    const a = accounts.find((a) => a.member.displayName === name)
    if (!a) throw new Error(`Account not found for ${name}`)
    return a.id
  }

  // ── Transactions ─────────────────────────────────────────────────────────
  // Designed so the network sums to 0:
  //   Maya       −40 +30            = −10
  //   GreenRoots +40 −60 +25        = +5
  //   Solidarity +60 −25            = +35
  //   UrbanRepair −80               = −80
  //   Marcus     +80                = +80
  //   BrightMinds +45               = +45
  //   Luna       −45                = −45
  //   Pedro      −30                = −30
  //   Total                         = 0 ✓

  await postTransaction(
    acct("Maya Chen"),
    acct("Green Roots Farm"),
    40,
    "Acupuncture session — 4-week package",
    daysAgo(40),
  )
  await postTransaction(
    acct("Green Roots Farm"),
    acct("Solidarity Press"),
    60,
    "Custom packaging design + 500 printed labels",
    daysAgo(35),
  )
  await postTransaction(
    acct("Urban Repair Collective"),
    acct("Marcus Johnson"),
    80,
    "Custom tool storage shelving for repair café",
    daysAgo(28),
  )
  await postTransaction(
    acct("Luna Rodriguez"),
    acct("Bright Minds Tutoring"),
    45,
    "Logo redesign and brand colour palette",
    daysAgo(22),
  )
  await postTransaction(
    acct("Pedro Santos"),
    acct("Maya Chen"),
    30,
    "Website update and booking form integration",
    daysAgo(15),
  )
  await postTransaction(
    acct("Solidarity Press"),
    acct("Green Roots Farm"),
    25,
    "Printed market-day flyers — 200 copies",
    daysAgo(8),
  )

  console.log("   Posted 6 transactions")

  // ── Offers ───────────────────────────────────────────────────────────────
  const offerData = [
    {
      memberId: members["Maya Chen"],
      title: "Acupuncture session (60 min)",
      category: "wellness",
      description:
        "Traditional acupuncture for pain relief, stress, and general wellbeing. Includes intake consultation.",
      price: 60,
      priceUnit: "CC",
      availability: "Tue–Thu, mornings",
    },
    {
      memberId: members["Maya Chen"],
      title: "Herbal consultation",
      category: "wellness",
      description:
        "Personalised herbal formula based on your constitution and current health goals.",
      price: 40,
      priceUnit: "CC",
      availability: "Flexible",
    },
    {
      memberId: members["Green Roots Farm"],
      title: "Weekly veggie box — small",
      category: "food",
      description:
        "5–6 seasonal vegetables, organically grown, harvested same day. Pickup at the farm gate.",
      price: 32,
      priceUnit: "CC",
      availability: "Fridays",
    },
    {
      memberId: members["Green Roots Farm"],
      title: "Free-range eggs (dozen)",
      category: "food",
      description: "Pasture-raised hens, mixed colours. Available most weeks.",
      price: 8,
      priceUnit: "CC",
      availability: "Fridays or by arrangement",
    },
    {
      memberId: members["Solidarity Press"],
      title: "Print design",
      category: "creative",
      description:
        "Flyers, posters, zines, menus. Includes one round of revisions.",
      price: 50,
      priceUnit: "CC_PER_HOUR",
      availability: "2–3 week turnaround",
    },
    {
      memberId: members["Urban Repair Collective"],
      title: "Electronics repair",
      category: "repair",
      description:
        "Laptops, phones, small appliances. Diagnosis is free; you only pay if we fix it.",
      price: 0,
      priceUnit: "NEGOTIABLE",
      availability: "Drop-in Saturdays 10–2",
    },
    {
      memberId: members["Marcus Johnson"],
      title: "Furniture repair & restoration",
      category: "repair",
      description:
        "Chairs, tables, cabinets. Structural repairs, refinishing, custom modifications.",
      price: 55,
      priceUnit: "CC_PER_HOUR",
      availability: "Weekends and evenings",
    },
    {
      memberId: members["Marcus Johnson"],
      title: "Custom shelving (quoted)",
      category: "repair",
      description:
        "Built-in or freestanding shelving designed to fit your space. Materials at cost.",
      price: 0,
      priceUnit: "NEGOTIABLE",
      availability: "Book 2+ weeks ahead",
    },
    {
      memberId: members["Luna Rodriguez"],
      title: "Logo design",
      category: "creative",
      description:
        "Brand mark, colour palette, and typography guide. Two concepts presented, one refined.",
      price: 150,
      priceUnit: "CC",
      availability: "3–4 week turnaround",
    },
    {
      memberId: members["Luna Rodriguez"],
      title: "Flyer or poster design",
      category: "creative",
      description: "Event flyers, market posters, community notices.",
      price: 55,
      priceUnit: "CC",
      availability: "1 week turnaround",
    },
    {
      memberId: members["Pedro Santos"],
      title: "Website audit",
      category: "professional",
      description:
        "SEO, performance, accessibility, and security review with a written report.",
      price: 80,
      priceUnit: "CC",
      availability: "Delivered within 5 days",
    },
    {
      memberId: members["Pedro Santos"],
      title: "React / Next.js development",
      category: "professional",
      description:
        "Feature work, bug fixes, performance improvements. Minimum 4 hours.",
      price: 70,
      priceUnit: "CC_PER_HOUR",
      availability: "Mon–Fri",
    },
    {
      memberId: members["Bright Minds Tutoring"],
      title: "Math or science tutoring (K–8)",
      category: "professional",
      description: "One-on-one sessions, tailored to curriculum and learning style.",
      price: 35,
      priceUnit: "CC_PER_HOUR",
      availability: "After school and weekends",
    },
  ]

  await prisma.offer.createMany({
    data: offerData.map((o) => ({ ...o, status: "PUBLISHED" })),
  })

  console.log(`   Created ${offerData.length} offers`)

  // ── Needs ─────────────────────────────────────────────────────────────────
  const needData = [
    {
      memberId: members["Urban Repair Collective"],
      title: "Office cleaning (monthly)",
      category: "professional",
      description: "Our repair café needs a monthly deep clean — about 3 hours.",
    },
    {
      memberId: members["Urban Repair Collective"],
      title: "Bookkeeping (part-time)",
      category: "professional",
      description:
        "Reconciling donations and expenses. Roughly 4 hours a month.",
    },
    {
      memberId: members["Green Roots Farm"],
      title: "Website update",
      category: "professional",
      description:
        "Our WordPress site needs a CSA sign-up page and a seasonal menu section.",
    },
    {
      memberId: members["Green Roots Farm"],
      title: "Photography — farm and produce",
      category: "creative",
      description:
        "We need fresh photos for Instagram and our market stall banner.",
    },
    {
      memberId: members["Bright Minds Tutoring"],
      title: "Social media graphics",
      category: "creative",
      description:
        "Monthly set of Instagram and Facebook posts promoting our tutoring services.",
    },
    {
      memberId: members["Marcus Johnson"],
      title: "Accounting / tax help",
      category: "professional",
      description:
        "Self-employed carpenter needs help with quarterly estimates and annual filing.",
    },
    {
      memberId: members["Pedro Santos"],
      title: "Fresh produce — weekly",
      category: "food",
      description:
        "Looking for a regular source of veg and eggs to supplement grocery shopping.",
    },
  ]

  await prisma.need.createMany({
    data: needData.map((n) => ({ ...n, status: "PUBLISHED" })),
  })

  console.log(`   Created ${needData.length} needs`)

  // ── Verify network sum ───────────────────────────────────────────────────
  const [debits, credits] = await Promise.all([
    prisma.ledgerEntry.aggregate({ _sum: { debit: true } }),
    prisma.ledgerEntry.aggregate({ _sum: { credit: true } }),
  ])
  const networkSum =
    Number(credits._sum.credit ?? 0) - Number(debits._sum.debit ?? 0)

  if (networkSum !== 0) {
    throw new Error(`❌ Network sum is ${networkSum} — should be 0!`)
  }

  console.log("   Network sum = 0 CC ✓")
  console.log("✅  Seed complete")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
