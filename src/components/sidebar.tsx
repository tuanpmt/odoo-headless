"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
  LayoutDashboard, Users, Ticket, Target, Plus, Menu, X, LogOut,
} from "lucide-react";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/crm", label: "Leads / CRM", icon: Target },
  { href: "/tickets", label: "Tickets", icon: Ticket },
  { href: "/contacts", label: "Liên hệ", icon: Users },
];

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-indigo-900 text-white transform transition-transform lg:relative lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-indigo-700">
          <h1 className="text-xl font-bold">Odoo CRM</h1>
          <button className="lg:hidden" onClick={() => setOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <nav className="p-3 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive(item.href)
                  ? "bg-indigo-700 text-white"
                  : "text-indigo-200 hover:bg-indigo-800 hover:text-white"
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full p-3 border-t border-indigo-700">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-indigo-200 hover:bg-indigo-800 hover:text-white"
          >
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center gap-4 px-4 py-3 bg-white border-b lg:px-6">
          <button className="lg:hidden" onClick={() => setOpen(true)}>
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            {pathname !== "/" && pathname.includes("/") && (
              <Link
                href={`/${pathname.split("/")[1]}/new`}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Plus size={16} />
                Tạo mới
              </Link>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
