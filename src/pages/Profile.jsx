import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import api from '../services/api';
import { User, DollarSign, Save, Mail, TrendingUp } from 'lucide-react';

export default function Profile() {
  const { user }                  = useAuth();
  const { show, ToastComponent }  = useToast();
  const [capital, setCapital]     = useState(user?.capital || 20);
  const [name, setName]           = useState(user?.name || '');
  const [loading, setLoading]     = useState(false);

  const croissance = user?.initial_capital > 0
    ? ((user?.capital / user?.initial_capital - 1) * 100).toFixed(1)
    : 0;

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/profile', { name, capital: parseFloat(capital) });
      show('Profil mis à jour avec succès !', 'success');
    } catch {
      show('Erreur lors de la mise à jour', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <h1 style={s.title}>👤 Mon Profil</h1>

      <div style={s.grid}>
        {/* Formulaire */}
        <div style={s.card}>
          <h3 style={s.cardTitle}>Modifier mes informations</h3>
          <form onSubmit={handleSave} style={s.form}>
            <div>
              <label style={s.label}>Nom complet</label>
              <div style={s.inputWrapper}>
                <User size={16} color="#666" style={s.icon}/>
                <input value={name} onChange={e => setName(e.target.value)} style={s.input} placeholder="Trader Pro"/>
              </div>
            </div>
            <div>
              <label style={s.label}>Capital actuel ($)</label>
              <div style={s.inputWrapper}>
                <DollarSign size={16} color="#666" style={s.icon}/>
                <input type="number" step="0.01" value={capital}
                  onChange={e => setCapital(e.target.value)} style={s.input} placeholder="20"/>
              </div>
              <p style={s.hint}>⚠️ Modifie uniquement si tu veux corriger ton capital manuellement</p>
            </div>
            <button type="submit" style={s.btn} disabled={loading}>
              <Save size={16}/>
              {loading ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
            </button>
          </form>
        </div>

        {/* Infos compte */}
        <div style={s.card}>
          <h3 style={s.cardTitle}>Résumé du compte</h3>
          <div style={s.infoList}>
            {[
              { icon: <Mail size={16}/>,      label: 'Email',           value: user?.email,                        color: '#fff'     },
              { icon: <User size={16}/>,      label: 'Nom',             value: user?.name,                         color: '#fff'     },
              { icon: <DollarSign size={16}/>,label: 'Capital initial', value: `${user?.initial_capital}$`,        color: '#9ca3af'  },
              { icon: <DollarSign size={16}/>,label: 'Capital actuel',  value: `${user?.capital}$`,                color: '#00d4aa'  },
              { icon: <TrendingUp size={16}/>,label: 'Croissance',      value: `+${croissance}%`,                  color: croissance >= 0 ? '#00d4aa' : '#ef4444' },
            ].map((item, i) => (
              <div key={i} style={s.infoRow}>
                <div style={s.infoLeft}>
                  <span style={{ color: '#6b7280' }}>{item.icon}</span>
                  <span style={s.infoLabel}>{item.label}</span>
                </div>
                <span style={{ ...s.infoValue, color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {ToastComponent}
    </div>
  );
}

const s = {
  page:        { maxWidth: '900px', margin: '0 auto' },
  title:       { color: '#fff', fontSize: '22px', fontWeight: '700', marginBottom: '24px' },
  grid:        { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  card:        { background: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '24px' },
  cardTitle:   { color: '#fff', fontSize: '14px', fontWeight: '600', margin: '0 0 20px' },
  form:        { display: 'flex', flexDirection: 'column', gap: '16px' },
  label:       { display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '5px' },
  inputWrapper:{ position: 'relative' },
  icon:        { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' },
  input:       { width: '100%', background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', padding: '10px 12px 10px 36px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' },
  hint:        { color: '#6b7280', fontSize: '11px', marginTop: '4px' },
  btn:         { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'linear-gradient(135deg,#00d4aa,#00a8ff)', color: '#000', fontWeight: '700', border: 'none', borderRadius: '10px', padding: '12px', cursor: 'pointer', fontSize: '14px' },
  infoList:    { display: 'flex', flexDirection: 'column', gap: '12px' },
  infoRow:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#0f172a', borderRadius: '8px' },
  infoLeft:    { display: 'flex', alignItems: 'center', gap: '8px' },
  infoLabel:   { color: '#9ca3af', fontSize: '13px' },
  infoValue:   { fontWeight: '600', fontSize: '13px' },
};