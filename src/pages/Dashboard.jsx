import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, Target, Award, AlertTriangle, Activity, Clock } from 'lucide-react';

const formatDate = (dateStr) => {
  if (!dateStr || dateStr === 'Début') return 'Début';
  const d = new Date(dateStr);
  return isNaN(d) ? dateStr : `${d.getDate()}/${d.getMonth() + 1}`;
};

// ── Sessions de trading ───────────────────────────────────────────────────────
function getSessionsInfo() {
  const now     = new Date();
  const utcHour = now.getUTCHours();
  const utcMin  = now.getUTCMinutes();
  const utcTotal = utcHour * 60 + utcMin; // minutes depuis minuit UTC

  const sessions = [
    { name: 'Tokyo',    icon: '🌏', start: 0,   end: 540,  color: '#f59e0b' },
    { name: 'Londres',  icon: '🏦', start: 420, end: 960,  color: '#00a8ff' },
    { name: 'New York', icon: '🗽', start: 720, end: 1260, color: '#9b6dff' },
  ];

  const activeSessions = sessions.filter(s => utcTotal >= s.start && utcTotal < s.end);
  const isOverlap      = activeSessions.length >= 2;

  // Prochaine session
  let nextSession = null;
  let minWait     = Infinity;
  sessions.forEach(s => {
    let wait = s.start - utcTotal;
    if (wait <= 0) wait += 1440; // lendemain
    if (wait < minWait) { minWait = wait; nextSession = s; }
  });

  // Liquidité
  let liquidity, liquidityColor;
  if (isOverlap) {
    liquidity      = 'MAXIMALE ⚡';
    liquidityColor = '#00d4aa';
  } else if (activeSessions.length === 1) {
    liquidity      = 'FORTE 📈';
    liquidityColor = '#00a8ff';
  } else {
    liquidity      = 'FAIBLE 😴';
    liquidityColor = '#6b7280';
  }

  // Recommandation
  let recommendation, recColor;
  if (isOverlap) {
    recommendation = '🔥 Meilleur moment pour trader XAUUSD !';
    recColor       = '#00d4aa';
  } else if (activeSessions.find(s => s.name === 'Londres' || s.name === 'New York')) {
    recommendation = '✅ Bon moment pour trader';
    recColor       = '#00a8ff';
  } else {
    recommendation = '⏳ Attends la session Londres ou New York';
    recColor       = '#f59e0b';
  }

  // Compte à rebours prochaine session inactive
  const nextInactive = sessions.find(s => !activeSessions.includes(s));
  const countdown    = minWait;
  const countHours   = Math.floor(countdown / 60);
  const countMins    = countdown % 60;

  return {
    activeSessions,
    isOverlap,
    liquidity,
    liquidityColor,
    recommendation,
    recColor,
    nextSession,
    countdown: `${countHours}h${countMins.toString().padStart(2,'0')}min`,
    utcTime: `${String(utcHour).padStart(2,'0')}:${String(now.getUTCMinutes()).padStart(2,'0')} UTC`,
  };
}

function SessionsWidget() {
  const [info, setInfo] = useState(getSessionsInfo());

  // Mise à jour chaque minute
  useEffect(() => {
    const interval = setInterval(() => setInfo(getSessionsInfo()), 60000);
    return () => clearInterval(interval);
  }, []);

  const allSessions = [
    { name: 'Tokyo',    icon: '🌏', start: '00h00', end: '09h00', color: '#f59e0b' },
    { name: 'Londres',  icon: '🏦', start: '07h00', end: '16h00', color: '#00a8ff' },
    { name: 'New York', icon: '🗽', start: '12h00', end: '21h00', color: '#9b6dff' },
  ];

  const isActive = (name) => info.activeSessions.some(s => s.name === name);

  return (
    <div style={sw.card}>

      {/* Header widget */}
      <div style={sw.header}>
        <div style={sw.headerLeft}>
          <Clock size={16} color="#00d4aa"/>
          <span style={sw.headerTitle}>Sessions de Trading</span>
        </div>
        <span style={sw.utcTime}>{info.utcTime}</span>
      </div>

      {/* Sessions */}
      <div style={sw.sessionsRow}>
        {allSessions.map(session => (
          <div key={session.name} style={{
            ...sw.sessionBadge,
            background:  isActive(session.name) ? session.color + '22' : '#1f2937',
            border:      `1px solid ${isActive(session.name) ? session.color + '66' : '#374151'}`,
            color:       isActive(session.name) ? session.color : '#6b7280',
          }}>
            {/* Point pulsant si actif */}
            {isActive(session.name) && (
              <span style={sw.pulse}>
                <span style={{...sw.pulseDot, background: session.color}}/>
                <span style={{...sw.pulseRing, borderColor: session.color}}/>
              </span>
            )}
            <span style={sw.sessionIcon}>{session.icon}</span>
            <div style={sw.sessionInfo}>
              <span style={sw.sessionName}>{session.name}</span>
              <span style={sw.sessionTime}>{session.start} – {session.end}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Overlap badge */}
      {info.isOverlap && (
        <div style={sw.overlapBadge}>
          🔥 Overlap Londres / New York — Liquidité maximale
        </div>
      )}

      {/* Liquidité + recommandation */}
      <div style={sw.infoRow}>
        <div style={sw.infoItem}>
          <span style={sw.infoLabel}>Liquidité</span>
          <span style={{...sw.infoValue, color: info.liquidityColor}}>{info.liquidity}</span>
        </div>
        <div style={sw.divider}/>
        <div style={sw.infoItem}>
          <span style={sw.infoLabel}>Prochaine session</span>
          <span style={sw.infoValue}>
            {info.nextSession?.icon} {info.nextSession?.name} dans {info.countdown}
          </span>
        </div>
        <div style={sw.divider}/>
        <div style={{...sw.infoItem, flex: 2}}>
          <span style={{...sw.recommendation, color: info.recColor}}>
            {info.recommendation}
          </span>
        </div>
      </div>

    </div>
  );
}

const sw = {
  card:           { background:'#111827', border:'1px solid #1f2937', borderRadius:'12px', padding:'16px', marginBottom:'16px' },
  header:         { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' },
  headerLeft:     { display:'flex', alignItems:'center', gap:'8px' },
  headerTitle:    { color:'#fff', fontSize:'14px', fontWeight:'600' },
  utcTime:        { color:'#6b7280', fontSize:'12px', fontFamily:'monospace' },
  sessionsRow:    { display:'flex', gap:'8px', marginBottom:'12px', flexWrap:'wrap' },
  sessionBadge:   { display:'flex', alignItems:'center', gap:'8px', padding:'8px 12px', borderRadius:'10px', flex:1, minWidth:'120px', position:'relative', overflow:'hidden' },
  pulse:          { position:'relative', width:'10px', height:'10px', flexShrink:0 },
  pulseDot:       { position:'absolute', inset:0, borderRadius:'50%', opacity:0.9 },
  pulseRing:      { position:'absolute', inset:'-3px', borderRadius:'50%', border:'2px solid', animation:'sessionPulse 1.5s infinite' },
  sessionIcon:    { fontSize:'16px', flexShrink:0 },
  sessionInfo:    { display:'flex', flexDirection:'column', gap:'1px' },
  sessionName:    { fontSize:'12px', fontWeight:'700' },
  sessionTime:    { fontSize:'10px', opacity:0.7 },
  overlapBadge:   { background:'#00d4aa11', border:'1px solid #00d4aa33', borderRadius:'8px', padding:'8px 12px', color:'#00d4aa', fontSize:'12px', fontWeight:'600', textAlign:'center', marginBottom:'10px' },
  infoRow:        { display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap' },
  infoItem:       { display:'flex', flexDirection:'column', gap:'2px', flex:1, minWidth:'100px' },
  infoLabel:      { color:'#6b7280', fontSize:'10px', fontWeight:'500' },
  infoValue:      { color:'#fff', fontSize:'12px', fontWeight:'600' },
  divider:        { width:'1px', height:'30px', background:'#1f2937', flexShrink:0 },
  recommendation: { fontSize:'12px', fontWeight:'700' },
};
// ─────────────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user }                        = useAuth();
  const { dashboard, loading, refresh } = useData();

  useEffect(() => { refresh(); }, []);

  if (loading && !dashboard) return (
    <div style={s.loading}>Chargement du dashboard...</div>
  );

  const stats           = dashboard?.stats           || {};
  const growth          = dashboard?.growth          || {};
  const recent_trades   = dashboard?.recent_trades   || [];
  const capital_history = (dashboard?.capital_history || []).map(h => ({
    ...h, date: formatDate(h.date),
  }));

  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Bonjour, {user?.name} 👋</h1>
          <p style={s.subtitle}>Voici votre performance de trading</p>
        </div>
        <div style={s.capitalBadge}>
          💰 {parseFloat(user?.capital || 0).toFixed(2)} $
        </div>
      </div>

      {/* ⏰ Widget Sessions — ajouté ici */}
      <SessionsWidget />

      {/* Phase de croissance */}
      {growth.phase && (
        <div style={s.growthCard}>
          <div style={s.growthHeader}>
            <Target size={18} color="#00d4aa"/>
            <span style={s.growthPhase}>{growth.phase}</span>
            <span style={s.growthRisk}>
              Risque recommandé : <strong style={{ color: '#00d4aa' }}>{growth.risk_percent}%</strong>
            </span>
          </div>
          <div style={s.progressBar}>
            <div style={{ ...s.progressFill, width: `${growth.progress_percent}%` }}/>
          </div>
          <div style={s.growthFooter}>
            <span style={s.growthText}>Progression : {growth.progress_percent}%</span>
            {growth.next_target && (
              <span style={s.growthText}>
                Prochain objectif : <strong style={{ color: '#fff' }}>{growth.next_target}$</strong>
                {' '}(encore {growth.remaining}$)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Cartes stats */}
      <div style={s.statsGrid}>
        {[
          { label: 'Winrate',       value: `${stats.winrate || 0}%`,       icon: <Award size={20}/>,         color: '#00d4aa' },
          { label: 'Profit Net',    value: `${stats.net_profit || 0}$`,     icon: <TrendingUp size={20}/>,    color: stats.net_profit >= 0 ? '#00d4aa' : '#ef4444' },
          { label: 'Trades',        value: stats.total_trades || 0,         icon: <Activity size={20}/>,      color: '#00a8ff' },
          { label: 'Max Drawdown',  value: `${stats.max_drawdown || 0}$`,   icon: <AlertTriangle size={20}/>, color: '#f59e0b' },
          { label: 'RR Moyen',      value: `${stats.avg_rr || 0}`,          icon: <TrendingDown size={20}/>,  color: '#9b6dff' },
          { label: 'Profit Factor', value: stats.profit_factor || 0,        icon: <Award size={20}/>,         color: '#ec4899' },
        ].map((card, i) => (
          <div key={i} style={s.statCard}>
            <div style={{ ...s.statIcon, color: card.color }}>{card.icon}</div>
            <div style={{ ...s.statValue, color: card.color }}>{card.value}</div>
            <div style={s.statLabel}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Graphique capital */}
      {capital_history.length > 1 && (
        <div style={s.chartCard}>
          <h3 style={s.cardTitle}>📈 Évolution du Capital</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={capital_history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937"/>
              <XAxis dataKey="date" stroke="#6b7280" fontSize={11}/>
              <YAxis stroke="#6b7280" fontSize={11}/>
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '8px', color: '#fff' }}
                formatter={(val) => [`${val}$`, 'Capital']}
              />
              <Line type="monotone" dataKey="capital" stroke="#00d4aa" strokeWidth={2} dot={{ fill: '#00d4aa', r: 3 }}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Derniers trades */}
      <div style={s.tradesCard}>
        <h3 style={s.cardTitle}>📋 Derniers Trades</h3>
        {recent_trades.length === 0 ? (
          <p style={s.empty}>Aucun trade. Commencez par ajouter un trade dans le Journal !</p>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                {['Date','Actif','Type','Lot','Résultat','Profit'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent_trades.map((trade, i) => (
                <tr key={i} style={s.tr}>
                  <td style={s.td}>{trade.date}</td>
                  <td style={s.td}><strong style={{ color: '#00a8ff' }}>{trade.asset}</strong></td>
                  <td style={s.td}>
                    <span style={{ color: trade.type === 'BUY' ? '#00d4aa' : '#ef4444', fontWeight: '600' }}>
                      {trade.type}
                    </span>
                  </td>
                  <td style={s.td}>{trade.lot}</td>
                  <td style={s.td}>
                    <span style={{
                      background: trade.result === 'WIN' ? '#00d4aa22' : '#ef444422',
                      color:      trade.result === 'WIN' ? '#00d4aa'   : '#ef4444',
                      padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                    }}>
                      {trade.result}
                    </span>
                  </td>
                  <td style={{ ...s.td, color: trade.profit >= 0 ? '#00d4aa' : '#ef4444', fontWeight: '600' }}>
                    {trade.profit >= 0 ? '+' : ''}{trade.profit}$
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        @keyframes sessionPulse {
          0%   { transform: scale(1);   opacity: 1; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      `}</style>

    </div>
  );
}

const s = {
  page:         { maxWidth: '1100px', margin: '0 auto' },
  loading:      { color: '#00d4aa', textAlign: 'center', paddingTop: '100px', fontSize: '16px' },
  header:       { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'16px', flexWrap:'wrap', gap:'10px' },
  capitalBadge: { background:'#00d4aa22', border:'1px solid #00d4aa44', color:'#00d4aa', padding:'8px 14px', borderRadius:'12px', fontSize:'16px', fontWeight:'700' },
  title:        { color:'#fff', fontSize:'24px', fontWeight:'700', margin:0 },
  subtitle:     { color:'#6b7280', fontSize:'14px', marginTop:'4px' },
  growthCard:   { background:'#111827', border:'1px solid #1f2937', borderRadius:'12px', padding:'20px', marginBottom:'16px' },
  growthHeader: { display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px', flexWrap:'wrap' },
  growthPhase:  { color:'#fff', fontWeight:'600', fontSize:'14px', flex:1 },
  growthRisk:   { color:'#9ca3af', fontSize:'13px' },
  progressBar:  { background:'#1f2937', borderRadius:'99px', height:'8px', overflow:'hidden', marginBottom:'8px' },
  progressFill: { background:'linear-gradient(90deg,#00d4aa,#00a8ff)', height:'100%', borderRadius:'99px', transition:'width 0.5s' },
  growthFooter: { display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:'4px' },
  growthText:   { color:'#6b7280', fontSize:'12px' },
  statsGrid:    { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:'10px', marginBottom:'16px' },
  statCard:     { background:'#111827', border:'1px solid #1f2937', borderRadius:'12px', padding:'20px', textAlign:'center' },
  statIcon:     { marginBottom:'8px', display:'flex', justifyContent:'center' },
  statValue:    { fontSize:'22px', fontWeight:'700', marginBottom:'4px' },
  statLabel:    { color:'#6b7280', fontSize:'12px' },
  chartCard:    { background:'#111827', border:'1px solid #1f2937', borderRadius:'12px', padding:'20px', marginBottom:'16px' },
  cardTitle:    { color:'#fff', fontSize:'15px', fontWeight:'600', margin:'0 0 16px' },
  tradesCard:   { background:'#111827', border:'1px solid #1f2937', borderRadius:'12px', padding:'20px' },
  empty:        { color:'#6b7280', textAlign:'center', padding:'30px', fontSize:'14px' },
  table:        { width:'100%', borderCollapse:'collapse' },
  th:           { color:'#6b7280', fontSize:'12px', fontWeight:'600', padding:'8px 12px', textAlign:'left', borderBottom:'1px solid #1f2937' },
  tr:           { borderBottom:'1px solid #0f172a' },
  td:           { color:'#d1d5db', fontSize:'13px', padding:'10px 12px' },
};