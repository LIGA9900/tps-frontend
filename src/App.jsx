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

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ color: '#00d4aa', textAlign: 'center', paddingTop: '100px', fontSize: '16px' }}>
      Chargement...
    </div>
  );
  // DataProvider est à l'intérieur de PrivateRoute
  // pour n'être actif que quand l'utilisateur est connecté
  return user
    ? <DataProvider><Layout>{children}</Layout></DataProvider>
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

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}