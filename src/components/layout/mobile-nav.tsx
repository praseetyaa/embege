"use client"

import { useState, useEffect } from "react"
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
  X,
  Receipt,
  Package,
  ChevronDown,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileNavProps {
  isAdmin?: boolean
}

type NavItem = {
  href?: string;
  label: string;
  icon?: any;
  children?: { href: string; label: string; icon?: any }[];
}

export function MobileNav({ isAdmin = false }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({})

  const userLinks: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    {
      label: "Reimbursement",
      icon: Receipt,
      children: [
        { href: "/transactions/new", label: "Nota", icon: PlusCircle },
        { href: "/transactions", label: "Transaksi", icon: FileText },
        { href: "/history", label: "Pengajuan", icon: FileText },
      ]
    },
    {
      label: "Permintaan ATK",
      icon: Package,
      children: [
        { href: "/asset-requests/new", label: "Buat Baru", icon: PlusCircle },
        { href: "/asset-requests", label: "Riwayat", icon: FileText },
      ]
    },
    { href: "/profile", label: "Profil", icon: User },
  ]

  const adminLinks: NavItem[] = [
    { href: "/admin", label: "Admin Panel", icon: ShieldCheck },
    { href: "/admin/submissions", label: "Semua Pengajuan", icon: FileText },
    { href: "/admin/users", label: "Kelola Pengguna", icon: User },
    { href: "/admin/categories", label: "Kategori", icon: Settings },
  ]

  const links = isAdmin ? adminLinks : userLinks

  useEffect(() => {
    const newOpenMenus = { ...openMenus }
    let changed = false
    links.forEach(link => {
      if (link.children) {
        const isActive = link.children.some(child => {
          if (child.href === "/transactions" && pathname.startsWith("/transactions/new")) return false
          if (child.href === "/asset-requests" && pathname.startsWith("/asset-requests/new")) return false
          if (pathname === child.href) return true
          if (pathname.startsWith(child.href + "/")) return true
          return false
        })
        if (isActive && !newOpenMenus[link.label]) {
          newOpenMenus[link.label] = true
          changed = true
        }
      }
    })
    if (changed) {
      setOpenMenus(newOpenMenus)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const toggleMenu = (label: string) => {
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }))
  }

  const renderLink = (link: NavItem, isChild = false) => {
    const Icon = link.icon
    let isActive = false

    if (link.href) {
      isActive = pathname === link.href
      if (!isActive && link.href !== "/dashboard" && link.href !== "/admin") {
        if (pathname.startsWith(link.href + "/")) {
          isActive = true
        }
      }
      if (link.href === "/transactions" && pathname.startsWith("/transactions/new")) {
        isActive = false
      }
      if (link.href === "/asset-requests" && pathname.startsWith("/asset-requests/new")) {
        isActive = false
      }
    }

    if (link.children) {
      const isMenuOpen = openMenus[link.label]

      const isAnyChildActive = link.children.some(child => {
        let childActive = pathname === child.href
        if (!childActive && child.href !== "/dashboard" && child.href !== "/admin") {
          if (pathname.startsWith(child.href + "/")) childActive = true
        }
        if (child.href === "/transactions" && pathname.startsWith("/transactions/new")) childActive = false
        if (child.href === "/asset-requests" && pathname.startsWith("/asset-requests/new")) childActive = false
        return childActive
      })

      return (
        <div key={link.label} className="space-y-1">
          <button
            onClick={() => toggleMenu(link.label)}
            className={cn(
              "sidebar-link group w-full justify-between cursor-pointer",
              isAnyChildActive && !isMenuOpen && "text-white"
            )}
          >
            <div className="flex items-center gap-3">
              <Icon className={cn("w-5 h-5", isAnyChildActive ? "text-emerald-400" : "text-slate-400 group-hover:text-white")} />
              {link.label}
            </div>
            {isMenuOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
          </button>

          <div
            className={cn(
              "grid transition-all duration-200 ease-in-out",
              isMenuOpen ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"
            )}
          >
            <div className="overflow-hidden">
              <div className="pl-6 space-y-1 border-l border-slate-700/50 ml-4 py-1">
                {link.children.map(child => renderLink(child, true))}
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <Link
        key={link.href}
        href={link.href!}
        onClick={() => setIsOpen(false)}
        className={cn(
          "sidebar-link group",
          isActive && "active",
          isChild && "text-sm py-2 border-l-0"
        )}
      >
        {Icon && <Icon className={cn("w-5 h-5", isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-white")} />}
        {link.label}
      </Link>
    )
  }

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
        "fixed top-0 left-0 h-full w-72 bg-[#0F172A] z-50 transform transition-transform duration-300 ease-in-out md:hidden flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <img src="/awoo-logo.png" alt="Awoo Logo" className="h-10 w-auto shrink-0" />
            <div className="flex flex-col">
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 tracking-tight leading-none">
                Awoo
              </h1>
              <span className="text-[10px] font-medium text-slate-400 mt-1 leading-tight">Tools buat yang mager kaya Isna</span>
            </div>
          </div>
          {isAdmin && <span className="text-xs font-medium text-amber-400 mt-3 block">Super Admin</span>}
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors -mt-4"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">
            Menu Utama
          </div>
          
          {links.map((link) => renderLink(link))}
        </div>

        <div className="p-4 border-t border-slate-800 shrink-0">
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
