import { signIn } from "@/lib/auth"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight">CommonCredit</h1>
          <p className="text-sm text-gray-500">
            Enter your email to receive a sign-in link.
          </p>
        </div>

        {params.error && (
          <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {params.error === "AccessDenied"
              ? "Your account isn't approved yet. Contact the network admin."
              : "Something went wrong. Please try again."}
          </p>
        )}

        <form
          action={async (formData: FormData) => {
            "use server"
            await signIn("resend", {
              email: formData.get("email") as string,
              redirectTo: params.callbackUrl ?? "/dashboard",
            })
          }}
          className="space-y-4"
        >
          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
          <button
            type="submit"
            className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
          >
            Send sign-in link
          </button>
        </form>
      </div>
    </div>
  )
}
