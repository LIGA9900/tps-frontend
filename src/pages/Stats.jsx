import { useEffect, useState } from 'react';
import { useData } from '../context/DataContext';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  AreaChart, Area
} from 'recharts';

const COLORS = { WIN: '#00d4aa', LOSS: '#ef4444', BREAKEVEN: '#f59e0b' };

const formatDate = (dateStr) => {
  if (!dateStr || dateStr === 'Début') return 'Début';
  const d = new Date(dateStr);
  return isNaN(d) ? dateStr : `${d.getDate()}/${d.getMonth() + 1}`;
};

export default function Stats() {
  const { dashboard, trades, loading, refresh } = useData();
  const [filter, setFilter] = useState('all');

  // Charger les données au montage
  useEffect(() => { refresh(); }, []);

  if (loading && !dashboard) return (
    <div style={s.loading}>Chargement des statistiques...</div>
  );

  const stats           = dashboard?.stats || {};
  const capital_history = (dashboard?.capital_history || []).map(h => ({
    ...h, date: formatDate(h.date),
  }));

  // Filtrer les trades par période
  const filteredTrades = (() => {
    if (filter === 'all') return trades;
    const now  = new Date();
    const days = filter === '7d' ? 7 : filter === '30d' ? 30 : 90;
    const from = new Date(new Date().setDate(now.getDate() - days));
    return trades.filter(t => new Date(t.date) >= from);
  })();

  // Données camembert WIN/LOSS
  const pieData = [
    { name: 'WIN',       value: filteredTrades.filter(t => t.result === 'WIN').length },
    { name: 'LOSS',      value: filteredTrades.filter(t => t.result === 'LOSS').length },
    { name: 'BREAKEVEN', value: filteredTrades.filter(t => t.result === 'BREAKEVEN').length },
  ].filter(d => d.value > 0);

  // Performance par actif
  const byAsset = filteredTrades.reduce((acc, t) => {
    if (!acc[t.asset]) acc[t.asset] = { asset: t.asset, profit: 0, trades: 0, wins: 0 };
    acc[t.asset].profit += parseFloat(t.profit || 0);
    acc[t.asset].trades += 1;
    if (t.result === 'WIN') acc[t.asset].wins += 1;
    return acc;
  }, {});
  const assetData = Object.values(byAsset).map(a => ({
    ...a,
    profit:  parseFloat(a.profit.toFixed(2)),
    winrate: a.trades > 0 ? Math.round((a.wins / a.trades) * 100) : 0,
  }));

  // Performance par setup
  const bySetup = filteredTrades.reduce((acc, t) => {
    const key = t.setup || 'Sans setup';
    if (!acc[key]) acc[key] = { setup: key, profit: 0, trades: 0, wins: 0 };
    acc[key].profit += parseFloat(t.profit || 0);
    acc[key].trades += 1;
    if (t.result === 'WIN') acc[key].wins += 1;
    return acc;
  }, {});
  const setupData = Object.values(bySetup).map(s => ({
    ...s,
    profit:  parseFloat(s.profit.toFixed(2)),
    winrate: s.trades > 0 ? Math.round((s.wins / s.trades) * 100) : 0,
  }));

  // Trades par jour de la semaine
  const byDay = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map((day, i) => {
    const dayTrades = filteredTrades.filter(t => new Date(t.date).getDay() === (i + 1) % 7);
    return {
      day,
      trades: dayTrades.length,
      profit: parseFloat(dayTrades.reduce((sum, t) => sum + parseFloat(t.profit || 0), 0).toFixed(2)),
    };
  });

  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>📈 Statistiques Avancées</h1>
          <p style={s.subtitle}>Analyse complète de vos performances</p>
        </div>
        {/* Filtres période */}
        <div style={s.filters}>
          {[['all','Tout'],['7d','7 jours'],['30d','30 jours'],['90d','90 jours']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              style={{ ...s.filterBtn, ...(filter === val ? s.filterActive : {}) }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Cartes KPI */}
      <div style={s.kpiGrid}>
        {[
          { label: 'Winrate',       value: `${stats.winrate || 0}%`,       color: '#00d4aa' },
          { label: 'Profit Net',    value: `${stats.net_profit || 0}$`,     color: stats.net_profit >= 0 ? '#00d4aa' : '#ef4444' },
          { label: 'Profit Factor', value: stats.profit_factor || 0,        color: '#9b6dff' },
          { label: 'RR Moyen',      value: `1 : ${stats.avg_rr || 0}`,      color: '#00a8ff' },
          { label: 'Max Drawdown',  value: `${stats.max_drawdown || 0}$`,   color: '#f59e0b' },
          { label: 'Total Trades',  value: stats.total_trades || 0,         color: '#ec4899' },
        ].map((k, i) => (
          <div key={i} style={s.kpiCard}>
            <div style={{ ...s.kpiValue, color: k.color }}>{k.value}</div>
            <div style={s.kpiLabel}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Row 1 : Camembert + Courbe capital */}
      <div style={s.row2}>

        {/* Camembert WIN/LOSS */}
        <div style={s.card}>
          <h3 style={s.cardTitle}>🎯 Répartition WIN / LOSS</h3>
          {pieData.length === 0 ? (
            <p style={s.empty}>Aucun trade</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData} cx="50%" cy="50%" outerRadius={75}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false} fontSize={12}
                  >
                    {pieData.map(entry => (
                      <Cell key={entry.name} fill={COLORS[entry.name]}/>
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={s.tooltip}
                    formatter={val => [`${val} trades`]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={s.legend}>
                {pieData.map(d => (
                  <div key={d.name} style={s.legendItem}>
                    <div style={{ width:10, height:10, borderRadius:'50%', background: COLORS[d.name] }}/>
                    <span style={{ color:'#9ca3af', fontSize:'12px' }}>
                      {d.name} : <strong style={{ color:'#fff' }}>{d.value}</strong>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Courbe de capital */}
        <div style={{ ...s.card, flex: 2 }}>
          <h3 style={s.cardTitle}>💹 Courbe de Capital</h3>
          {capital_history.length > 1 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={capital_history}>
                <defs>
                  <linearGradient id="capitalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00d4aa" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00d4aa" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937"/>
                <XAxis dataKey="date" stroke="#6b7280" fontSize={10}/>
                <YAxis stroke="#6b7280" fontSize={10}/>
                <Tooltip
                  contentStyle={s.tooltip}
                  formatter={v => [`${v}$`, 'Capital']}
                />
                <Area
                  type="monotone" dataKey="capital"
                  stroke="#00d4aa" strokeWidth={2}
                  fill="url(#capitalGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p style={s.empty}>Pas assez de données</p>
          )}
        </div>
      </div>

      {/* Performance par actif */}
      <div style={s.card}>
        <h3 style={s.cardTitle}>🏦 Performance par Actif</h3>
        {assetData.length === 0 ? (
          <p style={s.empty}>Aucun trade</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={assetData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937"/>
              <XAxis dataKey="asset" stroke="#6b7280" fontSize={11}/>
              <YAxis stroke="#6b7280" fontSize={11}/>
              <Tooltip contentStyle={s.tooltip}/>
              <Legend wrapperStyle={{ color:'#9ca3af', fontSize:'12px' }}/>
              <Bar dataKey="profit"  name="Profit ($)"  fill="#00d4aa" radius={[4,4,0,0]}/>
              <Bar dataKey="winrate" name="Winrate (%)" fill="#00a8ff" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Row 3 : Setup + Jour de la semaine */}
      <div style={s.row2}>

        <div style={s.card}>
          <h3 style={s.cardTitle}>⚡ Performance par Setup</h3>
          {setupData.length === 0 ? (
            <p style={s.empty}>Aucun trade</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={setupData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937"/>
                <XAxis type="number" stroke="#6b7280" fontSize={10}/>
                <YAxis type="category" dataKey="setup" stroke="#6b7280" fontSize={10} width={80}/>
                <Tooltip contentStyle={s.tooltip}/>
                <Bar dataKey="profit" name="Profit ($)" fill="#9b6dff" radius={[0,4,4,0]}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={s.card}>
          <h3 style={s.cardTitle}>📅 Trades par Jour de la Semaine</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937"/>
              <XAxis dataKey="day" stroke="#6b7280" fontSize={11}/>
              <YAxis stroke="#6b7280" fontSize={11}/>
              <Tooltip contentStyle={s.tooltip}/>
              <Bar dataKey="trades" name="Trades"     fill="#f59e0b" radius={[4,4,0,0]}/>
              <Bar dataKey="profit" name="Profit ($)" fill="#00d4aa" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tableau récapitulatif */}
      <div style={s.card}>
        <h3 style={s.cardTitle}>📊 Récapitulatif Détaillé</h3>
        <div style={s.recapGrid}>
          {[
            { label: 'Total trades',    value: stats.total_trades || 0 },
            { label: 'Trades gagnants', value: stats.wins || 0,                color: '#00d4aa' },
            { label: 'Trades perdants', value: stats.losses || 0,              color: '#ef4444' },
            { label: 'Profit brut',     value: `+${stats.total_profit || 0}$`, color: '#00d4aa' },
            { label: 'Perte brute',     value: `-${stats.total_loss || 0}$`,   color: '#ef4444' },
            { label: 'Profit net',      value: `${stats.net_profit || 0}$`,    color: stats.net_profit >= 0 ? '#00d4aa' : '#ef4444' },
            { label: 'Winrate',         value: `${stats.winrate || 0}%`,       color: '#00a8ff' },
            { label: 'RR moyen',        value: `1 : ${stats.avg_rr || 0}`,     color: '#9b6dff' },
            { label: 'Max Drawdown',    value: `${stats.max_drawdown || 0}$`,  color: '#f59e0b' },
            { label: 'Profit Factor',   value: stats.profit_factor || 0,       color: '#ec4899' },
          ].map((item, i) => (
            <div key={i} style={s.recapItem}>
              <span style={s.recapLabel}>{item.label}</span>
              <span style={{ ...s.recapValue, color: item.color || '#fff' }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

const s = {
  page:       { maxWidth: '1100px', margin: '0 auto' },
  loading:    { color: '#00d4aa', textAlign: 'center', paddingTop: '100px', fontSize: '16px' },
  header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  title:      { color: '#fff', fontSize: '22px', fontWeight: '700', margin: 0 },
  subtitle:   { color: '#6b7280', fontSize: '13px', marginTop: '4px' },
  filters:    { display: 'flex', gap: '6px' },
  filterBtn:  { background: '#1f2937', border: '1px solid #374151', color: '#9ca3af', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' },
  filterActive:{ background: '#00d4aa22', border: '1px solid #00d4aa44', color: '#00d4aa' },
  kpiGrid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' },
  kpiCard:    { background: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '18px', textAlign: 'center' },
  kpiValue:   { fontSize: '24px', fontWeight: '700', marginBottom: '4px' },
  kpiLabel:   { color: '#6b7280', fontSize: '12px' },
  row2:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' },
  card:       { background: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '20px', marginBottom: '16px' },
  cardTitle:  { color: '#fff', fontSize: '14px', fontWeight: '600', margin: '0 0 16px' },
  empty:      { color: '#6b7280', textAlign: 'center', padding: '30px', fontSize: '13px' },
  legend:     { display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '8px' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '6px' },
  tooltip:    { background: '#111827', border: '1px solid #1f2937', borderRadius: '8px', color: '#fff', fontSize: '12px' },
  recapGrid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' },
  recapItem:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', borderRadius: '8px', padding: '10px 14px' },
  recapLabel: { color: '#9ca3af', fontSize: '12px' },
  recapValue: { fontWeight: '700', fontSize: '14px' },
};