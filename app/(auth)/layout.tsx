export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-600 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4 shadow-lg">
              <span className="text-3xl">💰</span>
            </div>
            <h1 className="text-2xl font-bold text-white">PocketCircle</h1>
            <p className="text-brand-200 text-sm mt-1">Community savings made simple</p>
          </div>
          {/* Card */}
          <div className="bg-white rounded-3xl p-6 shadow-xl">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
