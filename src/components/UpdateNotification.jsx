import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

export default function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Vérifier les mises à jour toutes les 30 secondes
    const checkUpdate = setInterval(() => {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) reg.update();
      });
    }, 30000);

    // Détecter quand une nouvelle version est disponible
    navigator.serviceWorker.ready.then(reg => {
      setRegistration(reg);

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[SW] Nouvelle version disponible !');
            setShowUpdate(true);
          }
        });
      });
    });

    // Recharger automatiquement quand le SW change
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    return () => clearInterval(checkUpdate);
  }, []);

  const handleUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage('SKIP_WAITING');
    }
    setShowUpdate(false);
  };

  if (!showUpdate) return null;

  return (
    <div style={s.container}>
      <div style={s.icon}>🚀</div>
      <div style={s.text}>
        <div style={s.title}>Mise à jour disponible</div>
        <div style={s.subtitle}>Une nouvelle version du TPS est prête</div>
      </div>
      <button onClick={handleUpdate} style={s.updateBtn}>
        <RefreshCw size={14}/>
        Mettre à jour
      </button>
      <button onClick={() => setShowUpdate(false)} style={s.closeBtn}>
        <X size={16}/>
      </button>
    </div>
  );
}

const s = {
  container: {
    position: 'fixed',
    bottom: '80px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: '#111827',
    border: '1px solid #00d4aa44',
    borderLeft: '4px solid #00d4aa',
    borderRadius: '12px',
    padding: '12px 16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    width: '90%',
    maxWidth: '380px',
    animation: 'slideUp 0.3s ease',
  },
  icon:      { fontSize: '20px', flexShrink: 0 },
  text:      { flex: 1 },
  title:     { color: '#fff', fontSize: '13px', fontWeight: '600' },
  subtitle:  { color: '#6b7280', fontSize: '11px', marginTop: '2px' },
  updateBtn: {
    display: 'flex', alignItems: 'center', gap: '6px',
    background: 'linear-gradient(135deg,#00d4aa,#00a8ff)',
    color: '#000', fontWeight: '700', border: 'none',
    borderRadius: '8px', padding: '8px 12px',
    cursor: 'pointer', fontSize: '12px', flexShrink: 0,
  },
  closeBtn: {
    background: 'none', border: 'none',
    color: '#6b7280', cursor: 'pointer',
    padding: '4px', flexShrink: 0,
  },
};