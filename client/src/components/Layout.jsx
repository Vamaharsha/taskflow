import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, FolderKanban, CheckSquare, Users, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/projects', icon: FolderKanban, label: 'Projects' },
    { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  ]

  if (user?.role === 'admin') {
    navItems.push({ to: '/team', icon: Users, label: 'Team' })
  }

  return (
    <>
      <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div className="app-layout">
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-logo">
            <svg viewBox="0 0 32 32" fill="none"><defs><linearGradient id="g" x1="0" y1="0" x2="32" y2="32"><stop offset="0%" stopColor="#6366f1"/><stop offset="100%" stopColor="#8b5cf6"/></linearGradient></defs><rect width="32" height="32" rx="8" fill="url(#g)"/><path d="M9 16l4 4 10-10" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <h1>TaskFlow</h1>
          </div>

          <nav className="sidebar-nav">
            {navItems.map(({ to, icon: Icon, label, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                <Icon size={20} />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="user-info">
              <div className="user-avatar">{initials}</div>
              <div className="user-details">
                <div className="user-name">{user?.name}</div>
                <div className="user-role">{user?.role}</div>
              </div>
            </div>
            <button className="nav-link" onClick={logout} style={{ marginTop: 8 }}>
              <LogOut size={20} />
              Sign Out
            </button>
          </div>
        </aside>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </>
  )
}
