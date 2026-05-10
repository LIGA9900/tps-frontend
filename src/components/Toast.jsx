import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

const ICONS = {
  success: <CheckCircle size={18} color="#00d4aa"/>,
  error:   <XCircle size={18} color="#ef4444"/>,
  warning: <AlertCircle size={18} color="#f59e0b"/>,
};

const COLORS = {
  success: '#00d4aa',
  error:   '#ef4444',
  warning: '#f59e0b',
};

export function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: '10px',
      background: '#111827',
      border: `1px solid ${COLORS[type]}44`,
      borderLeft: `4px solid ${COLORS[type]}`,
      borderRadius: '10px', padding: '12px 16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      minWidth: '260px', maxWidth: '360px',
      animation: 'slideIn 0.3s ease',
    }}>
      {ICONS[type]}
      <span style={{ color: '#fff', fontSize: '13px', flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
        <X size={14}/>
      </button>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100px); opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState(null);
  const show = (message, type = 'success') => setToast({ message, type });
  const hide = () => setToast(null);
  const ToastComponent = toast ? <Toast {...toast} onClose={hide}/> : null;
  return { show, ToastComponent };
}