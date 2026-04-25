"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  User, 
  LogOut,
  Settings,
  ShieldCheck
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  isAdmin?: boolean
}

export function Sidebar({ isAdmin = false }: SidebarProps) {
  const pathname = usePathname()

  const userLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/transactions/new", label: "Nota", icon: PlusCircle },
    { href: "/transactions", label: "Transaksi", icon: FileText },
    { href: "/history", label: "Pengajuan", icon: FileText },
    { href: "/profile", label: "Profil", icon: User },
  ]

  const adminLinks = [
    { href: "/admin", label: "Admin Panel", icon: ShieldCheck },
    { href: "/admin/submissions", label: "Semua Pengajuan", icon: FileText },
    { href: "/admin/users", label: "Kelola Pengguna", icon: User },
    { href: "/admin/categories", label: "Kategori", icon: Settings },
  ]

  const links = isAdmin ? adminLinks : userLinks

  return (
    <aside className="w-64 bg-[#0F172A] text-white hidden md:flex flex-col h-screen sticky top-0 left-0 border-r border-slate-800 print:hidden">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 tracking-tight">
          REIMBURSE
        </h1>
        {isAdmin && <span className="text-xs font-medium text-amber-400 mt-1 block">Super Admin</span>}
      </div>

      <div className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">
          Menu Utama
        </div>
        
        {links.map((link) => {
          const Icon = link.icon
          let isActive = pathname === link.href
          
          if (!isActive && link.href !== "/dashboard" && link.href !== "/admin") {
            // Check if it's a child route
            if (pathname.startsWith(link.href + "/")) {
              isActive = true
            }
          }
          
          // Special case to prevent /transactions from being active when on /transactions/new
          if (link.href === "/transactions" && pathname.startsWith("/transactions/new")) {
            isActive = false
          }
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "sidebar-link group",
                isActive && "active"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-white")} />
              {link.label}
            </Link>
          )
        })}
      </div>

      <div className="p-4 border-t border-slate-800">
        <form action="/auth/signout" method="POST">
          <button className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:text-white hover:bg-red-500/10 rounded-lg transition-colors">
            <LogOut className="w-5 h-5" />
            Keluar
          </button>
        </form>
      </div>
    </aside>
  )
}
