import { useState, useEffect, useCallback } from 'react';

const FINNHUB_KEY = import.meta.env.VITE_FINNHUB_KEY;

// Mapping des actifs vers les symboles Finnhub
const SYMBOLS = {
  'XAUUSD': 'OANDA:XAU_USD',
  'EURUSD': 'OANDA:EUR_USD',
  'GBPUSD': 'OANDA:GBP_USD',
  'USDJPY': 'OANDA:USD_JPY',
  'BTCUSD': 'BINANCE:BTCUSDT',
  'NAS100': 'OANDA:NAS100_USD',
  'US30':   'OANDA:US30_USD',
  'GBPJPY': 'OANDA:GBP_JPY',
};

export function usePrice(asset) {
  const [price, setPrice]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchPrice = useCallback(async () => {
    if (!asset || !FINNHUB_KEY) return;

    const symbol = SYMBOLS[asset];
    if (!symbol) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`
      );
      const data = await res.json();

      if (data.c && data.c > 0) {
        setPrice({
          current:  data.c,  // Prix actuel
          open:     data.o,  // Prix d'ouverture
          high:     data.h,  // Plus haut
          low:      data.l,  // Plus bas
          change:   parseFloat((data.c - data.pc).toFixed(2)),
          changePct: parseFloat(((data.c - data.pc) / data.pc * 100).toFixed(2)),
        });
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

  // Charger au montage et à chaque changement d'actif
  useEffect(() => {
    fetchPrice();
  }, [fetchPrice]);

  // Rafraîchir automatiquement toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(fetchPrice, 30000);
    return () => clearInterval(interval);
  }, [fetchPrice]);

  return { price, loading, error, lastUpdate, refresh: fetchPrice };
}