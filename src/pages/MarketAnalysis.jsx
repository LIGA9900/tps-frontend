import { useState } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, AlertTriangle, Clock, Newspaper } from 'lucide-react';

const TWELVEDATA_KEY   = import.meta.env.VITE_TWELVEDATA_KEY;
const FINNHUB_KEY      = import.meta.env.VITE_FINNHUB_KEY;
const OPENROUTER_KEY   = import.meta.env.VITE_OPENROUTER_KEY;

export default function MarketAnalysis() {
  const [analysis, setAnalysis] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [rawData,  setRawData]  = useState(null);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      // ── 1. Prix XAUUSD (TwelveData) ──────────────────────────────
      let xauusd = { price: 'N/A', change: 'N/A', change_percent: 'N/A' };
      try {
        const r = await fetch(
          `https://api.twelvedata.com/quote?symbol=XAU/USD&apikey=${TWELVEDATA_KEY}`
        );
        const d = await r.json();
        xauusd = {
          price:          parseFloat(d.close || d.price || 0).toFixed(2),
          change:         parseFloat(d.change || 0).toFixed(2),
          change_percent: parseFloat(d.percent_change || 0).toFixed(2),
        };
      } catch {}

      // ── 2. DXY (TwelveData) ───────────────────────────────────────
      let dxy = { price: 'N/A', change_percent: 'N/A' };
      try {
        const r = await fetch(
          `https://api.twelvedata.com/quote?symbol=DXY&apikey=${TWELVEDATA_KEY}`
        );
        const d = await r.json();
        dxy = {
          price:          parseFloat(d.close || d.price || 0).toFixed(2),
          change_percent: parseFloat(d.percent_change || 0).toFixed(2),
        };
      } catch {}

      // ── 3. Fear & Greed Index (Alternative.me — sans clé) ─────────
      let fearGreed = { value: 'N/A', label: 'N/A' };
      try {
        const r = await fetch('https://api.alternative.me/fng/?limit=1');
        const d = await r.json();
        fearGreed = {
          value: d.data?.[0]?.value     || 'N/A',
          label: d.data?.[0]?.value_classification || 'N/A',
        };
      } catch {}

      // ── 4. Actualités Gold (FinnHub) ──────────────────────────────
      let news = [];
      try {
        const r = await fetch(
          `https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_KEY}`
        );
        const d = await r.json();
        // Filtrer les news liées à l'or/dollar
        const keywords = ['gold','xauusd','dollar','fed','inflation','rate','treasury','commodity'];
        news = d
          .filter(n => keywords.some(k =>
            (n.headline || '').toLowerCase().includes(k) ||
            (n.summary  || '').toLowerCase().includes(k)
          ))
          .slice(0, 5)
          .map(n => n.headline);
      } catch {}

      // ── 5. Calendrier économique (FinnHub) ────────────────────────
      let events = [];
      try {
        const today = new Date().toISOString().split('T')[0];
        const r = await fetch(
          `https://finnhub.io/api/v1/calendar/economic?from=${today}&to=${today}&token=${FINNHUB_KEY}`
        );
        const d = await r.json();
        events = (d.economicCalendar || [])
          .filter(e => ['high','medium'].includes(e.impact?.toLowerCase()))
          .slice(0, 5)
          .map(e => `${e.time || ''} — ${e.event} (Impact: ${e.impact})`);
      } catch {}

      // ── 6. Saisonnalité ───────────────────────────────────────────
      const month = new Date().getMonth() + 1;
      const goodMonths = [1, 8, 9, 11, 12];
      const seasonality = goodMonths.includes(month)
        ? 'Favorable (mois historiquement haussier pour l\'or)'
        : 'Neutre à baissier (mois historiquement moins favorable)';

      // ── 7. Session active ─────────────────────────────────────────
      const hour = new Date().getUTCHours();
      let session = 'Hors session (liquidité faible)';
      if (hour >= 7  && hour < 12) session = 'Session Londres (haute liquidité)';
      if (hour >= 12 && hour < 17) session = 'Session New York (haute liquidité)';
      if (hour >= 17 && hour < 21) session = 'Overlap Londres/NY (liquidité maximale)';

      const collected = {
        xauusd,
        dxy,
        fear_greed: fearGreed,
        news:       news.length > 0 ? news : ['Aucune news filtrée disponible'],
        events:     events.length > 0 ? events : ['Aucun événement majeur aujourd\'hui'],
        seasonality,
        session,
        date:       new Date().toLocaleDateString('fr-FR', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        }),
      };

      setRawData(collected);

      // ── 8. Envoyer à l'IA ─────────────────────────────────────────
      const prompt = `Tu es un analyste financier expert spécialisé sur le XAUUSD (Or/Dollar).
Analyse ces données de marché en temps réel et donne une analyse fondamentale complète en français.

DONNÉES DU MARCHÉ (${collected.date}) :

📈 XAUUSD :
- Prix actuel : ${collected.xauusd.price}$
- Variation : ${collected.xauusd.change}$ (${collected.xauusd.change_percent}%)

💵 DXY (Dollar Index) :
- Valeur : ${collected.dxy.price}
- Variation : ${collected.dxy.change_percent}%
- Note : DXY et or ont une corrélation INVERSE

😨 Fear & Greed Index : ${collected.fear_greed.value}/100 (${collected.fear_greed.label})
- 0-25 = Extreme Fear (favorable à l'or refuge)
- 25-45 = Fear (légèrement favorable)
- 45-55 = Neutre
- 55-75 = Greed (défavorable à l'or)
- 75-100 = Extreme Greed (très défavorable)

📰 Actualités récentes :
${collected.news.map((n,i) => `${i+1}. ${n}`).join('\n')}

📅 Événements économiques du jour :
${collected.events.map((e,i) => `${i+1}. ${e}`).join('\n')}

🗓️ Saisonnalité : ${collected.seasonality}
⏰ Session actuelle : ${collected.session}

Réponds UNIQUEMENT avec un JSON valide (sans markdown, sans backticks) :
{
  "biais": "HAUSSIER" ou "BAISSIER" ou "NEUTRE",
  "force_signal": "FORT" ou "MODÉRÉ" ou "FAIBLE",
  "resume": "résumé en 2-3 phrases claires de la situation",
  "analyse_dxy": "impact du dollar sur l'or aujourd'hui",
  "analyse_sentiment": "ce que dit le Fear&Greed sur le marché",
  "analyse_news": "impact des actualités sur l'or",
  "evenements_importants": "événements économiques à surveiller",
  "meilleur_moment": "quand trader aujourd'hui",
  "zones_cles": "niveaux de prix importants à surveiller",
  "risques": ["risque 1", "risque 2"],
  "opportunites": ["opportunité 1", "opportunité 2"],
  "conseil_final": "conseil concret pour trader aujourd'hui"
}`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${OPENROUTER_KEY}`,
          'HTTP-Referer':  'https://tps-frontend-green.vercel.app',
          'X-Title':       'TPS Market Analysis',
        },
        body: JSON.stringify({
          model:       'deepseek/deepseek-v4-flash:free',
          messages:    [{ role: 'user', content: prompt }],
          max_tokens:  2000,
          temperature: 0.3,
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      const text    = data.choices?.[0]?.message?.content;
      if (!text) throw new Error('Réponse vide');

      const cleaned = text.replace(/```json|```/g, '').trim();
      const parsed  = JSON.parse(cleaned);
      setAnalysis(parsed);

    } catch (err) {
      console.error('Erreur analyse:', err);
      setError('Erreur : ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const biaisColor = (biais) => {
    if (biais === 'HAUSSIER') return '#00d4aa';
    if (biais === 'BAISSIER') return '#ef4444';
    return '#f59e0b';
  };

  const biaisIcon = (biais) => {
    if (biais === 'HAUSSIER') return <TrendingUp  size={28}/>;
    if (biais === 'BAISSIER') return <TrendingDown size={28}/>;
    return <AlertTriangle size={28}/>;
  };

  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>📊 Analyse Marché</h1>
          <p style={s.subtitle}>Analyse fondamentale XAUUSD en temps réel par IA</p>
        </div>
      </div>

      {/* Bouton analyser */}
      <div style={s.analyzeCard}>
        <div style={s.analyzeIcon}>📊</div>
        <div style={s.analyzeTitle}>Analyse Fondamentale XAUUSD</div>
        <div style={s.analyzeSubtitle}>
          L'IA collecte DXY, Fear &amp; Greed, actualités, calendrier économique
          et sessions de trading pour te donner le biais du marché.
        </div>
        <button onClick={fetchAllData} disabled={loading}
          style={{ ...s.analyzeBtn, opacity: loading ? 0.7 : 1 }}>
          {loading
            ? <><RefreshCw size={16} style={{animation:'spin 1s linear infinite'}}/> Collecte des données...</>
            : <>📊 Analyser le marché</>
          }
        </button>
        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      </div>

      {error && <div style={s.errorBox}>⚠️ {error}</div>}

      {/* Données brutes collectées */}
      {rawData && !loading && (
        <div style={s.rawDataGrid}>
          <div style={s.rawCard}>
            <div style={s.rawLabel}>🥇 XAUUSD</div>
            <div style={s.rawValue}>{rawData.xauusd.price}$</div>
            <div style={{
              ...s.rawChange,
              color: parseFloat(rawData.xauusd.change_percent) >= 0 ? '#00d4aa' : '#ef4444'
            }}>
              {parseFloat(rawData.xauusd.change_percent) >= 0 ? '▲' : '▼'} {rawData.xauusd.change_percent}%
            </div>
          </div>
          <div style={s.rawCard}>
            <div style={s.rawLabel}>💵 DXY</div>
            <div style={s.rawValue}>{rawData.dxy.price}</div>
            <div style={{
              ...s.rawChange,
              color: parseFloat(rawData.dxy.change_percent) >= 0 ? '#ef4444' : '#00d4aa'
            }}>
              {parseFloat(rawData.dxy.change_percent) >= 0 ? '▲' : '▼'} {rawData.dxy.change_percent}%
            </div>
          </div>
          <div style={s.rawCard}>
            <div style={s.rawLabel}>😨 Fear &amp; Greed</div>
            <div style={s.rawValue}>{rawData.fear_greed.value}/100</div>
            <div style={s.rawChange}>{rawData.fear_greed.label}</div>
          </div>
          <div style={s.rawCard}>
            <div style={s.rawLabel}><Clock size={12}/> Session</div>
            <div style={{...s.rawValue, fontSize:'11px'}}>{rawData.session}</div>
          </div>
        </div>
      )}

      {loading && (
        <div style={s.loadingCard}>
          <div style={s.loadingSteps}>
            {['Récupération prix XAUUSD...','Récupération DXY...','Fear & Greed Index...','Actualités Gold...','Calendrier économique...','Analyse IA en cours...'].map((step, i) => (
              <div key={i} style={s.loadingStep}>
                <RefreshCw size={12} style={{animation:'spin 1s linear infinite', color:'#00d4aa'}}/>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis && (
        <div style={s.results}>

          {/* Biais principal */}
          <div style={{...s.biaisCard, borderColor: biaisColor(analysis.biais) + '44'}}>
            <div style={{...s.biaisIcon, color: biaisColor(analysis.biais), background: biaisColor(analysis.biais) + '22'}}>
              {biaisIcon(analysis.biais)}
            </div>
            <div style={s.biaisInfo}>
              <div style={s.biaisLabel}>Biais du jour</div>
              <div style={{...s.biaisValue, color: biaisColor(analysis.biais)}}>
                {analysis.biais}
              </div>
              <div style={{...s.forceTag, background: biaisColor(analysis.biais) + '22', color: biaisColor(analysis.biais)}}>
                Signal {analysis.force_signal}
              </div>
            </div>
            <div style={s.resume}>{analysis.resume}</div>
          </div>

          {/* Grille d'analyse */}
          <div style={s.grid2}>
            <div style={s.analysisCard}>
              <div style={s.analysisTitle}>💵 Impact DXY</div>
              <div style={s.analysisText}>{analysis.analyse_dxy}</div>
            </div>
            <div style={s.analysisCard}>
              <div style={s.analysisTitle}>😨 Sentiment</div>
              <div style={s.analysisText}>{analysis.analyse_sentiment}</div>
            </div>
            <div style={s.analysisCard}>
              <div style={s.analysisTitle}><Newspaper size={13}/> Actualités</div>
              <div style={s.analysisText}>{analysis.analyse_news}</div>
            </div>
            <div style={s.analysisCard}>
              <div style={s.analysisTitle}>📅 Événements</div>
              <div style={s.analysisText}>{analysis.evenements_importants}</div>
            </div>
          </div>

          {/* Zones clés + meilleur moment */}
          <div style={s.grid2}>
            <div style={s.analysisCard}>
              <div style={s.analysisTitle}>🎯 Zones clés</div>
              <div style={s.analysisText}>{analysis.zones_cles}</div>
            </div>
            <div style={s.analysisCard}>
              <div style={s.analysisTitle}><Clock size={13}/> Meilleur moment</div>
              <div style={s.analysisText}>{analysis.meilleur_moment}</div>
            </div>
          </div>

          {/* Risques et opportunités */}
          <div style={s.grid2}>
            <div style={s.analysisCard}>
              <div style={{...s.analysisTitle, color:'#ef4444'}}>⚠️ Risques</div>
              {analysis.risques?.map((r,i) => (
                <div key={i} style={s.listItem}>
                  <span style={{...s.dot, background:'#ef444422', color:'#ef4444'}}>!</span>
                  <span style={s.listText}>{r}</span>
                </div>
              ))}
            </div>
            <div style={s.analysisCard}>
              <div style={{...s.analysisTitle, color:'#00d4aa'}}>✅ Opportunités</div>
              {analysis.opportunites?.map((o,i) => (
                <div key={i} style={s.listItem}>
                  <span style={{...s.dot, background:'#00d4aa22', color:'#00d4aa'}}>✓</span>
                  <span style={s.listText}>{o}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Conseil final */}
          <div style={s.conseilCard}>
            <div style={s.conseilTitle}>💡 Conseil du jour</div>
            <div style={s.conseilText}>{analysis.conseil_final}</div>
          </div>

          <button onClick={fetchAllData} style={s.reanalyzeBtn}>
            <RefreshCw size={14}/> Relancer l'analyse
          </button>
        </div>
      )}
    </div>
  );
}

const s = {
  page:           { maxWidth: '900px', margin: '0 auto' },
  header:         { marginBottom: '20px' },
  title:          { color: '#fff', fontSize: '20px', fontWeight: '700', margin: 0 },
  subtitle:       { color: '#6b7280', fontSize: '13px', marginTop: '4px' },

  analyzeCard:    { background:'#111827', border:'1px solid #00d4aa44', borderRadius:'16px', padding:'28px', marginBottom:'20px', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap:'14px' },
  analyzeIcon:    { fontSize: '40px' },
  analyzeTitle:   { color:'#fff', fontSize:'16px', fontWeight:'700' },
  analyzeSubtitle:{ color:'#6b7280', fontSize:'13px', lineHeight:'1.6', maxWidth:'450px' },
  analyzeBtn:     { display:'flex', alignItems:'center', gap:'8px', background:'linear-gradient(135deg,#00d4aa,#00a8ff)', color:'#000', fontWeight:'700', border:'none', borderRadius:'12px', padding:'14px 28px', cursor:'pointer', fontSize:'15px' },

  errorBox:       { background:'#ef444411', border:'1px solid #ef444444', borderRadius:'10px', padding:'14px', color:'#ef4444', fontSize:'13px', marginBottom:'16px' },

  rawDataGrid:    { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px,1fr))', gap:'10px', marginBottom:'16px' },
  rawCard:        { background:'#111827', border:'1px solid #1f2937', borderRadius:'10px', padding:'14px', textAlign:'center' },
  rawLabel:       { color:'#6b7280', fontSize:'11px', marginBottom:'6px', display:'flex', alignItems:'center', justifyContent:'center', gap:'4px' },
  rawValue:       { color:'#fff', fontSize:'16px', fontWeight:'700', marginBottom:'2px' },
  rawChange:      { fontSize:'11px', fontWeight:'600' },

  loadingCard:    { background:'#111827', border:'1px solid #1f2937', borderRadius:'12px', padding:'24px', marginBottom:'16px' },
  loadingSteps:   { display:'flex', flexDirection:'column', gap:'8px' },
  loadingStep:    { display:'flex', alignItems:'center', gap:'10px', color:'#9ca3af', fontSize:'13px' },

  results:        { display:'flex', flexDirection:'column', gap:'14px' },

  biaisCard:      { background:'#111827', border:'2px solid', borderRadius:'16px', padding:'20px', display:'flex', alignItems:'center', gap:'16px', flexWrap:'wrap' },
  biaisIcon:      { width:'60px', height:'60px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  biaisInfo:      { display:'flex', flexDirection:'column', gap:'4px' },
  biaisLabel:     { color:'#6b7280', fontSize:'12px' },
  biaisValue:     { fontSize:'24px', fontWeight:'800' },
  forceTag:       { display:'inline-block', padding:'2px 10px', borderRadius:'99px', fontSize:'11px', fontWeight:'700' },
  resume:         { color:'#d1d5db', fontSize:'13px', lineHeight:'1.7', flex:1, minWidth:'200px' },

  grid2:          { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px,1fr))', gap:'12px' },
  analysisCard:   { background:'#111827', border:'1px solid #1f2937', borderRadius:'12px', padding:'16px' },
  analysisTitle:  { color:'#9ca3af', fontSize:'12px', fontWeight:'600', marginBottom:'8px', display:'flex', alignItems:'center', gap:'6px' },
  analysisText:   { color:'#d1d5db', fontSize:'13px', lineHeight:'1.7' },

  listItem:       { display:'flex', gap:'8px', alignItems:'flex-start', marginTop:'8px' },
  dot:            { flexShrink:0, width:'20px', height:'20px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:'700' },
  listText:       { color:'#d1d5db', fontSize:'13px', lineHeight:'1.6' },

  conseilCard:    { background:'linear-gradient(135deg, #00d4aa11, #00a8ff11)', border:'1px solid #00d4aa33', borderRadius:'12px', padding:'20px' },
  conseilTitle:   { color:'#00d4aa', fontSize:'14px', fontWeight:'700', marginBottom:'10px' },
  conseilText:    { color:'#d1d5db', fontSize:'14px', lineHeight:'1.7' },

  reanalyzeBtn:   { display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', background:'#1f2937', border:'1px solid #374151', color:'#9ca3af', borderRadius:'10px', padding:'12px', cursor:'pointer', fontSize:'13px', fontWeight:'600' },
};