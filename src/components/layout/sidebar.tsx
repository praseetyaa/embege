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
  Receipt,
  ChevronDown,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  isAdmin?: boolean
}

type NavItem = {
  href?: string;
  label: string;
  icon: any;
  children?: { href: string; label: string; icon?: any }[];
}

export function Sidebar({ isAdmin = false }: SidebarProps) {
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
    { href: "/profile", label: "Profil", icon: User },
  ]

  const adminLinks: NavItem[] = [
    { href: "/admin", label: "Admin Panel", icon: ShieldCheck },
    { href: "/admin/submissions", label: "Semua Pengajuan", icon: FileText },
    { href: "/admin/users", label: "Kelola Pengguna", icon: User },
    { href: "/admin/categories", label: "Kategori", icon: Settings },
  ]

  const links = isAdmin ? adminLinks : userLinks

  // Initialize open menus based on current pathname
  useEffect(() => {
    const newOpenMenus = { ...openMenus }
    let changed = false
    links.forEach(link => {
      if (link.children) {
        const isActive = link.children.some(child => {
          if (child.href === "/transactions" && pathname.startsWith("/transactions/new")) return false
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
    }

    if (link.children) {
      const isOpen = openMenus[link.label]
      
      const isAnyChildActive = link.children.some(child => {
          let childActive = pathname === child.href
          if (!childActive && child.href !== "/dashboard" && child.href !== "/admin") {
            if (pathname.startsWith(child.href + "/")) childActive = true
          }
          if (child.href === "/transactions" && pathname.startsWith("/transactions/new")) childActive = false
          return childActive
      })

      return (
        <div key={link.label} className="space-y-1">
          <button
            onClick={() => toggleMenu(link.label)}
            className={cn(
              "sidebar-link group w-full justify-between cursor-pointer",
              isAnyChildActive && !isOpen && "text-white"
            )}
          >
            <div className="flex items-center gap-3">
              <Icon className={cn("w-5 h-5", isAnyChildActive ? "text-emerald-400" : "text-slate-400 group-hover:text-white")} />
              {link.label}
            </div>
            {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
          </button>
          
          <div 
            className={cn(
              "grid transition-all duration-200 ease-in-out",
              isOpen ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"
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
        className={cn(
          "sidebar-link group",
          isActive && "active",
          isChild && "text-sm py-2 border-l-0" // Remove left border from .active for children if we want, or keep it.
        )}
      >
        {Icon && <Icon className={cn("w-5 h-5", isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-white")} />}
        {link.label}
      </Link>
    )
  }

  return (
    <aside className="w-64 bg-[#0F172A] text-white hidden md:flex flex-col h-screen sticky top-0 left-0 border-r border-slate-800 print:hidden">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 tracking-tight">
          REIMBURSE
        </h1>
        {isAdmin && <span className="text-xs font-medium text-amber-400 mt-1 block">Super Admin</span>}
      </div>

      <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">
          Menu Utama
        </div>
        
        {links.map((link) => renderLink(link))}
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
