import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, BookOpen, Calculator,
  BarChart2, LogOut, TrendingUp, Menu, X, User, Brain
} from 'lucide-react';

const navItems = [
  { path: '/dashboard',   icon: <LayoutDashboard size={18}/>, label: 'Dashboard'    },
  { path: '/journal',     icon: <BookOpen size={18}/>,        label: 'Journal'      },
  { path: '/calculator',  icon: <Calculator size={18}/>,      label: 'Calculateur'  },
  { path: '/stats',       icon: <BarChart2 size={18}/>,       label: 'Statistiques' },
  { path: '/profile',     icon: <User size={18}/>,            label: 'Mon Profil'   },
  { path: '/ai-coach', icon: <Brain size={18}/>, label: 'IA Coach' },
];

export default function Layout({ children }) {
  const { user, logout }    = useAuth();
  const navigate            = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <div style={s.wrapper}>

      {/* HEADER MOBILE */}
      <header style={s.mobileHeader}>
        <div style={s.mobileLogoBox}>
          <TrendingUp size={20} color="#00d4aa"/>
          <span style={s.mobileLogoText}>TPS</span>
        </div>
        <div style={s.mobileRight}>
          <span style={s.mobileCapital}>💰 {parseFloat(user?.capital || 0).toFixed(2)}$</span>
          <button onClick={() => setMobileOpen(!mobileOpen)} style={s.burgerBtn}>
            {mobileOpen ? <X size={22} color="#fff"/> : <Menu size={22} color="#fff"/>}
          </button>
        </div>
      </header>

      {/* OVERLAY mobile */}
      {mobileOpen && (
        <div onClick={closeMobile} style={s.overlay}/>
      )}

      {/* SIDEBAR MOBILE (drawer) */}
      <aside style={{
        ...s.drawer,
        transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
      }}>
        <div style={s.drawerHeader}>
          <TrendingUp size={20} color="#00d4aa"/>
          <span style={s.logoText}>TPS Trading</span>
          <button onClick={closeMobile} style={s.closeBtn}>
            <X size={18} color="#6b7280"/>
          </button>
        </div>

        {/* User info */}
        <div style={s.drawerUser}>
          <div style={s.drawerUserName}>{user?.name}</div>
          <div style={s.drawerUserCapital}>💰 {parseFloat(user?.capital || 0).toFixed(2)}$</div>
        </div>

        {/* Navigation */}
        <nav style={s.drawerNav}>
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path}
              onClick={closeMobile}
              style={({ isActive }) => ({
                ...s.navItem,
                background: isActive ? '#00d4aa22' : 'transparent',
                color:      isActive ? '#00d4aa'   : '#9ca3af',
                borderLeft: isActive ? '3px solid #00d4aa' : '3px solid transparent',
              })}>
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button onClick={handleLogout} style={s.logoutBtn}>
          <LogOut size={16}/>
          <span>Déconnexion</span>
        </button>
      </aside>

      {/* SIDEBAR DESKTOP */}
      <aside style={s.desktopSidebar}>
        <div style={s.logoBox}>
          <TrendingUp size={22} color="#00d4aa"/>
          <span style={s.logoText}>TPS</span>
        </div>
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
              <span style={s.navLabel}>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div style={s.bottomBox}>
          <div style={s.userInfo}>
            <div style={s.userName}>{user?.name}</div>
            <div style={s.userCapital}>💰 {parseFloat(user?.capital || 0).toFixed(2)}$</div>
          </div>
          <button onClick={handleLogout} style={s.logoutBtn}>
            <LogOut size={16}/>
            <span>Déconnexion</span>
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
  wrapper:          { display: 'flex', minHeight: '100vh', background: '#0a0e1a', flexDirection: 'column' },

  // Mobile header
  mobileHeader:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#111827', borderBottom: '1px solid #1f2937', position: 'sticky', top: 0, zIndex: 100, '@media(min-width:768px)': { display: 'none' } },
  mobileLogoBox:    { display: 'flex', alignItems: 'center', gap: '8px' },
  mobileLogoText:   { color: '#fff', fontWeight: '800', fontSize: '16px' },
  mobileRight:      { display: 'flex', alignItems: 'center', gap: '12px' },
  mobileCapital:    { color: '#00d4aa', fontSize: '13px', fontWeight: '600' },
  burgerBtn:        { background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' },

  // Overlay
  overlay:          { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200 },

  // Drawer mobile
  drawer:           { position: 'fixed', top: 0, left: 0, width: '280px', height: '100vh', background: '#111827', borderRight: '1px solid #1f2937', zIndex: 300, display: 'flex', flexDirection: 'column', transition: 'transform 0.3s ease', overflowY: 'auto' },
  drawerHeader:     { display: 'flex', alignItems: 'center', gap: '10px', padding: '20px 16px', borderBottom: '1px solid #1f2937' },
  drawerUser:       { padding: '16px', borderBottom: '1px solid #1f2937' },
  drawerUserName:   { color: '#fff', fontSize: '14px', fontWeight: '600' },
  drawerUserCapital:{ color: '#00d4aa', fontSize: '13px', marginTop: '4px' },
  drawerNav:        { display: 'flex', flexDirection: 'column', gap: '4px', padding: '16px 8px', flex: 1 },
  closeBtn:         { background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' },

  // Desktop sidebar
  desktopSidebar:   { width: '220px', background: '#111827', borderRight: '1px solid #1f2937', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  logoBox:          { display: 'flex', alignItems: 'center', gap: '10px', padding: '20px 16px', borderBottom: '1px solid #1f2937' },
  logoText:         { color: '#fff', fontWeight: '800', fontSize: '16px' },
  nav:              { display: 'flex', flexDirection: 'column', gap: '4px', padding: '16px 8px', flex: 1 },
  navItem:          { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '500', transition: 'all 0.15s', whiteSpace: 'nowrap' },
  navLabel:         { overflow: 'hidden' },
  bottomBox:        { padding: '16px', borderTop: '1px solid #1f2937' },
  userInfo:         { marginBottom: '12px' },
  userName:         { color: '#fff', fontSize: '13px', fontWeight: '600' },
  userCapital:      { color: '#00d4aa', fontSize: '12px', marginTop: '2px' },
  logoutBtn:        { display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: '1px solid #374151', borderRadius: '8px', color: '#9ca3af', padding: '8px 12px', cursor: 'pointer', fontSize: '13px', width: '100%' },
  main:             { flex: 1, overflow: 'auto', padding: '16px' },
};