import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Calculator, TrendingUp, TrendingDown, Zap } from 'lucide-react';

const ASSETS = ['XAUUSD','EURUSD','GBPUSD','USDJPY','BTCUSD','NAS100','US30','GBPJPY'];

export default function CalculatorPage() {
  const { user }                  = useAuth();
  const [form, setForm]           = useState({ asset:'XAUUSD', entry:'', sl:'', tp:'', risk_percent:'' });
  const [result, setResult]       = useState(null);
  const [simResult, setSimResult] = useState(null);
  const [loading, setLoading]     = useState(false);

  const capital = parseFloat(user?.capital || 20);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const calculate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const [lotRes, simRes] = await Promise.all([
        api.post('/calculate-lot', {
          capital,
          risk_percent: parseFloat(form.risk_percent),
          entry:        parseFloat(form.entry),
          sl:           parseFloat(form.sl),
          asset:        form.asset
        }),
        form.tp ? api.post('/simulate', {
          capital,
          risk_percent: parseFloat(form.risk_percent),
          entry:        parseFloat(form.entry),
          sl:           parseFloat(form.sl),
          tp:           parseFloat(form.tp),
          asset:        form.asset
        }) : null,
      ]);
      setResult(lotRes.data);
      if (simRes) setSimResult(simRes.data);
    } catch {
      alert('Erreur de calcul');
    } finally {
      setLoading(false);
    }
  };

  const growth = (() => {
    const stages = [
      { min:0,   max:50,   risk:50, label:'Phase 1 — Décollage'      },
      { min:50,  max:100,  risk:40, label:'Phase 2 — Accélération'   },
      { min:100, max:200,  risk:30, label:'Phase 3 — Croissance'     },
      { min:200, max:500,  risk:20, label:'Phase 4 — Consolidation'  },
      { min:500, max:1000, risk:10, label:'Phase 5 — Maturité'       },
    ];
    return stages.find(s => capital >= s.min && capital < s.max) || { risk:5, label:'Objectif atteint' };
  })();

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>🧮 Calculateur</h1>
        <p style={s.subtitle}>Calcul automatique du lot</p>
      </div>

      {/* Risque recommandé */}
      <div style={s.growthCard}>
        <Zap size={16} color="#f59e0b"/>
        <span style={s.growthPhase}>{growth.label}</span>
        <span style={s.growthRisk}>Risque : <strong style={{color:'#00d4aa'}}>{growth.risk}%</strong></span>
        <button onClick={() => setForm({...form, risk_percent: growth.risk})} style={s.applyBtn}>
          Appliquer
        </button>
      </div>

      {/* Layout responsive : colonne sur mobile, 2 colonnes sur desktop */}
      <div style={s.layout}>

        {/* Formulaire */}
        <div style={s.formCard}>
          <h3 style={s.cardTitle}>Paramètres du Trade</h3>
          <form onSubmit={calculate} style={s.form}>

            <div>
              <label style={s.label}>Capital actuel</label>
              <input value={`${capital} $`} disabled
                style={{...s.input, color:'#00d4aa', fontWeight:'700'}}/>
            </div>

            <div>
              <label style={s.label}>Actif</label>
              <select name="asset" value={form.asset} onChange={handleChange} style={s.input}>
                {ASSETS.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>

            <div>
              <label style={s.label}>Risque (%)</label>
              <input name="risk_percent" type="number" step="0.1"
                value={form.risk_percent} onChange={handleChange}
                placeholder={`Recommandé : ${growth.risk}%`}
                style={s.input} required/>
            </div>

            <div>
              <label style={s.label}>Prix d'entrée</label>
              <input name="entry" type="number" step="0.00001"
                value={form.entry} onChange={handleChange}
                placeholder="4547.00" style={s.input} required/>
            </div>

            <div>
              <label style={s.label}>Stop Loss</label>
              <input name="sl" type="number" step="0.00001"
                value={form.sl} onChange={handleChange}
                placeholder="4540.00" style={s.input} required/>
            </div>

            <div>
              <label style={s.label}>Take Profit (optionnel)</label>
              <input name="tp" type="number" step="0.00001"
                value={form.tp} onChange={handleChange}
                placeholder="4561.00" style={s.input}/>
            </div>

            <button type="submit" style={s.calcBtn} disabled={loading}>
              <Calculator size={16}/>
              {loading ? 'Calcul...' : 'Calculer'}
            </button>
          </form>
        </div>

        {/* Résultats */}
        <div style={s.resultsCol}>
          {result && (
            <div style={s.resultCard}>
              <h3 style={s.cardTitle}>📊 Résultat</h3>
              <div style={s.resultGrid}>
                <ResultItem label="LOT À TRADER"  value={result.lot}           color="#00d4aa" big/>
                <ResultItem label="RISQUE ($)"     value={`${result.risk_dollar}$`}  color="#f59e0b" big/>
                <ResultItem label="RISQUE (%)"     value={`${result.risk_percent}%`} color="#00a8ff"/>
                <ResultItem label="DISTANCE SL"    value={`${result.sl_distance} pts`} color="#9b6dff"/>
              </div>
              {result.formula && (
                <div style={s.formula}>
                  📐 {result.formula}
                </div>
              )}
            </div>
          )}

          {simResult && (
            <div style={s.simCard}>
              <h3 style={s.cardTitle}>🎯 Simulation</h3>
              <div style={s.simGrid}>
                <div style={{...s.simItem, borderColor:'#00d4aa44', background:'#00d4aa0a'}}>
                  <TrendingUp size={20} color="#00d4aa"/>
                  <div style={s.simLabel}>Si WIN</div>
                  <div style={{...s.simValue, color:'#00d4aa'}}>+{simResult.potential_profit}$</div>
                  <div style={s.simCapital}>→ {simResult.capital_after_win}$</div>
                </div>
                <div style={{...s.simItem, borderColor:'#ef444444', background:'#ef44440a'}}>
                  <TrendingDown size={20} color="#ef4444"/>
                  <div style={s.simLabel}>Si LOSS</div>
                  <div style={{...s.simValue, color:'#ef4444'}}>-{simResult.potential_loss}$</div>
                  <div style={s.simCapital}>→ {simResult.capital_after_loss}$</div>
                </div>
              </div>
              <div style={s.rrBox}>
                <span style={{color:'#6b7280', fontSize:'13px'}}>Risk/Reward :</span>
                <span style={{color:'#fff', fontWeight:'700', fontSize:'18px'}}>1 : {simResult.rr_ratio}</span>
              </div>
            </div>
          )}

          {!result && (
            <div style={s.emptyResult}>
              <Calculator size={40} color="#374151"/>
              <p style={{color:'#6b7280', marginTop:'12px', fontSize:'14px', textAlign:'center'}}>
                Remplis le formulaire et clique "Calculer"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultItem({ label, value, color, big }) {
  return (
    <div style={{ textAlign:'center', padding:'14px', background:'#0f172a', borderRadius:'10px' }}>
      <div style={{ color:'#6b7280', fontSize:'11px', fontWeight:'600', marginBottom:'6px' }}>{label}</div>
      <div style={{ color, fontWeight:'700', fontSize: big ? '26px':'16px' }}>{value}</div>
    </div>
  );
}

const s = {
  page:       { maxWidth: '900px', margin: '0 auto' },
  header:     { marginBottom: '16px' },
  title:      { color: '#fff', fontSize: '20px', fontWeight: '700', margin: 0 },
  subtitle:   { color: '#6b7280', fontSize: '13px', marginTop: '4px' },

  growthCard: {
    display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
    background: '#111827', border: '1px solid #f59e0b44',
    borderRadius: '12px', padding: '12px 16px', marginBottom: '16px'
  },
  growthPhase:{ color: '#fff', fontWeight: '600', fontSize: '13px', flex: 1, minWidth: '120px' },
  growthRisk: { color: '#9ca3af', fontSize: '13px' },
  applyBtn:   {
    background: '#f59e0b22', border: '1px solid #f59e0b44',
    color: '#f59e0b', borderRadius: '6px', padding: '6px 14px',
    cursor: 'pointer', fontSize: '12px', fontWeight: '600'
  },

  // ✅ RESPONSIVE : colonne sur mobile, 2 colonnes sur desktop
  layout: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
    alignItems: 'start',
  },

  formCard:   { background: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '20px' },
  form:       { display: 'flex', flexDirection: 'column', gap: '12px' },
  cardTitle:  { color: '#fff', fontSize: '14px', fontWeight: '600', margin: '0 0 14px' },
  label:      { display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '5px' },
  input:      {
    width: '100%', background: '#1f2937', border: '1px solid #374151',
    borderRadius: '8px', padding: '11px 12px', color: '#fff',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box'
  },
  calcBtn:    {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    background: 'linear-gradient(135deg,#00d4aa,#00a8ff)',
    color: '#000', fontWeight: '700', border: 'none',
    borderRadius: '10px', padding: '13px', cursor: 'pointer', fontSize: '15px'
  },

  resultsCol: { display: 'flex', flexDirection: 'column', gap: '14px' },
  resultCard: { background: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '20px' },
  resultGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  formula:    {
    marginTop: '12px', background: '#0f172a', borderRadius: '8px',
    padding: '10px 12px', fontSize: '11px', color: '#6b7280', wordBreak: 'break-all'
  },

  simCard:    { background: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '20px' },
  simGrid:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' },
  simItem:    { border: '1px solid', borderRadius: '10px', padding: '14px', textAlign: 'center' },
  simLabel:   { color: '#9ca3af', fontSize: '12px', margin: '8px 0 4px' },
  simValue:   { fontSize: '20px', fontWeight: '700', marginBottom: '4px' },
  simCapital: { color: '#6b7280', fontSize: '11px' },
  rrBox:      {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: '#0f172a', borderRadius: '8px', padding: '12px 16px'
  },
  emptyResult:{ background: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '40px', textAlign: 'center' },
};