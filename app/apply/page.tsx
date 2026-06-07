// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import type { Route } from "next"

export default function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>
}) {
  return <ApplyForm searchParamsPromise={searchParams} />
}

async function ApplyForm({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ success?: string; error?: string }>
}) {
  const params = await searchParamsPromise

  async function submitApplication(formData: FormData) {
    "use server"

    const email = (formData.get("email") as string).toLowerCase().trim()
    const name = (formData.get("name") as string).trim()
    const type = formData.get("type") as string
    const offerSummary = (formData.get("offerSummary") as string).trim()
    const needsSummary = (formData.get("needsSummary") as string).trim()
    const referredBy = (formData.get("referredBy") as string).trim()

    if (!email || !name || !type || !offerSummary) {
      redirect("/apply?error=missing" as Route)
    }

    // Check for duplicate email
    const existing = await prisma.member.findUnique({ where: { email } })
    if (existing) {
      redirect("/apply?error=duplicate" as Route)
    }

    await prisma.member.create({
      data: {
        email,
        displayName: name,
        type: type as
          | "INDIVIDUAL"
          | "BUSINESS"
          | "COOPERATIVE"
          | "NONPROFIT"
          | "ANCHOR",
        status: "PENDING",
        application: {
          create: {
            offerSummary,
            needsSummary: needsSummary || null,
            referredBy: referredBy || null,
            status: "SUBMITTED",
          },
        },
      },
    })

    redirect("/apply?success=1" as Route)
  }

  if (params.success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="w-full max-w-md text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700 text-xl">
            ✓
          </div>
          <h1 className="mt-3 text-xl font-semibold text-gray-900">
            Application received
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            We&apos;ll review your application and follow up at the email you
            provided. This typically takes a few days.
          </p>
          <a
            href="/"
            className="mt-6 inline-block text-sm text-gray-500 hover:text-gray-800 hover:underline"
          >
            ← Back to home
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            CommonCredit
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            Apply for membership
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            CommonCredit is a mutual credit network where members trade goods
            and services using a shared currency. Membership is by application.
          </p>
          <p className="mt-3 text-sm text-gray-500">
            Already a member?{" "}
            <a href="/login" className="font-medium text-gray-900 hover:underline">
              Sign in →
            </a>
          </p>
        </div>

        {params.error === "duplicate" && (
          <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            An application with that email already exists.
          </div>
        )}
        {params.error === "missing" && (
          <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            Please fill in all required fields.
          </div>
        )}

        <form action={submitApplication} className="space-y-5">
          {/* Name + email row */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Your name" name="name" required />
            <Field label="Email address" name="email" type="email" required />
          </div>

          {/* Member type */}
          <div>
            <label className="block text-xs font-medium text-gray-700">
              Member type <span className="text-red-500">*</span>
            </label>
            <select
              name="type"
              required
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            >
              <option value="">Select…</option>
              <option value="INDIVIDUAL">Individual</option>
              <option value="BUSINESS">Business</option>
              <option value="COOPERATIVE">Cooperative</option>
              <option value="NONPROFIT">Nonprofit</option>
            </select>
          </div>

          {/* What you offer */}
          <div>
            <label className="block text-xs font-medium text-gray-700">
              What can you offer the network?{" "}
              <span className="text-red-500">*</span>
            </label>
            <p className="mt-0.5 text-xs text-gray-400">
              Skills, goods, services — be specific. This is the core of your
              membership.
            </p>
            <textarea
              name="offerSummary"
              required
              rows={3}
              placeholder="e.g. Graphic design, web development, fresh produce from my garden…"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>

          {/* What you need */}
          <div>
            <label className="block text-xs font-medium text-gray-700">
              What do you need or want to source from members?
            </label>
            <textarea
              name="needsSummary"
              rows={2}
              placeholder="e.g. Bookkeeping, childcare, legal advice…"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>

          {/* Referred by */}
          <div>
            <label className="block text-xs font-medium text-gray-700">
              Referred by (optional)
            </label>
            <Field
              name="referredBy"
              placeholder="Name of the member who told you about us"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
          >
            Submit application
          </button>
        </form>
      </div>
    </div>
  )
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
}: {
  label?: string
  name: string
  type?: string
  placeholder?: string
  required?: boolean
}) {
  return (
    <div>
      {label && (
        <label className="block text-xs font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
      />
    </div>
  )
}
