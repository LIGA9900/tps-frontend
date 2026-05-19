import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../components/Toast';
import api from '../services/api';
import { User, DollarSign, Save, Mail, TrendingUp, Lock, Eye, EyeOff } from 'lucide-react';

// ── Définition des badges ─────────────────────────────────────────────────────
const BADGES = [
  // Capital
  { id: 'first_step',  emoji: '🌱', label: 'Premier Pas',    desc: 'Capital > 50$',            category: 'Capital',    check: (u,t,s) => u.capital >= 50    },
  { id: 'liftoff',     emoji: '🚀', label: 'Décollage',      desc: 'Capital > 100$',           category: 'Capital',    check: (u,t,s) => u.capital >= 100   },
  { id: 'century',     emoji: '💎', label: 'Century',        desc: 'Capital > 200$',           category: 'Capital',    check: (u,t,s) => u.capital >= 200   },
  { id: 'elite',       emoji: '👑', label: 'Elite',          desc: 'Capital > 500$',           category: 'Capital',    check: (u,t,s) => u.capital >= 500   },
  { id: 'legend',      emoji: '🏆', label: 'Légende',        desc: 'Capital > 1000$',          category: 'Capital',    check: (u,t,s) => u.capital >= 1000  },

  // Trading
  { id: 'first_trade', emoji: '🎯', label: 'Premier Trade',  desc: '1 trade enregistré',       category: 'Trading',    check: (u,t,s) => t.length >= 1      },
  { id: 'five_wins',   emoji: '🔥', label: 'En Feu',         desc: '5 trades gagnants',        category: 'Trading',    check: (u,t,s) => t.filter(x => x.result === 'WIN').length >= 5 },
  { id: 'ten_trades',  emoji: '📊', label: 'Régulier',       desc: '10 trades journalisés',    category: 'Trading',    check: (u,t,s) => t.length >= 10     },
  { id: 'fifty_trades',emoji: '⚡', label: 'Machine',        desc: '50 trades journalisés',    category: 'Trading',    check: (u,t,s) => t.length >= 50     },
  { id: 'sniper',      emoji: '🎖️', label: 'Sniper',         desc: 'Winrate > 70%',            category: 'Trading',    check: (u,t,s) => parseFloat(s.winrate) >= 70 },
  { id: 'strategist',  emoji: '🧠', label: 'Stratège',       desc: 'RR moyen > 3',             category: 'Trading',    check: (u,t,s) => parseFloat(s.avg_rr) >= 3  },
  { id: 'profit_factor',emoji: '💰',label: 'Rentable',       desc: 'Profit Factor > 2',        category: 'Trading',    check: (u,t,s) => parseFloat(s.profit_factor) >= 2 },

  // Discipline
  { id: 'screenshot',  emoji: '📸', label: 'Analyste',       desc: '5 screenshots uploadés',   category: 'Discipline', check: (u,t,s) => t.filter(x => x.screenshot).length >= 5 },
  { id: 'no_loss',     emoji: '🛡️', label: 'Blindé',         desc: '5 trades sans perte consécutifs', category: 'Discipline', check: (u,t,s) => {
    let count = 0;
    for (let i = 0; i < t.length; i++) {
      if (t[i].result !== 'LOSS') count++;
      else break;
    }
    return count >= 5;
  }},
  { id: 'growth_100',  emoji: '📈', label: 'Croissance 100%', desc: 'Doubler son capital',     category: 'Discipline', check: (u,t,s) => u.capital >= u.initial_capital * 2 },
];

function computeBadges(user, trades, stats) {
  return BADGES.map(badge => ({
    ...badge,
    unlocked: badge.check(user, trades, stats),
  }));
}
// ─────────────────────────────────────────────────────────────────────────────

export default function Profile() {
  const { user }                 = useAuth();
  const { trades, dashboard }    = useData();
  const { show, ToastComponent } = useToast();

  const [capital, setCapital]    = useState(user?.capital || 20);
  const [name,    setName]       = useState(user?.name    || '');
  const [loading, setLoading]    = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]      = useState('');
  const [confirmPassword, setConfirmPassword]  = useState('');
  const [loadingPwd,      setLoadingPwd]       = useState(false);
  const [showCurrent,     setShowCurrent]      = useState(false);
  const [showNew,         setShowNew]          = useState(false);
  const [showConfirm,     setShowConfirm]      = useState(false);

  const stats     = dashboard?.stats || {};
  const allTrades = trades           || [];
  const badges    = user ? computeBadges(user, allTrades, stats) : [];

  const unlockedCount = badges.filter(b => b.unlocked).length;
  const categories    = [...new Set(BADGES.map(b => b.category))];

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
      show('Remplis tous les champs', 'error'); return;
    }
    if (newPassword.length < 8) {
      show('Le nouveau mot de passe doit faire au moins 8 caractères', 'error'); return;
    }
    if (newPassword !== confirmPassword) {
      show('Les mots de passe ne correspondent pas', 'error'); return;
    }
    setLoadingPwd(true);
    try {
      await api.put('/profile', {
        current_password:      currentPassword,
        password:              newPassword,
        password_confirmation: confirmPassword,
      });
      show('Mot de passe changé avec succès ! 🔐', 'success');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      show(err?.response?.data?.message || 'Mot de passe actuel incorrect', 'error');
    } finally {
      setLoadingPwd(false);
    }
  };

  const getPasswordStrength = (pwd) => {
    if (!pwd) return null;
    let score = 0;
    if (pwd.length >= 8)           score++;
    if (pwd.length >= 12)          score++;
    if (/[A-Z]/.test(pwd))         score++;
    if (/[0-9]/.test(pwd))         score++;
    if (/[^A-Za-z0-9]/.test(pwd))  score++;
    if (score <= 2) return { label: 'Faible', color: '#ef4444', width: '33%'  };
    if (score <= 3) return { label: 'Moyen',  color: '#f59e0b', width: '66%'  };
    return                 { label: 'Fort',   color: '#00d4aa', width: '100%' };
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

      {/* ── SECTION BADGES ── */}
      <div style={{ ...s.card, marginTop: '20px' }}>

        {/* Header badges */}
        <div style={b.header}>
          <div>
            <h3 style={s.cardTitle}>🏆 Mes Badges</h3>
            <p style={b.subtitle}>
              {unlockedCount} / {badges.length} badges débloqués
            </p>
          </div>
          <div style={b.progressCircle}>
            <svg width="60" height="60" viewBox="0 0 60 60">
              <circle cx="30" cy="30" r="24" fill="none" stroke="#1f2937" strokeWidth="6"/>
              <circle cx="30" cy="30" r="24" fill="none" stroke="#00d4aa" strokeWidth="6"
                strokeDasharray={`${(unlockedCount / badges.length) * 150.8} 150.8`}
                strokeLinecap="round"
                transform="rotate(-90 30 30)"
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
            </svg>
            <div style={b.circleText}>
              <span style={b.circleValue}>{Math.round((unlockedCount / badges.length) * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Badges par catégorie */}
        {categories.map(category => (
          <div key={category} style={b.categoryBlock}>
            <div style={b.categoryTitle}>
              {category === 'Capital'   && '💰'}
              {category === 'Trading'   && '📈'}
              {category === 'Discipline'&& '🎓'}
              {' '}{category}
            </div>
            <div style={b.badgesGrid}>
              {badges.filter(badge => badge.category === category).map(badge => (
                <div key={badge.id} style={{
                  ...b.badgeCard,
                  background:  badge.unlocked ? '#00d4aa11' : '#0f172a',
                  border:      `1px solid ${badge.unlocked ? '#00d4aa44' : '#1f2937'}`,
                  opacity:     badge.unlocked ? 1 : 0.5,
                }}>
                  <div style={{
                    ...b.badgeEmoji,
                    filter: badge.unlocked ? 'none' : 'grayscale(100%)',
                  }}>
                    {badge.emoji}
                  </div>
                  <div style={b.badgeLabel}>{badge.label}</div>
                  <div style={b.badgeDesc}>{badge.desc}</div>
                  {badge.unlocked && (
                    <div style={b.unlockedTag}>✓ Débloqué</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Section changer mot de passe */}
      <div style={{ ...s.card, marginTop: '20px' }}>
        <h3 style={s.cardTitle}>🔑 Changer mon mot de passe</h3>
        <form onSubmit={handleChangePassword} style={s.pwdForm}>
          <div>
            <label style={s.label}>Mot de passe actuel</label>
            <div style={s.inputWrapper}>
              <Lock size={16} color="#666" style={s.iconLeft}/>
              <input type={showCurrent ? 'text' : 'password'} value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                style={s.inputPwd} placeholder="••••••••"/>
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} style={s.eyeBtn}>
                {showCurrent ? <EyeOff size={16} color="#6b7280"/> : <Eye size={16} color="#6b7280"/>}
              </button>
            </div>
          </div>
          <div>
            <label style={s.label}>Nouveau mot de passe</label>
            <div style={s.inputWrapper}>
              <Lock size={16} color="#666" style={s.iconLeft}/>
              <input type={showNew ? 'text' : 'password'} value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                style={s.inputPwd} placeholder="••••••••"/>
              <button type="button" onClick={() => setShowNew(!showNew)} style={s.eyeBtn}>
                {showNew ? <EyeOff size={16} color="#6b7280"/> : <Eye size={16} color="#6b7280"/>}
              </button>
            </div>
            {strength && (
              <div style={s.strengthBox}>
                <div style={s.strengthBar}>
                  <div style={{ ...s.strengthFill, width: strength.width, background: strength.color }}/>
                </div>
                <span style={{ ...s.strengthLabel, color: strength.color }}>{strength.label}</span>
              </div>
            )}
          </div>
          <div>
            <label style={s.label}>Confirmer le nouveau mot de passe</label>
            <div style={s.inputWrapper}>
              <Lock size={16} color="#666" style={s.iconLeft}/>
              <input type={showConfirm ? 'text' : 'password'} value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                style={{ ...s.inputPwd, borderColor: confirmPassword && confirmPassword !== newPassword ? '#ef4444' : '#374151' }}
                placeholder="••••••••"/>
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

// Styles badges
const b = {
  header:        { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'20px' },
  subtitle:      { color:'#6b7280', fontSize:'12px', marginTop:'4px' },
  progressCircle:{ position:'relative', width:'60px', height:'60px', flexShrink:0 },
  circleText:    { position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' },
  circleValue:   { color:'#00d4aa', fontSize:'12px', fontWeight:'700' },
  categoryBlock: { marginBottom:'20px' },
  categoryTitle: { color:'#9ca3af', fontSize:'12px', fontWeight:'600', marginBottom:'10px', textTransform:'uppercase', letterSpacing:'0.05em' },
  badgesGrid:    { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(130px, 1fr))', gap:'10px' },
  badgeCard:     { borderRadius:'12px', padding:'14px', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap:'6px', transition:'all 0.2s' },
  badgeEmoji:    { fontSize:'28px', marginBottom:'2px' },
  badgeLabel:    { color:'#fff', fontSize:'12px', fontWeight:'700' },
  badgeDesc:     { color:'#6b7280', fontSize:'10px', lineHeight:'1.4' },
  unlockedTag:   { background:'#00d4aa22', color:'#00d4aa', fontSize:'10px', fontWeight:'600', padding:'2px 8px', borderRadius:'99px', marginTop:'2px' },
};

const s = {
  page:          { maxWidth: '900px', margin: '0 auto' },
  title:         { color: '#fff', fontSize: '22px', fontWeight: '700', marginBottom: '24px' },
  grid:          { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' },
  card:          { background: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '24px' },
  cardTitle:     { color: '#fff', fontSize: '14px', fontWeight: '600', margin: '0 0 4px' },
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