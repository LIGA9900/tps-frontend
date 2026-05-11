import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import Layout     from './components/Layout';
import Login      from './pages/Login';
import Register   from './pages/Register';
import Dashboard  from './pages/Dashboard';
import Journal    from './pages/Journal';
import Calculator from './pages/Calculator';
import Stats      from './pages/Stats';
import Profile    from './pages/Profile';
import { useEffect, useState } from 'react';
import UpdateNotification from './components/UpdateNotification';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{
      color: '#00d4aa', textAlign: 'center',
      paddingTop: '100px', fontSize: '16px',
      background: '#0a0e1a', minHeight: '100vh'
    }}>
      Chargement...
    </div>
  );
  return user
    ? <DataProvider><LayoutResponsive>{children}</LayoutResponsive></DataProvider>
    : <Navigate to="/login"/>;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login"      element={user ? <Navigate to="/dashboard"/> : <Login/>}/>
      <Route path="/register"   element={user ? <Navigate to="/dashboard"/> : <Register/>}/>
      <Route path="/dashboard"  element={<PrivateRoute><Dashboard/></PrivateRoute>}/>
      <Route path="/journal"    element={<PrivateRoute><Journal/></PrivateRoute>}/>
      <Route path="/calculator" element={<PrivateRoute><Calculator/></PrivateRoute>}/>
      <Route path="/stats"      element={<PrivateRoute><Stats/></PrivateRoute>}/>
      <Route path="/profile"    element={<PrivateRoute><Profile/></PrivateRoute>}/>
      <Route path="*"           element={<Navigate to="/dashboard"/>}/>
    </Routes>
  );
}

function LayoutResponsive({ children }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return <Layout isMobile={isMobile}>{children}</Layout>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <UpdateNotification />
      </AuthProvider>
    </BrowserRouter>
  );
}