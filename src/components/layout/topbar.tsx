"use client"

import { Search, Sun, Moon } from "lucide-react"
import { NotificationBell } from "./notification-bell"
import { MobileNav } from "./mobile-nav"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

interface TopbarProps {
  user: any
  isAdmin?: boolean
}

export function Topbar({ user, isAdmin }: TopbarProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => setMounted(true), [])

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <MobileNav isAdmin={isAdmin} />
        
        <div className="hidden md:flex items-center relative">
          <Search className="w-4 h-4 absolute left-3 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari pengajuan..." 
            className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 dark:text-white dark:placeholder-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
            title={theme === "dark" ? "Mode Terang" : "Mode Gelap"}
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        )}

        <NotificationBell />
        
        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
        
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{user?.full_name || "User"}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{user?.role === "super_admin" ? "Admin" : "Karyawan"}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-blue-100 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-blue-600 font-bold">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              user?.full_name?.charAt(0) || "U"
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
