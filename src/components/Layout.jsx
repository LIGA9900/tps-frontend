import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, BookOpen, Calculator,
  BarChart2, LogOut, TrendingUp, Menu, X, User
} from 'lucide-react';

const navItems = [
  { path: '/dashboard',   icon: <LayoutDashboard size={18}/>, label: 'Dashboard'    },
  { path: '/journal',     icon: <BookOpen size={18}/>,        label: 'Journal'      },
  { path: '/calculator',  icon: <Calculator size={18}/>,      label: 'Calculateur'  },
  { path: '/stats',       icon: <BarChart2 size={18}/>,       label: 'Statistiques' },
  { path: '/profile',     icon: <User size={18}/>,            label: 'Mon Profil'   },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const [open, setOpen]  = useState(true);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={s.wrapper}>
      {/* SIDEBAR */}
      <aside style={{ ...s.sidebar, width: open ? '220px' : '60px' }}>
        {/* Logo */}
        <div style={s.logoBox}>
          <TrendingUp size={22} color="#00d4aa"/>
          {open && <span style={s.logoText}>TPS</span>}
          <button onClick={() => setOpen(!open)} style={s.menuBtn}>
            {open ? <X size={16}/> : <Menu size={16}/>}
          </button>
        </div>

        {/* Navigation */}
        <nav style={s.nav}>
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path}
              style={({ isActive }) => ({
                ...s.navItem,
                background: isActive ? '#00d4aa22' : 'transparent',
                color:      isActive ? '#00d4aa'   : '#9ca3af',
                borderLeft: isActive ? '3px solid #00d4aa' : '3px solid transparent',
              })}>
              {item.icon}
              {open && <span style={s.navLabel}>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User info + Logout */}
        <div style={s.bottomBox}>
          {open && (
            <div style={s.userInfo}>
              <div style={s.userName}>{user?.name}</div>
              <div style={s.userCapital}>💰 {parseFloat(user?.capital || 0).toFixed(2)}$</div>
            </div>
          )}
          <button onClick={handleLogout} style={s.logoutBtn} title="Déconnexion">
            <LogOut size={16}/>
            {open && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* CONTENU PRINCIPAL */}
      <main style={s.main}>
        {children}
      </main>
    </div>
  );
}

const s = {
  wrapper:     { display: 'flex', minHeight: '100vh', background: '#0a0e1a' },
  sidebar:     { background: '#111827', borderRight: '1px solid #1f2937', display: 'flex', flexDirection: 'column', transition: 'width 0.2s', overflow: 'hidden', flexShrink: 0 },
  logoBox:     { display: 'flex', alignItems: 'center', gap: '10px', padding: '20px 16px', borderBottom: '1px solid #1f2937' },
  logoText:    { color: '#fff', fontWeight: '800', fontSize: '16px', flex: 1 },
  menuBtn:     { background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', marginLeft: 'auto', padding: '2px' },
  nav:         { display: 'flex', flexDirection: 'column', gap: '4px', padding: '16px 8px', flex: 1 },
  navItem:     { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '500', transition: 'all 0.15s', whiteSpace: 'nowrap' },
  navLabel:    { overflow: 'hidden' },
  bottomBox:   { padding: '16px', borderTop: '1px solid #1f2937' },
  userInfo:    { marginBottom: '12px' },
  userName:    { color: '#fff', fontSize: '13px', fontWeight: '600' },
  userCapital: { color: '#00d4aa', fontSize: '12px', marginTop: '2px' },
  logoutBtn:   { display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: '1px solid #374151', borderRadius: '8px', color: '#9ca3af', padding: '8px 12px', cursor: 'pointer', fontSize: '13px', width: '100%' },
  main:        { flex: 1, overflow: 'auto', padding: '24px' },
};