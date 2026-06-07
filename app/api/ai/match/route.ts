/**
 * POST /api/ai/match
 *
 * Accepts { memberId } and returns AI-ranked offer matches for that member's
 * published needs, plus circular trade path suggestions.
 *
 * Uses Claude claude-sonnet-4-5 via the Anthropic SDK. Member transaction data is
 * never sent — only the member's needs summary and the public offers catalogue.
 */
import Anthropic from "@anthropic-ai/sdk"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

const client = new Anthropic()

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { memberId } = await req.json()

  // Security: members can only match for themselves (admins can match anyone)
  if (memberId !== session.user.memberId && session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const [member, myNeeds, allOffers] = await Promise.all([
    prisma.member.findUniqueOrThrow({
      where: { id: memberId },
      select: { displayName: true, bio: true },
    }),
    prisma.need.findMany({
      where: { memberId, status: "PUBLISHED" },
      select: { title: true, description: true, category: true },
    }),
    prisma.offer.findMany({
      where: { status: "PUBLISHED", memberId: { not: memberId } },
      include: { member: { select: { displayName: true, id: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ])

  if (myNeeds.length === 0) {
    return NextResponse.json({
      matches: [],
      paths: [],
      message: "Publish at least one need to get AI-powered matches.",
    })
  }

  const needsText = myNeeds
    .map((n) => `- ${n.title}: ${n.description}`)
    .join("\n")

  const offersText = allOffers
    .map(
      (o) =>
        `[${o.id.slice(-6)}] ${o.member.displayName} — "${o.title}" (${o.category}): ${o.description} | ${Number(o.price) > 0 ? `${Number(o.price)} CC${o.priceUnit === "CC_PER_HOUR" ? "/hr" : ""}` : "Negotiable"}`,
    )
    .join("\n")

  const prompt = `You are the matching assistant for CommonCredit, a mutual credit network. Your job is to help members find relevant offers that meet their published needs.

MEMBER: ${member.displayName}
BIO: ${member.bio ?? "Not provided"}

THEIR NEEDS:
${needsText}

AVAILABLE OFFERS FROM OTHER MEMBERS:
${offersText}

Return a JSON object with this exact shape (no markdown, no explanation):
{
  "matches": [
    {
      "offerId": "last 6 chars of offer id",
      "offerTitle": "...",
      "memberName": "...",
      "relevanceScore": 1-10,
      "reason": "1-2 sentence plain explanation of why this matches their need"
    }
  ],
  "paths": [
    {
      "description": "e.g. You provide web dev to Alice → Alice provides farm box to Bob → Bob provides carpentry to you",
      "steps": 3
    }
  ],
  "summary": "1-2 sentence plain-language summary of the best opportunities"
}

Rules:
- Return at most 5 matches, ranked by relevance
- Only include genuine matches — quality over quantity
- paths: suggest 0–2 circular trade paths if obvious ones exist (member A needs X from B, B needs Y from C, C needs Z from A)
- If no good matches exist, return empty arrays and say so in summary
- Never invent offers not in the list above`

  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  })

  const raw =
    message.content[0].type === "text" ? message.content[0].text : ""

  let parsed: {
    matches: Array<{
      offerId: string
      offerTitle: string
      memberName: string
      relevanceScore: number
      reason: string
    }>
    paths: Array<{ description: string; steps: number }>
    summary: string
  }

  try {
    parsed = JSON.parse(raw)
  } catch {
    return NextResponse.json(
      { error: "AI returned malformed response", raw },
      { status: 500 },
    )
  }

  // Enrich matches with full offer data
  const enriched = parsed.matches
    .map((m) => {
      const offer = allOffers.find((o) => o.id.endsWith(m.offerId))
      return offer ? { ...m, offer } : null
    })
    .filter(Boolean)

  return NextResponse.json({
    matches: enriched,
    paths: parsed.paths,
    summary: parsed.summary,
  })
}
