import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import api from '../services/api';
import { User, DollarSign, Save, Mail, TrendingUp, Lock, Eye, EyeOff } from 'lucide-react';

export default function Profile() {
  const { user }                  = useAuth();
  const { show, ToastComponent }  = useToast();

  // Infos profil
  const [capital, setCapital]     = useState(user?.capital || 20);
  const [name, setName]           = useState(user?.name || '');
  const [loading, setLoading]     = useState(false);

  // Mot de passe
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]      = useState('');
  const [confirmPassword, setConfirmPassword]  = useState('');
  const [loadingPwd,      setLoadingPwd]       = useState(false);
  const [showCurrent,     setShowCurrent]      = useState(false);
  const [showNew,         setShowNew]          = useState(false);
  const [showConfirm,     setShowConfirm]      = useState(false);

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

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      show('Remplis tous les champs', 'error');
      return;
    }
    if (newPassword.length < 8) {
      show('Le nouveau mot de passe doit faire au moins 8 caractères', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      show('Les mots de passe ne correspondent pas', 'error');
      return;
    }

    setLoadingPwd(true);
    try {
      await api.put('/profile', {
        current_password: currentPassword,
        password:         newPassword,
        password_confirmation: confirmPassword,
      });
      show('Mot de passe changé avec succès ! 🔐', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Mot de passe actuel incorrect';
      show(msg, 'error');
    } finally {
      setLoadingPwd(false);
    }
  };

  // Force du mot de passe
  const getPasswordStrength = (pwd) => {
    if (!pwd) return null;
    let score = 0;
    if (pwd.length >= 8)  score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 2) return { label: 'Faible',  color: '#ef4444', width: '33%'  };
    if (score <= 3) return { label: 'Moyen',   color: '#f59e0b', width: '66%'  };
    return              { label: 'Fort',    color: '#00d4aa', width: '100%' };
  };

  const strength = getPasswordStrength(newPassword);

  return (
    <div style={s.page}>
      <h1 style={s.title}>👤 Mon Profil</h1>

      <div style={s.grid}>

        {/* Formulaire infos */}
        <div style={s.card}>
          <h3 style={s.cardTitle}>Modifier mes informations</h3>
          <form onSubmit={handleSave} style={s.form}>
            <div>
              <label style={s.label}>Nom complet</label>
              <div style={s.inputWrapper}>
                <User size={16} color="#666" style={s.iconLeft}/>
                <input value={name} onChange={e => setName(e.target.value)}
                  style={s.input} placeholder="Trader Pro"/>
              </div>
            </div>
            <div>
              <label style={s.label}>Capital actuel ($)</label>
              <div style={s.inputWrapper}>
                <DollarSign size={16} color="#666" style={s.iconLeft}/>
                <input type="number" step="0.01" value={capital}
                  onChange={e => setCapital(e.target.value)}
                  style={s.input} placeholder="20"/>
              </div>
              <p style={s.hint}>⚠️ Modifie uniquement si tu veux corriger ton capital manuellement</p>
            </div>
            <button type="submit" style={s.btn} disabled={loading}>
              <Save size={16}/>
              {loading ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
            </button>
          </form>
        </div>

        {/* Résumé compte */}
        <div style={s.card}>
          <h3 style={s.cardTitle}>Résumé du compte</h3>
          <div style={s.infoList}>
            {[
              { icon: <Mail size={16}/>,       label: 'Email',           value: user?.email,                 color: '#fff'    },
              { icon: <User size={16}/>,       label: 'Nom',             value: user?.name,                  color: '#fff'    },
              { icon: <DollarSign size={16}/>, label: 'Capital initial', value: `${user?.initial_capital}$`, color: '#9ca3af' },
              { icon: <DollarSign size={16}/>, label: 'Capital actuel',  value: `${user?.capital}$`,         color: '#00d4aa' },
              { icon: <TrendingUp size={16}/>, label: 'Croissance',      value: `+${croissance}%`,           color: croissance >= 0 ? '#00d4aa' : '#ef4444' },
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

      {/* Section changer mot de passe */}
      <div style={{ ...s.card, marginTop: '20px' }}>
        <h3 style={s.cardTitle}>🔑 Changer mon mot de passe</h3>
        <form onSubmit={handleChangePassword} style={s.pwdForm}>

          {/* Mot de passe actuel */}
          <div>
            <label style={s.label}>Mot de passe actuel</label>
            <div style={s.inputWrapper}>
              <Lock size={16} color="#666" style={s.iconLeft}/>
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                style={s.inputPwd}
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} style={s.eyeBtn}>
                {showCurrent ? <EyeOff size={16} color="#6b7280"/> : <Eye size={16} color="#6b7280"/>}
              </button>
            </div>
          </div>

          {/* Nouveau mot de passe */}
          <div>
            <label style={s.label}>Nouveau mot de passe</label>
            <div style={s.inputWrapper}>
              <Lock size={16} color="#666" style={s.iconLeft}/>
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                style={s.inputPwd}
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowNew(!showNew)} style={s.eyeBtn}>
                {showNew ? <EyeOff size={16} color="#6b7280"/> : <Eye size={16} color="#6b7280"/>}
              </button>
            </div>
            {/* Barre de force */}
            {strength && (
              <div style={s.strengthBox}>
                <div style={s.strengthBar}>
                  <div style={{ ...s.strengthFill, width: strength.width, background: strength.color }}/>
                </div>
                <span style={{ ...s.strengthLabel, color: strength.color }}>{strength.label}</span>
              </div>
            )}
          </div>

          {/* Confirmer mot de passe */}
          <div>
            <label style={s.label}>Confirmer le nouveau mot de passe</label>
            <div style={s.inputWrapper}>
              <Lock size={16} color="#666" style={s.iconLeft}/>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                style={{
                  ...s.inputPwd,
                  borderColor: confirmPassword && confirmPassword !== newPassword ? '#ef4444' : '#374151',
                }}
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={s.eyeBtn}>
                {showConfirm ? <EyeOff size={16} color="#6b7280"/> : <Eye size={16} color="#6b7280"/>}
              </button>
            </div>
            {confirmPassword && confirmPassword !== newPassword && (
              <p style={{ ...s.hint, color: '#ef4444' }}>❌ Les mots de passe ne correspondent pas</p>
            )}
            {confirmPassword && confirmPassword === newPassword && (
              <p style={{ ...s.hint, color: '#00d4aa' }}>✅ Les mots de passe correspondent</p>
            )}
          </div>

          <button type="submit" style={s.pwdBtn} disabled={loadingPwd}>
            <Lock size={16}/>
            {loadingPwd ? 'Modification...' : 'Changer le mot de passe'}
          </button>

        </form>
      </div>

      {ToastComponent}
    </div>
  );
}

const s = {
  page:          { maxWidth: '900px', margin: '0 auto' },
  title:         { color: '#fff', fontSize: '22px', fontWeight: '700', marginBottom: '24px' },
  grid:          { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' },
  card:          { background: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '24px' },
  cardTitle:     { color: '#fff', fontSize: '14px', fontWeight: '600', margin: '0 0 20px' },
  form:          { display: 'flex', flexDirection: 'column', gap: '16px' },
  pwdForm:       { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' },
  label:         { display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '5px' },
  inputWrapper:  { position: 'relative' },
  iconLeft:      { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' },
  input:         { width: '100%', background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', padding: '10px 12px 10px 36px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' },
  inputPwd:      { width: '100%', background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', padding: '10px 40px 10px 36px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' },
  eyeBtn:        { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '0', display: 'flex' },
  hint:          { color: '#6b7280', fontSize: '11px', marginTop: '4px' },
  btn:           { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'linear-gradient(135deg,#00d4aa,#00a8ff)', color: '#000', fontWeight: '700', border: 'none', borderRadius: '10px', padding: '12px', cursor: 'pointer', fontSize: '14px' },
  pwdBtn:        { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'linear-gradient(135deg,#9b6dff,#00a8ff)', color: '#fff', fontWeight: '700', border: 'none', borderRadius: '10px', padding: '12px', cursor: 'pointer', fontSize: '14px', gridColumn: '1 / -1' },
  infoList:      { display: 'flex', flexDirection: 'column', gap: '12px' },
  infoRow:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#0f172a', borderRadius: '8px' },
  infoLeft:      { display: 'flex', alignItems: 'center', gap: '8px' },
  infoLabel:     { color: '#9ca3af', fontSize: '13px' },
  infoValue:     { fontWeight: '600', fontSize: '13px' },
  strengthBox:   { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' },
  strengthBar:   { flex: 1, height: '4px', background: '#1f2937', borderRadius: '99px', overflow: 'hidden' },
  strengthFill:  { height: '100%', borderRadius: '99px', transition: 'width 0.3s, background 0.3s' },
  strengthLabel: { fontSize: '11px', fontWeight: '600', minWidth: '40px' },
};