import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await auth()

  if (session?.user) {
    if (session.user.role === "admin") redirect("/admin/dashboard")
    redirect("/dashboard")
  }

  return (
    <main className="flex min-h-screen flex-col bg-white">
      {/* Hero */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
          CommonCredit
        </p>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-gray-900">
          Trade goods and services with trusted local members
        </h1>
        <p className="mt-4 max-w-lg text-lg text-gray-500">
          A mutual credit network where 1&nbsp;CC&nbsp;=&nbsp;1&nbsp;USD and the
          network always sums to zero. No interest. No banks. Just reciprocal
          exchange.
        </p>
        <div className="mt-10 flex gap-4">
          <a
            href="/apply"
            className="rounded-md bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-700"
          >
            Apply to join
          </a>
          <a
            href="/login"
            className="rounded-md border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Sign in
          </a>
        </div>
      </div>

      {/* How it works */}
      <div className="border-t border-gray-100 bg-gray-50 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center text-sm font-semibold uppercase tracking-wider text-gray-400">
            How it works
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                n: "01",
                title: "Apply for membership",
                body: "Tell the network what you offer and what you need. Founding members review applications.",
              },
              {
                n: "02",
                title: "Earn and spend credits",
                body: "Provide a service → earn CC. Need something → spend CC. Every debit is someone else's credit.",
              },
              {
                n: "03",
                title: "Govern together",
                body: "Members vote on credit limits, dispute resolutions, and network rules. No unilateral admin power.",
              },
            ].map((item) => (
              <div key={item.n}>
                <p className="mb-2 font-mono text-xs text-gray-300">{item.n}</p>
                <h3 className="mb-1 text-sm font-semibold text-gray-900">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="border-t border-gray-100 px-6 py-6 text-center text-xs text-gray-400">
        CommonCredit · 1 CC = 1 USD · Mutual credit cooperative
      </footer>
    </main>
  )
}
