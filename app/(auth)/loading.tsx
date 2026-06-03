export default function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-sm animate-pulse space-y-5">
        <div className="space-y-2 text-center">
          <div className="mx-auto h-3 w-24 rounded bg-gray-200" />
          <div className="mx-auto h-6 w-32 rounded-md bg-gray-200" />
          <div className="mx-auto h-3.5 w-56 rounded bg-gray-100" />
        </div>
        <div className="h-10 rounded-md bg-gray-100" />
        <div className="h-10 rounded-md bg-gray-200" />
      </div>
    </div>
  )
}
