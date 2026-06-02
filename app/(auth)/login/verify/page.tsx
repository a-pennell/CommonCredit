export default function VerifyPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Check your inbox</h1>
        <p className="text-sm text-gray-500">
          A sign-in link is on its way. Click it to continue — it expires in 10
          minutes.
        </p>
        <p className="text-xs text-gray-400">
          Don&apos;t see it? Check your spam folder or{" "}
          <a href="/login" className="underline">
            try again
          </a>
          .
        </p>
      </div>
    </div>
  )
}
