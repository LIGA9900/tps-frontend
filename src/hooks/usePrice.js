import { useState, useEffect, useCallback } from 'react';

const TWELVEDATA_KEY = import.meta.env.VITE_TWELVEDATA_KEY;

// Symboles TwelveData
const SYMBOLS = {
  'XAUUSD': 'XAU/USD',
  'XAGUSD': 'XAG/USD',
  'EURUSD': 'EUR/USD',
  'GBPUSD': 'GBP/USD',
  'USDJPY': 'USD/JPY',
  'GBPJPY': 'GBP/JPY',
  'BTCUSD': 'BTC/USD',
  'NAS100': 'NDX',
  'US30':   'DJI',
};

export function usePrice(asset) {
  const [price, setPrice]           = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchPrice = useCallback(async () => {
    if (!TWELVEDATA_KEY) {
      setError('Clé API manquante');
      return;
    }

    const symbol = SYMBOLS[asset];
    if (!symbol) {
      setError('Actif non supporté');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Récupérer prix actuel ET stats du jour
      const [priceRes, statsRes] = await Promise.all([
        fetch(`https://api.twelvedata.com/price?symbol=${symbol}&apikey=${TWELVEDATA_KEY}`),
        fetch(`https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${TWELVEDATA_KEY}`),
      ]);

      const priceData = await priceRes.json();
      const statsData = await statsRes.json();

      if (priceData.price) {
        const current  = parseFloat(parseFloat(priceData.price).toFixed(2));
        const open     = parseFloat(parseFloat(statsData.open   || current).toFixed(2));
        const high     = parseFloat(parseFloat(statsData.high   || current).toFixed(2));
        const low      = parseFloat(parseFloat(statsData.low    || current).toFixed(2));
        const close    = parseFloat(parseFloat(statsData.previous_close || current).toFixed(2));
        const change   = parseFloat((current - close).toFixed(2));
        const changePct= parseFloat(((current - close) / close * 100).toFixed(2));

        setPrice({ current, open, high, low, change, changePct });
        setLastUpdate(new Date());
      } else {
        setError('Prix non disponible');
      }
    } catch {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }, [asset]);

  useEffect(() => { fetchPrice(); }, [fetchPrice]);

  // Rafraîchir toutes les 60 secondes
  useEffect(() => {
    const interval = setInterval(fetchPrice, 60000);
    return () => clearInterval(interval);
  }, [fetchPrice]);

  return { price, loading, error, lastUpdate, refresh: fetchPrice };
}