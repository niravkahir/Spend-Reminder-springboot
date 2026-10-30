import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Activity, BrainCircuit, LayoutDashboard, LogOut, Menu, Receipt, Settings2, Wallet, X, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/expenses', label: 'Transactions', icon: Receipt },
  { to: '/budget', label: 'Budget planner', icon: Wallet },
  { to: '/insights', label: 'AI insights', icon: BrainCircuit },
  { to: '/profile', label: 'My profile', icon: Settings2 },
]
export default function AppLayout() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const visibleLinks = user?.role === 'ADMIN' ? [...links, { to: '/admin', label: 'Admin workspace', icon: ShieldCheck }] : links
  const current = visibleLinks.find((link) => link.to === location.pathname)?.label || 'Overview'
  const Sidebar = () => <aside className="flex h-full flex-col bg-ink px-5 py-6 text-white">
    <div className="flex items-center gap-3 px-2"><div className="rounded-xl bg-white/10 p-2.5 text-emerald-300"><Activity size={21}/></div><div><p className="font-bold tracking-tight">Spend Remainder</p><p className="text-[11px] text-slate-400">Your money, in perspective</p></div></div>
    <p className="mb-3 mt-10 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">Workspace</p>
    <nav className="space-y-1">{visibleLinks.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${isActive ? 'bg-white text-ink shadow-soft' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}><Icon size={18}/>{label}</NavLink>)}</nav>
    <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs text-slate-400">Signed in as</p><p className="mt-1 truncate text-sm font-semibold">{user?.name || user?.username}</p><p className="truncate text-xs text-slate-400">{user?.email}</p><button onClick={logout} className="mt-4 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-slate-300 hover:bg-white/10 hover:text-white"><LogOut size={16}/> Sign out</button></div>
  </aside>
  return <div className="min-h-screen bg-canvas lg:flex"><div className="hidden w-64 shrink-0 lg:block"><Sidebar/></div>
    {open && <div className="fixed inset-0 z-40 lg:hidden"><button className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-label="Close menu"/><div className="relative h-full w-72"><Sidebar/><button onClick={() => setOpen(false)} className="absolute right-3 top-5 rounded-lg p-2 text-white"><X size={18}/></button></div></div>}
    <main className="min-w-0 flex-1"><header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur md:px-9"><div className="flex items-center gap-3"><button onClick={() => setOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"><Menu size={20}/></button><div><p className="text-xs text-slate-400">Spend Remainder / {current}</p><h1 className="text-lg font-bold text-ink">{current}</h1></div></div><div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-sm font-semibold text-ink">{user?.name || user?.username}</p><p className="text-xs text-slate-500">Personal workspace</p></div><div className="grid h-10 w-10 place-items-center rounded-full bg-brand/10 text-sm font-bold text-brand">{(user?.name || user?.username || 'U').slice(0,1).toUpperCase()}</div></div></header><div className="mx-auto max-w-[1440px] px-5 py-7 md:px-9 md:py-9"><Outlet/></div></main>
  </div>
}
