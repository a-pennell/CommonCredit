"use client"

import { useState } from "react"

interface Match {
  offerId: string
  offerTitle: string
  memberName: string
  relevanceScore: number
  reason: string
  offer: {
    id: string
    title: string
    description: string
    price: number | string
    priceUnit: string
    category: string
    availability: string | null
    member: { id: string; displayName: string }
  }
}

interface Path {
  description: string
  steps: number
}

interface Result {
  matches: Match[]
  paths: Path[]
  summary: string
  message?: string
}

export default function AiMatchPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function runMatch() {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Get memberId from session via a lightweight fetch
      const sessionRes = await fetch("/api/auth/session")
      const session = await sessionRes.json()
      const memberId = session?.user?.memberId

      if (!memberId) {
        setError("You must be a member with an active account to use AI matching.")
        return
      }

      const res = await fetch("/api/ai/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      })

      if (!res.ok) {
        const err = await res.json()
        setError(err.error ?? "Something went wrong.")
        return
      }

      setResult(await res.json())
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">AI matching</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Claude analyses your published needs against the offers catalogue and
          suggests the best matches — including circular trade paths.
        </p>
      </div>

      <div className="max-w-2xl">
        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs text-gray-500">
          <p>
            <span className="font-medium text-gray-700">Privacy note:</span>{" "}
            Only your public needs summary and the offers catalogue are sent to
            Claude. Transaction data, balances, and personal information are
            never shared with the AI.
          </p>
        </div>

        <button
          onClick={runMatch}
          disabled={loading}
          className="mb-6 rounded-md bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {loading ? "Finding matches…" : "Find matches for my needs"}
        </button>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-6">
            {/* Summary */}
            {result.summary && (
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                <p className="text-sm text-blue-900">{result.summary}</p>
              </div>
            )}

            {result.message && (
              <p className="text-sm text-gray-500">{result.message}</p>
            )}

            {/* Matches */}
            {result.matches.length > 0 && (
              <section>
                <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">
                  Top matches ({result.matches.length})
                </h2>
                <div className="space-y-3">
                  {result.matches.map((m, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-gray-200 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">
                            {m.offer.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {m.offer.member.displayName}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                            {m.relevanceScore}/10
                          </span>
                          <span className="rounded bg-gray-900 px-2 py-0.5 text-[11px] font-medium text-white">
                            {Number(m.offer.price) > 0
                              ? `${Number(m.offer.price)} CC${m.offer.priceUnit === "CC_PER_HOUR" ? "/hr" : ""}`
                              : "Negotiable"}
                          </span>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-blue-700 bg-blue-50 rounded px-2 py-1">
                        {m.reason}
                      </p>
                      {m.offer.description && (
                        <p className="mt-2 line-clamp-2 text-xs text-gray-500">
                          {m.offer.description}
                        </p>
                      )}
                      <div className="mt-3 flex gap-2">
                        <a
                          href={`/members/${m.offer.member.id}`}
                          className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
                        >
                          View profile
                        </a>
                        <a
                          href={`/pay?to=${m.offer.member.id}`}
                          className="rounded bg-gray-900 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700"
                        >
                          Send credits
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Circular trade paths */}
            {result.paths.length > 0 && (
              <section>
                <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">
                  Circular trade paths
                </h2>
                <div className="space-y-2">
                  {result.paths.map((p, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-green-200 bg-green-50 p-4"
                    >
                      <p className="text-sm text-green-900">{p.description}</p>
                      <p className="mt-1 text-xs text-green-600">
                        {p.steps}-way exchange
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
