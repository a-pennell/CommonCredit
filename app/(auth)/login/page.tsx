import { signIn } from "@/lib/auth"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-400">
            CommonCredit
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            We&apos;ll send a sign-in link to your email.
          </p>
        </div>

        {params.error && (
          <div className="mb-5 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {params.error === "AccessDenied"
              ? "Your account isn't approved yet. Contact the network admin or apply below."
              : "Something went wrong. Please try again."}
          </div>
        )}

        <form
          action={async (formData: FormData) => {
            "use server"
            await signIn("resend", {
              email: formData.get("email") as string,
              redirectTo: params.callbackUrl ?? "/dashboard",
            })
          }}
          className="space-y-3"
        >
          <input
            type="email"
            name="email"
            placeholder="your@email.com"
            required
            autoComplete="email"
            className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
          <button
            type="submit"
            className="w-full rounded-md bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
          >
            Send sign-in link
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Not a member yet?{" "}
          <a href="/apply" className="font-medium text-gray-900 hover:underline">
            Apply to join →
          </a>
        </p>
      </div>
    </div>
  )
}
