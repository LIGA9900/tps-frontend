import { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [dashboard, setDashboard] = useState(null);
  const [trades, setTrades]       = useState([]);
  const [loading, setLoading]     = useState(false);

  // Fonction centrale de rafraîchissement — appelée après chaque action
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, tradesRes] = await Promise.all([
        api.get('/dashboard'),
        api.get('/trades'),
      ]);
      setDashboard(dashRes.data);
      setTrades(tradesRes.data);
    } catch (err) {
      console.error('Erreur refresh:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <DataContext.Provider value={{ dashboard, trades, loading, refresh }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);