import { usePrice } from '../hooks/usePrice';
import { RefreshCw, TrendingUp, TrendingDown, Zap } from 'lucide-react';

export default function PriceWidget({ asset, onUsePrice }) {
  const { price, loading, error, lastUpdate, refresh } = usePrice(asset);

  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const isPositive = price?.change >= 0;

  return (
    <div style={s.container}>

      {/* Header */}
      <div style={s.header}>
        <div style={s.assetBadge}>
          <Zap size={12} color="#f59e0b"/>
          <span style={s.assetName}>{asset}</span>
          <span style={s.live}>LIVE</span>
        </div>
        <button onClick={refresh} style={s.refreshBtn} disabled={loading} title="Actualiser">
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}/>
        </button>
      </div>

      {/* Prix */}
      {loading && !price && (
        <div style={s.loadingBox}>
          <div style={s.loadingDot}/>
          <span style={s.loadingText}>Chargement du prix...</span>
        </div>
      )}

      {error && (
        <div style={s.errorBox}>
          ⚠️ {error} — <span style={{cursor:'pointer', textDecoration:'underline'}} onClick={refresh}>Réessayer</span>
        </div>
      )}

      {price && (
        <>
          {/* Prix principal */}
          <div style={s.priceRow}>
            <span style={s.currentPrice}>{price.current.toFixed(2)}</span>
            <div style={{ ...s.changeBadge, background: isPositive ? '#00d4aa22' : '#ef444422', color: isPositive ? '#00d4aa' : '#ef4444' }}>
              {isPositive ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
              <span>{isPositive ? '+' : ''}{price.change} ({isPositive ? '+' : ''}{price.changePct}%)</span>
            </div>
          </div>

          {/* Stats OHLC */}
          <div style={s.statsRow}>
            <div style={s.stat}>
              <span style={s.statLabel}>Ouv.</span>
              <span style={s.statValue}>{price.open.toFixed(2)}</span>
            </div>
            <div style={s.stat}>
              <span style={s.statLabel}>Haut</span>
              <span style={{...s.statValue, color:'#00d4aa'}}>{price.high.toFixed(2)}</span>
            </div>
            <div style={s.stat}>
              <span style={s.statLabel}>Bas</span>
              <span style={{...s.statValue, color:'#ef4444'}}>{price.low.toFixed(2)}</span>
            </div>
          </div>

          {/* Bouton utiliser ce prix */}
          <button onClick={() => onUsePrice(price.current)} style={s.useBtn}>
            ✅ Utiliser {price.current.toFixed(2)} comme prix d'entrée
          </button>

          {/* Dernière mise à jour */}
          {lastUpdate && (
            <div style={s.updateTime}>
              Mis à jour à {formatTime(lastUpdate)} · Auto-refresh 30s
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}

const s = {
  container:    { background: '#0f172a', border: '1px solid #00d4aa33', borderRadius: '12px', padding: '14px', marginBottom: '14px' },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  assetBadge:   { display: 'flex', alignItems: 'center', gap: '6px' },
  assetName:    { color: '#fff', fontWeight: '700', fontSize: '14px' },
  live:         { background: '#ef4444', color: '#fff', fontSize: '9px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', animation: 'pulse 2s infinite' },
  refreshBtn:   { background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '4px', display: 'flex' },

  loadingBox:   { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' },
  loadingDot:   { width: '8px', height: '8px', background: '#00d4aa', borderRadius: '50%', animation: 'pulse 1s infinite' },
  loadingText:  { color: '#6b7280', fontSize: '12px' },

  errorBox:     { color: '#f59e0b', fontSize: '12px', padding: '8px', background: '#f59e0b11', borderRadius: '8px' },

  priceRow:     { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' },
  currentPrice: { color: '#fff', fontSize: '26px', fontWeight: '800', letterSpacing: '-0.5px' },
  changeBadge:  { display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: '600' },

  statsRow:     { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' },
  stat:         { background: '#1f2937', borderRadius: '8px', padding: '6px 10px', textAlign: 'center' },
  statLabel:    { display: 'block', color: '#6b7280', fontSize: '10px', marginBottom: '2px' },
  statValue:    { color: '#fff', fontSize: '12px', fontWeight: '600' },

  useBtn:       { width: '100%', background: 'linear-gradient(135deg,#00d4aa22,#00a8ff22)', border: '1px solid #00d4aa44', color: '#00d4aa', borderRadius: '8px', padding: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  updateTime:   { color: '#374151', fontSize: '10px', textAlign: 'center', marginTop: '8px' },
};