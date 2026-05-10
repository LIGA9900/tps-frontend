import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Vérifier si l'utilisateur est connecté au démarrage
  useEffect(() => {
    const token = localStorage.getItem('tps_token');
    if (token) {
      api.get('/me')
        .then(res => setUser(res.data))
        .catch(() => localStorage.removeItem('tps_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Connexion
  const login = async (email, password) => {
    const res = await api.post('/login', { email, password });
    localStorage.setItem('tps_token', res.data.token);
    localStorage.setItem('tps_capital', res.data.user.capital);
    setUser(res.data.user);
    return res.data;
  };

  // Inscription
  const register = async (name, email, password, capital) => {
    const res = await api.post('/register', {
      name, email, password,
      password_confirmation: password,
      capital,
    });
    localStorage.setItem('tps_token', res.data.token);
    localStorage.setItem('tps_capital', res.data.user.capital);
    setUser(res.data.user);
    return res.data;
  };

  // Déconnexion
  const logout = async () => {
    await api.post('/logout');
    localStorage.removeItem('tps_token');
    localStorage.removeItem('tps_capital');
    setUser(null);
  };

  // ✅ NOUVEAU : Rafraîchir les données utilisateur (capital, etc.)
  const refreshUser = async () => {
    try {
      const res = await api.get('/me');
      setUser(res.data);
      localStorage.setItem('tps_capital', res.data.capital);
      return res.data;
    } catch (err) {
      console.error('Erreur refreshUser:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);