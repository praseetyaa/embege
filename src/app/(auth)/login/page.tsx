import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Receipt, FileSpreadsheet, ActivitySquare } from "lucide-react"

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    redirect("/dashboard")
  }

  // Handle Google Login
  // We need to pass the current origin to the Supabase client
  // But this is a server component, we can't use window.location
  // We'll use a server action or a client component for the button.
  // Actually, let's use a client component for the login button so we can handle the OAuth redirect properly.

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white dark:bg-slate-950">
      {/* Left side - Branding & Features */}
      <div className="flex-1 p-8 md:p-12 lg:p-24 hidden md:block text-white flex flex-col justify-center relative overflow-hidden bg-[#0A192F]">
        {/* Animated Background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-[30rem] h-[30rem] rounded-full bg-blue-500/20 blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute top-1/2 -right-32 w-[30rem] h-[30rem] rounded-full bg-emerald-500/20 blur-[100px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
          <div className="absolute -bottom-32 left-1/2 w-[30rem] h-[30rem] rounded-full bg-purple-500/20 blur-[100px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />
        </div>

        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs font-semibold tracking-wider text-blue-100 uppercase">Sistem Reimbursement Modern</span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-blue-300">
            Awoo
          </h1>
          <p className="text-lg md:text-xl text-blue-100/80 mb-12 font-light leading-relaxed">
            Cara cerdas untuk memindai struk, melacak pengeluaran, dan menghasilkan rekap otomatis tanpa pusing.
          </p>

          <div className="space-y-8">
            <div className="flex items-start gap-5 group">
              <div className="p-3.5 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 group-hover:bg-white/10 transition-colors duration-300 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)]">
                <Receipt className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-1 text-white group-hover:text-emerald-300 transition-colors">Smart OCR Scanner</h3>
                <p className="text-blue-200/70 leading-relaxed">Teknologi AI mengekstrak data struk dengan presisi tinggi. Selamat tinggal input manual.</p>
              </div>
            </div>

            <div className="flex items-start gap-5 group">
              <div className="p-3.5 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 group-hover:bg-white/10 transition-colors duration-300 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)]">
                <FileSpreadsheet className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-1 text-white group-hover:text-blue-300 transition-colors">Auto-Generate Excel</h3>
                <p className="text-blue-200/70 leading-relaxed">Format laporan langsung jadi. Dilengkapi dengan ringkasan kategori dan terbilang otomatis.</p>
              </div>
            </div>

            <div className="flex items-start gap-5 group">
              <div className="p-3.5 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 group-hover:bg-white/10 transition-colors duration-300 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)]">
                <ActivitySquare className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-1 text-white group-hover:text-purple-300 transition-colors">Real-time Tracking</h3>
                <p className="text-blue-200/70 leading-relaxed">Pantau status pengajuan Anda dari mulai diproses hingga dana dicairkan secara real-time.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Box */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-950 relative">
        {/* Subtle dot pattern background for right side */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMCwgMCwgMCwgMC4wNSkiLz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wNSkiLz48L3N2Zz4=')] z-0"></div>

        <div className="w-full max-w-md bg-white dark:bg-slate-900 p-8 md:p-10 rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-slate-800 relative z-10 backdrop-blur-xl">
          <div className="mb-10 text-center">
            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-blue-100 dark:border-blue-500/20">
              <img src="/awoo-logo.png" alt="Awoo Logo" className="w-auto shrink-0" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">Selamat Datang</h2>
            <p className="text-slate-500 dark:text-slate-400">Silakan masuk menggunakan akun Google workspace perusahaan Anda</p>
          </div>

          <form action={signInWithGoogle} className="space-y-4">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 active:scale-[0.98] shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Lanjutkan dengan Google
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Hanya email dengan domain terdaftar yang dapat mengakses sistem ini.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Server action for sign in
async function signInWithGoogle() {
  "use server"
  const supabase = await createClient()

  // Need to get the base URL for redirecting correctly
  const headers = await import('next/headers')
  const host = (await headers.headers()).get('host')
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
  const origin = `${protocol}://${host}`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    console.error("Error logging in:", error.message)
    return redirect("/login?error=true")
  }

  if (data.url) {
    redirect(data.url)
  }
}
