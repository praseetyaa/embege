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
    <div className="min-h-screen bg-[#1B3A6B] flex flex-col md:flex-row">
      {/* Left side - Branding & Features */}
      <div className="flex-1 p-8 md:p-12 lg:p-24 text-white flex flex-col justify-center relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute top-1/2 right-0 w-64 h-64 rounded-full bg-emerald-500/20 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
            REIMBURSE
          </h1>
          <p className="text-lg md:text-xl text-blue-100 mb-12">
            Sistem pintar untuk scan struk dan generate rekap pengeluaran secara otomatis.
          </p>

          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-white/10 backdrop-blur-sm">
                <Receipt className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-1">Smart OCR Scanner</h3>
                <p className="text-blue-200">Teknologi AI membaca struk dengan akurasi tinggi, tanpa input manual.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-white/10 backdrop-blur-sm">
                <FileSpreadsheet className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-1">Auto-Generate Excel</h3>
                <p className="text-blue-200">Format rekap otomatis sesuai standar perusahaan dalam hitungan detik.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-white/10 backdrop-blur-sm">
                <ActivitySquare className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-1">Real-time Tracking</h3>
                <p className="text-blue-200">Pantau status pengajuan reimbursement Anda kapan saja dimana saja.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Box */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 relative">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Selamat Datang</h2>
            <p className="text-slate-500">Masuk dengan akun Google perusahaan Anda</p>
          </div>

          <form action={signInWithGoogle} className="space-y-4">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-medium py-3 px-4 rounded-xl transition-all active:scale-[0.98]"
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
              Masuk dengan Google
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500">
            Pastikan Anda menggunakan email terdaftar
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
