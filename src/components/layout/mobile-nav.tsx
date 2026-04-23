"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  User, 
  LogOut,
  Settings,
  ShieldCheck,
  Menu,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileNavProps {
  isAdmin?: boolean
}

export function MobileNav({ isAdmin = false }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const userLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/new", label: "Buat Pengajuan", icon: PlusCircle },
    { href: "/history", label: "Riwayat", icon: FileText },
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
    <>
      {/* Hamburger Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div className={cn(
        "fixed top-0 left-0 h-full w-72 bg-[#0F172A] z-50 transform transition-transform duration-300 ease-in-out md:hidden",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 tracking-tight">
            REIMBURSE
          </h1>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isAdmin && (
          <span className="text-xs font-medium text-amber-400 px-6 block -mt-2 mb-4">Super Admin</span>
        )}

        <div className="px-4 py-2 space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">
            Menu Utama
          </div>
          
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href || (link.href !== "/dashboard" && link.href !== "/admin" && pathname.startsWith(link.href))
            
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
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

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
          <form action="/auth/signout" method="POST">
            <button className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:text-white hover:bg-red-500/10 rounded-lg transition-colors">
              <LogOut className="w-5 h-5" />
              Keluar
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
