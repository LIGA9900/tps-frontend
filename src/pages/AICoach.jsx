import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Brain, TrendingUp, AlertTriangle, Target, RefreshCw, Sparkles } from 'lucide-react';

export default function AICoach() {
  const { user }                    = useAuth();
  const { dashboard, trades, refresh } = useData();
  const [analysis, setAnalysis]     = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  // ✅ Charger les données au montage
  useEffect(() => {
    refresh();
  }, []);

  const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY;

  const stats  = dashboard?.stats  || {};
  const growth = dashboard?.growth || {};

  const analyzeWithAI = async () => {
    // Debug — vérifier la clé
    console.log('Clé Gemini présente:', !!GEMINI_KEY);
    console.log('Nombre de trades:', trades?.length);

    if (!trades || trades.length === 0) {
      setError('Aucun trade à analyser. Commence par enregistrer des trades dans le Journal !');
      return;
    }

    if (!GEMINI_KEY) {
      setError('Clé API Gemini manquante. Contacte le support.');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const tradingData = {
        trader: {
          name:            user?.name,
          capital_initial: user?.initial_capital,
          capital_actuel:  user?.capital,
          croissance:      (((user?.capital / user?.initial_capital) - 1) * 100).toFixed(1) + '%',
        },
        performance: {
          total_trades:  stats.total_trades  || 0,
          wins:          stats.wins          || 0,
          losses:        stats.losses        || 0,
          winrate:       stats.winrate       || 0,
          profit_net:    stats.net_profit    || 0,
          rr_moyen:      stats.avg_rr        || 0,
          max_drawdown:  stats.max_drawdown  || 0,
          profit_factor: stats.profit_factor || 0,
        },
        progression: {
          phase:       growth.phase,
          risque:      (growth.risk_percent || 0) + '%',
          objectif:    (growth.next_target  || 0) + '$',
          progression: (growth.progress_percent || 0) + '%',
        },
        par_setup: trades.reduce((acc, t) => {
          const key = t.setup || 'Sans setup';
          if (!acc[key]) acc[key] = { wins: 0, losses: 0, profit: 0 };
          if (t.result === 'WIN')  acc[key].wins++;
          if (t.result === 'LOSS') acc[key].losses++;
          acc[key].profit += parseFloat(t.profit || 0);
          return acc;
        }, {}),
        par_actif: trades.reduce((acc, t) => {
          if (!acc[t.asset]) acc[t.asset] = { wins: 0, losses: 0, profit: 0 };
          if (t.result === 'WIN')  acc[t.asset].wins++;
          if (t.result === 'LOSS') acc[t.asset].losses++;
          acc[t.asset].profit += parseFloat(t.profit || 0);
          return acc;
        }, {}),
        derniers_trades: trades.slice(0, 10).map(t => ({
          date:     t.date,
          actif:    t.asset,
          type:     t.type,
          setup:    t.setup    || 'Non spécifié',
          risque:   t.risk_percent + '%',
          resultat: t.result,
          profit:   t.profit   + '$',
          rr:       t.rr_ratio,
        })),
      };

      const prompt = `Tu es un coach de trading professionnel. Analyse ces données de trading et donne un coaching personnalisé en français.

DONNÉES DU TRADER :
${JSON.stringify(tradingData, null, 2)}

Réponds UNIQUEMENT avec un JSON valide (sans markdown, sans backticks) avec cette structure exacte :
{
  "points_forts": ["point 1", "point 2", "point 3"],
  "points_ameliorer": ["point 1", "point 2", "point 3"],
  "analyse_psychologique": ["observation 1", "observation 2"],
  "plan_action": ["action concrète 1", "action concrète 2", "action concrète 3"],
  "score_global": 75,
  "message_motivation": "message court motivant"
}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature:     0.7,
              maxOutputTokens: 1500,
            }
          })
        }
      );

      const data = await response.json();
      console.log('Réponse Gemini:', data);

      if (data.error) {
        throw new Error(data.error.message);
      }

      const text    = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Réponse vide de Gemini');

      const cleaned = text.replace(/```json|```/g, '').trim();
      const parsed  = JSON.parse(cleaned);
      setAnalysis(parsed);

    } catch (err) {
      console.error('Erreur IA complète:', err);
      setError('Erreur : ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (score) => {
    if (score >= 75) return '#00d4aa';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div style={s.page}>

      <div style={s.header}>
        <div>
          <h1 style={s.title}>🤖 IA Coach</h1>
          <p style={s.subtitle}>Analyse personnalisée par Google Gemini AI</p>
        </div>
        <div style={s.badge}>
          <span style={s.badgeText}>{trades?.length || 0} trades</span>
        </div>
      </div>

      <div style={s.analyzeCard}>
        <div style={s.analyzeIcon}><Sparkles size={32} color="#9b6dff"/></div>
        <div style={s.analyzeTitle}>Analyse IA de tes performances</div>
        <div style={s.analyzeSubtitle}>
          Gemini va analyser tes {trades?.length || 0} trades et te donner
          un coaching sur tes forces, faiblesses et un plan d'action concret.
        </div>
        <button onClick={analyzeWithAI} disabled={loading}
          style={{ ...s.analyzeBtn, opacity: loading ? 0.7 : 1 }}>
          {loading
            ? <><RefreshCw size={16} style={{animation:'spin 1s linear infinite'}}/> Analyse en cours...</>
            : <><Brain size={16}/> Analyser mes trades</>
          }
        </button>
        <style>{`
          @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
          @keyframes bounce { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
        `}</style>
      </div>

      {error && <div style={s.errorBox}>⚠️ {error}</div>}

      {loading && (
        <div style={s.loadingCard}>
          <div style={s.loadingDots}>
            <div style={{...s.dot, animationDelay:'0s'}}/>
            <div style={{...s.dot, animationDelay:'0.2s'}}/>
            <div style={{...s.dot, animationDelay:'0.4s'}}/>
          </div>
          <div style={s.loadingText}>Gemini analyse tes {trades?.length} trades...</div>
          <div style={s.loadingSubtext}>Winrate · Setups · Psychologie · Plan d'action</div>
        </div>
      )}

      {analysis && (
        <div style={s.results}>

          <div style={s.scoreCard}>
            <div>
              <div style={s.scoreLabel}>Score de Performance</div>
              <div style={{...s.scoreValue, color: scoreColor(analysis.score_global)}}>
                {analysis.score_global}/100
              </div>
              <div style={s.scoreBar}>
                <div style={{...s.scoreBarFill, width:`${analysis.score_global}%`, background: scoreColor(analysis.score_global)}}/>
              </div>
            </div>
            <div style={s.motivationBox}>
              <div style={s.motivationIcon}>💬</div>
              <div style={s.motivationText}>"{analysis.message_motivation}"</div>
            </div>
          </div>

          {[
            { title:'🏆 Points Forts',           color:'#00d4aa', items: analysis.points_forts,           dot:'green',  symbol:'✓' },
            { title:'⚠️ Points à Améliorer',      color:'#ef4444', items: analysis.points_ameliorer,       dot:'red',    symbol:'!' },
            { title:'🧠 Analyse Psychologique',   color:'#9b6dff', items: analysis.analyse_psychologique,  dot:'purple', symbol:'→' },
            { title:'🎯 Plan d\'Action',          color:'#f59e0b', items: analysis.plan_action,            dot:'orange', numbered: true },
          ].map((section, si) => (
            <div key={si} style={s.section}>
              <div style={s.sectionHeader}>
                <span style={{...s.sectionTitle, color: section.color}}>{section.title}</span>
              </div>
              <div style={s.sectionContent}>
                {section.items?.map((item, i) => (
                  <div key={i} style={s.item}>
                    <span style={getDotStyle(section.dot)}>
                      {section.numbered ? i + 1 : section.symbol}
                    </span>
                    <span style={s.itemText}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button onClick={analyzeWithAI} style={s.reanalyzeBtn}>
            <RefreshCw size={14}/> Relancer l'analyse
          </button>
        </div>
      )}
    </div>
  );
}

function getDotStyle(color) {
  const colors = {
    green:  { bg: '#00d4aa22', text: '#00d4aa' },
    red:    { bg: '#ef444422', text: '#ef4444' },
    purple: { bg: '#9b6dff22', text: '#9b6dff' },
    orange: { bg: '#f59e0b22', text: '#f59e0b' },
  };
  const c = colors[color] || colors.green;
  return {
    flexShrink: 0, width: '22px', height: '22px',
    borderRadius: '50%', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontSize: '11px', fontWeight: '700',
    background: c.bg, color: c.text,
  };
}

const s = {
  page:          { maxWidth: '800px', margin: '0 auto' },
  header:        { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'20px', flexWrap:'wrap', gap:'10px' },
  title:         { color:'#fff', fontSize:'20px', fontWeight:'700', margin:0 },
  subtitle:      { color:'#6b7280', fontSize:'13px', marginTop:'4px' },
  badge:         { background:'#9b6dff22', border:'1px solid #9b6dff44', borderRadius:'8px', padding:'6px 12px' },
  badgeText:     { color:'#9b6dff', fontSize:'12px', fontWeight:'600' },
  analyzeCard:   { background:'#111827', border:'1px solid #9b6dff44', borderRadius:'16px', padding:'28px', marginBottom:'20px', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap:'14px' },
  analyzeIcon:   { background:'#9b6dff22', borderRadius:'50%', width:'64px', height:'64px', display:'flex', alignItems:'center', justifyContent:'center' },
  analyzeTitle:  { color:'#fff', fontSize:'16px', fontWeight:'700' },
  analyzeSubtitle:{ color:'#6b7280', fontSize:'13px', lineHeight:'1.6', maxWidth:'400px' },
  analyzeBtn:    { display:'flex', alignItems:'center', gap:'8px', background:'linear-gradient(135deg,#9b6dff,#00a8ff)', color:'#fff', fontWeight:'700', border:'none', borderRadius:'12px', padding:'14px 28px', cursor:'pointer', fontSize:'15px' },
  errorBox:      { background:'#ef444411', border:'1px solid #ef444444', borderRadius:'10px', padding:'14px', color:'#ef4444', fontSize:'13px', marginBottom:'16px' },
  loadingCard:   { background:'#111827', border:'1px solid #1f2937', borderRadius:'12px', padding:'40px', textAlign:'center', marginBottom:'20px' },
  loadingDots:   { display:'flex', justifyContent:'center', gap:'8px', marginBottom:'16px' },
  dot:           { width:'12px', height:'12px', background:'#9b6dff', borderRadius:'50%', animation:'bounce 1.4s infinite ease-in-out' },
  loadingText:   { color:'#fff', fontSize:'15px', fontWeight:'600', marginBottom:'6px' },
  loadingSubtext:{ color:'#6b7280', fontSize:'12px' },
  results:       { display:'flex', flexDirection:'column', gap:'14px' },
  scoreCard:     { background:'#111827', border:'1px solid #1f2937', borderRadius:'12px', padding:'20px', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'20px' },
  scoreLabel:    { color:'#6b7280', fontSize:'12px', marginBottom:'6px' },
  scoreValue:    { fontSize:'36px', fontWeight:'800', marginBottom:'8px' },
  scoreBar:      { background:'#1f2937', borderRadius:'99px', height:'8px', overflow:'hidden' },
  scoreBarFill:  { height:'100%', borderRadius:'99px', transition:'width 1s ease' },
  motivationBox: { background:'#0f172a', borderRadius:'10px', padding:'14px', display:'flex', gap:'10px', alignItems:'flex-start' },
  motivationIcon:{ fontSize:'20px', flexShrink:0 },
  motivationText:{ color:'#d1d5db', fontSize:'13px', fontStyle:'italic', lineHeight:'1.6' },
  section:       { background:'#111827', border:'1px solid #1f2937', borderRadius:'12px', padding:'18px' },
  sectionHeader: { display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px' },
  sectionTitle:  { fontSize:'14px', fontWeight:'700' },
  sectionContent:{ display:'flex', flexDirection:'column', gap:'10px' },
  item:          { display:'flex', gap:'10px', alignItems:'flex-start' },
  itemText:      { color:'#d1d5db', fontSize:'13px', lineHeight:'1.6', flex:1 },
  reanalyzeBtn:  { display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', background:'#1f2937', border:'1px solid #374151', color:'#9ca3af', borderRadius:'10px', padding:'12px', cursor:'pointer', fontSize:'13px', fontWeight:'600' },
};