import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, AlertTriangle, Clock, Newspaper, Calendar } from 'lucide-react';

const TWELVEDATA_KEY  = import.meta.env.VITE_TWELVEDATA_KEY;
const FINNHUB_KEY     = import.meta.env.VITE_FINNHUB_KEY;
const OPENROUTER_KEY  = import.meta.env.VITE_OPENROUTER_KEY;
const RAPIDAPI_KEY    = import.meta.env.VITE_RAPIDAPI_KEY;

// ── Modèles en cascade ────────────────────────────────────────────────────────
const MODELS = [
  'deepseek/deepseek-v4-flash:free',
  'qwen/qwen3-8b:free',
  'meta-llama/llama-3.3-70b-instruct:free',
];

async function callOpenRouter(prompt, maxTokens = 2000) {
  let lastError = null;
  for (const model of MODELS) {
    try {
      console.log(`Essai avec : ${model}`);
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${OPENROUTER_KEY}`,
          'HTTP-Referer':  'https://tps-frontend-green.vercel.app',
          'X-Title':       'TPS Market Analysis',
        },
        body: JSON.stringify({
          model,
          messages:    [{ role: 'user', content: prompt }],
          max_tokens:  maxTokens,
          temperature: 0.3,
        })
      });
      const data = await response.json();
      if (data.error) {
        console.warn(`${model} échoué :`, data.error.message);
        lastError = new Error(data.error.message);
        continue;
      }
      const text = data.choices?.[0]?.message?.content;
      if (!text) { lastError = new Error('Réponse vide'); continue; }
      console.log(`✅ Succès avec : ${model}`);
      return text;
    } catch (err) {
      console.warn(`${model} échoué :`, err.message);
      lastError = err;
      continue;
    }
  }
  throw lastError || new Error('Tous les modèles ont échoué');
}
// ─────────────────────────────────────────────────────────────────────────────

// ── Calendrier économique ─────────────────────────────────────────────────────
function EconomicCalendar() {
  const [events,       setEvents]       = useState([]);
  const [loadingCal,   setLoadingCal]   = useState(false);
  const [errorCal,     setErrorCal]     = useState(null);
  const [selectedDay,  setSelectedDay]  = useState('today');
  const [filterImpact, setFilterImpact] = useState('all');

  const fetchCalendar = async (day) => {
    setLoadingCal(true);
    setErrorCal(null);
    setEvents([]);

    try {
      const today = new Date();

      // Format jj/mm/aaaa requis par l'API
      const fmt = (d) => {
        const dd   = String(d.getDate()).padStart(2, '0');
        const mm   = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
      };

      let fromDate, toDate;

      if (day === 'today') {
        fromDate = toDate = fmt(today);
      } else if (day === 'tomorrow') {
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        fromDate = toDate = fmt(tomorrow);
      } else {
        const end = new Date(today);
        end.setDate(today.getDate() + 6);
        fromDate = fmt(today);
        toDate   = fmt(end);
      }

      const url = new URL('https://trader-calendar-api.p.rapidapi.com/calendar');
      url.searchParams.append('startDate', fromDate);
      url.searchParams.append('endDate',   toDate);

      const r = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'trader-calendar-api.p.rapidapi.com',
          'x-rapidapi-key':  RAPIDAPI_KEY,
        },
      });

      const d = await r.json();
      console.log('RapidAPI response:', d);

      // Adapter la réponse à notre format — couvre plusieurs structures possibles
      const raw = Array.isArray(d) ? d : (d.data || d.events || d.calendar || d.result || []);

      const formatted = raw
        .map(e => ({
          date:     e.date       || e.Date       || e.releaseDate || '',
          time:     e.time       || e.Time       || e.hour        || e.releaseTime || '--:--',
          country:  e.country    || e.Country    || e.currency    || e.zone        || 'US',
          event:    e.event      || e.Event      || e.name        || e.title       || e.indicator || '',
          impact:   ((e.impact   || e.Impact     || e.volatility  || e.importance  || 'low') + '').toLowerCase(),
          prev:     e.previous   || e.prev       || e.Previous    || e.last        || '',
          estimate: e.forecast   || e.estimate   || e.Forecast    || e.consensus   || '',
          actual:   e.actual     || e.Actual     || e.value       || '',
        }))
        .filter(e => e.event !== '');

      if (formatted.length === 0) {
        setEvents([{
          date:    fromDate,
          time:    '--:--',
          country: 'US',
          event:   'Aucun événement économique pour cette période',
          impact:  'low',
          prev: '', estimate: '', actual: '',
        }]);
      } else {
        setEvents(formatted);
      }

    } catch (err) {
      console.error('Erreur calendrier:', err);
      setErrorCal('Impossible de charger le calendrier. Vérifie ta clé RapidAPI dans Vercel.');
    } finally {
      setLoadingCal(false);
    }
  };

  useEffect(() => { fetchCalendar('today'); }, []);

  const handleDay = (day) => { setSelectedDay(day); fetchCalendar(day); };

  const impactColor = (impact) => {
    const i = (impact || '').toLowerCase();
    if (i === 'high'   || i === '3' || i === 'red')    return '#ef4444';
    if (i === 'medium' || i === '2' || i === 'orange') return '#f59e0b';
    return '#6b7280';
  };

  const impactLabel = (impact) => {
    const i = (impact || '').toLowerCase();
    if (i === 'high'   || i === '3' || i === 'red')    return '🔴 Fort';
    if (i === 'medium' || i === '2' || i === 'orange') return '🟡 Moyen';
    return '⚪ Faible';
  };

  const countryFlag = (country) => {
    const flags = {
      'US':'🇺🇸','USD':'🇺🇸','EUR':'🇪🇺','EU':'🇪🇺',
      'GB':'🇬🇧','GBP':'🇬🇧','UK':'🇬🇧','JP':'🇯🇵',
      'JPY':'🇯🇵','CA':'🇨🇦','CAD':'🇨🇦','AU':'🇦🇺',
      'AUD':'🇦🇺','CH':'🇨🇭','CHF':'🇨🇭','CN':'🇨🇳',
      'CNY':'🇨🇳','DE':'🇩🇪','FR':'🇫🇷','NZ':'🇳🇿','NZD':'🇳🇿',
    };
    return flags[country?.toUpperCase()] || '🌍';
  };

  const filteredEvents = events.filter(e =>
    filterImpact === 'all' || (e.impact || '').toLowerCase() === filterImpact
  );

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const order = { high: 0, '3': 0, red: 0, medium: 1, '2': 1, orange: 1, low: 2, '1': 2 };
    const ia    = order[(a.impact || '').toLowerCase()] ?? 3;
    const ib    = order[(b.impact || '').toLowerCase()] ?? 3;
    if (ia !== ib) return ia - ib;
    return (a.time || '').localeCompare(b.time || '');
  });

  return (
    <div style={c.card}>
      <div style={c.header}>
        <div style={c.headerLeft}>
          <Calendar size={16} color="#f59e0b"/>
          <span style={c.headerTitle}>📅 Annonces Économiques</span>
          <span style={c.liveTag}>🔗 Live</span>
        </div>
        <button onClick={() => fetchCalendar(selectedDay)} style={c.refreshBtn}>
          <RefreshCw size={14}/>
        </button>
      </div>

      <div style={c.tabsRow}>
        {[
          { key: 'today',    label: "Aujourd'hui"  },
          { key: 'tomorrow', label: 'Demain'        },
          { key: 'week',     label: 'Cette semaine' },
        ].map(tab => (
          <button key={tab.key} onClick={() => handleDay(tab.key)} style={{
            ...c.tab,
            background: selectedDay === tab.key ? '#f59e0b22' : '#1f2937',
            color:      selectedDay === tab.key ? '#f59e0b'   : '#6b7280',
            border:     `1px solid ${selectedDay === tab.key ? '#f59e0b44' : '#374151'}`,
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={c.filtersRow}>
        <span style={c.filterLabel}>Impact :</span>
        {[
          { key: 'all',    label: 'Tous'      },
          { key: 'high',   label: '🔴 Fort'   },
          { key: 'medium', label: '🟡 Moyen'  },
          { key: 'low',    label: '⚪ Faible' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilterImpact(f.key)} style={{
            ...c.filterBtn,
            background: filterImpact === f.key ? '#ffffff11' : 'transparent',
            color:      filterImpact === f.key ? '#fff'      : '#6b7280',
          }}>
            {f.label}
          </button>
        ))}
        <span style={c.eventCount}>{sortedEvents.length} événements</span>
      </div>

      {loadingCal && (
        <div style={c.loading}>
          <RefreshCw size={16} style={{animation:'spin 1s linear infinite', color:'#f59e0b'}}/>
          <span>Chargement des annonces économiques...</span>
        </div>
      )}

      {errorCal && (
        <div style={c.error}>
          ⚠️ {errorCal}
          <button onClick={() => fetchCalendar(selectedDay)} style={c.retryBtn}>
            Réessayer
          </button>
        </div>
      )}

      {!loadingCal && !errorCal && sortedEvents.length === 0 && (
        <div style={c.empty}>✅ Aucune annonce économique pour cette période</div>
      )}

      {!loadingCal && sortedEvents.length > 0 && (
        <div style={c.eventsList}>
          {sortedEvents.map((event, i) => (
            <div key={i} style={{...c.eventRow, borderLeft:`3px solid ${impactColor(event.impact)}`}}>
              <div style={c.eventLeft}>
                <div style={c.eventTime}>{event.time ? String(event.time).substring(0,5) : '--:--'}</div>
                <div style={c.eventCountry}>{countryFlag(event.country)} {event.country || ''}</div>
              </div>
              <div style={c.eventCenter}>
                <div style={c.eventName}>{event.event}</div>
                <div style={c.eventDate}>{event.date}</div>
              </div>
              <div style={c.eventRight}>
                <div style={{...c.impactTag, background: impactColor(event.impact)+'22', color: impactColor(event.impact)}}>
                  {impactLabel(event.impact)}
                </div>
                <div style={c.eventValues}>
                  {event.actual   != null && event.actual   !== '' && <span style={c.actualValue}>A: {event.actual}</span>}
                  {event.estimate != null && event.estimate !== '' && <span style={c.estimateValue}>P: {event.estimate}</span>}
                  {event.prev     != null && event.prev     !== '' && <span style={c.prevValue}>Pr: {event.prev}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={c.legend}>
        <span style={c.legendItem}><span style={{color:'#9ca3af'}}>A</span> = Actuel</span>
        <span style={c.legendItem}><span style={{color:'#9ca3af'}}>P</span> = Prévu</span>
        <span style={c.legendItem}><span style={{color:'#9ca3af'}}>Pr</span> = Précédent</span>
        <span style={{...c.legendItem, marginLeft:'auto', color:'#00a8ff'}}>🔗 RapidAPI Live</span>
      </div>
    </div>
  );
}

const c = {
  card:          { background:'#111827', border:'1px solid #1f2937', borderRadius:'12px', padding:'16px', marginBottom:'16px' },
  header:        { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' },
  headerLeft:    { display:'flex', alignItems:'center', gap:'8px' },
  headerTitle:   { color:'#fff', fontSize:'14px', fontWeight:'600' },
  refreshBtn:    { background:'#1f2937', border:'1px solid #374151', borderRadius:'6px', color:'#6b7280', padding:'6px', cursor:'pointer', display:'flex' },
  liveTag:       { background:'#00a8ff22', color:'#00a8ff', fontSize:'10px', fontWeight:'700', padding:'2px 6px', borderRadius:'4px' },
  tabsRow:       { display:'flex', gap:'8px', marginBottom:'10px', flexWrap:'wrap' },
  tab:           { padding:'6px 14px', borderRadius:'8px', cursor:'pointer', fontSize:'12px', fontWeight:'600' },
  filtersRow:    { display:'flex', alignItems:'center', gap:'6px', marginBottom:'12px', flexWrap:'wrap' },
  filterLabel:   { color:'#6b7280', fontSize:'11px' },
  filterBtn:     { padding:'4px 10px', borderRadius:'6px', border:'none', cursor:'pointer', fontSize:'11px', fontWeight:'500' },
  eventCount:    { marginLeft:'auto', color:'#6b7280', fontSize:'11px' },
  loading:       { display:'flex', alignItems:'center', gap:'8px', color:'#9ca3af', fontSize:'13px', padding:'20px', justifyContent:'center' },
  error:         { color:'#ef4444', fontSize:'13px', padding:'12px', background:'#ef444411', borderRadius:'8px' },
  retryBtn:      { background:'none', border:'1px solid #ef4444', color:'#ef4444', borderRadius:'6px', padding:'4px 10px', cursor:'pointer', fontSize:'11px', marginTop:'8px', display:'block' },
  empty:         { color:'#6b7280', fontSize:'13px', padding:'20px', textAlign:'center' },
  eventsList:    { display:'flex', flexDirection:'column', gap:'8px', maxHeight:'400px', overflowY:'auto' },
  eventRow:      { display:'flex', alignItems:'center', gap:'12px', background:'#0f172a', borderRadius:'8px', padding:'10px 12px', flexWrap:'wrap' },
  eventLeft:     { display:'flex', flexDirection:'column', gap:'2px', minWidth:'50px' },
  eventTime:     { color:'#fff', fontSize:'13px', fontWeight:'700', fontFamily:'monospace' },
  eventCountry:  { color:'#6b7280', fontSize:'11px' },
  eventCenter:   { flex:1, minWidth:'120px' },
  eventName:     { color:'#d1d5db', fontSize:'12px', fontWeight:'600', lineHeight:'1.4' },
  eventDate:     { color:'#6b7280', fontSize:'10px', marginTop:'2px' },
  eventRight:    { display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'4px' },
  impactTag:     { padding:'2px 8px', borderRadius:'99px', fontSize:'10px', fontWeight:'700', whiteSpace:'nowrap' },
  eventValues:   { display:'flex', gap:'6px' },
  actualValue:   { color:'#00d4aa', fontSize:'10px', fontWeight:'600' },
  estimateValue: { color:'#f59e0b', fontSize:'10px', fontWeight:'600' },
  prevValue:     { color:'#6b7280', fontSize:'10px' },
  legend:        { display:'flex', gap:'12px', marginTop:'10px', paddingTop:'10px', borderTop:'1px solid #1f2937' },
  legendItem:    { color:'#6b7280', fontSize:'10px' },
};
// ─────────────────────────────────────────────────────────────────────────────

export default function MarketAnalysis() {
  const [analysis,     setAnalysis]     = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const [rawData,      setRawData]      = useState(null);
  const [currentModel, setCurrentModel] = useState(null);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setCurrentModel('Recherche du meilleur modèle disponible...');

    try {
      let xauusd = { price: 'N/A', change: 'N/A', change_percent: 'N/A' };
      try {
        const r = await fetch(`https://api.twelvedata.com/quote?symbol=XAU/USD&apikey=${TWELVEDATA_KEY}`);
        const d = await r.json();
        xauusd = {
          price:          parseFloat(d.close || d.price || 0).toFixed(2),
          change:         parseFloat(d.change || 0).toFixed(2),
          change_percent: parseFloat(d.percent_change || 0).toFixed(2),
        };
      } catch {}

      let dxy = { price: 'N/A', change_percent: 'N/A' };
      try {
        const r = await fetch(`https://api.twelvedata.com/quote?symbol=DXY&apikey=${TWELVEDATA_KEY}`);
        const d = await r.json();
        dxy = {
          price:          parseFloat(d.close || d.price || 0).toFixed(2),
          change_percent: parseFloat(d.percent_change || 0).toFixed(2),
        };
      } catch {}

      let fearGreed = { value: 'N/A', label: 'N/A' };
      try {
        const r = await fetch('https://api.alternative.me/fng/?limit=1');
        const d = await r.json();
        fearGreed = {
          value: d.data?.[0]?.value                || 'N/A',
          label: d.data?.[0]?.value_classification || 'N/A',
        };
      } catch {}

      let news = [];
      try {
        const r = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_KEY}`);
        const d = await r.json();
        const keywords = ['gold','xauusd','dollar','fed','inflation','rate','treasury','commodity'];
        news = d
          .filter(n => keywords.some(k =>
            (n.headline || '').toLowerCase().includes(k) ||
            (n.summary  || '').toLowerCase().includes(k)
          ))
          .slice(0, 5)
          .map(n => n.headline);
      } catch {}

      let events = [];
      try {
        const today = new Date();
        const dd    = String(today.getDate()).padStart(2,'0');
        const mm    = String(today.getMonth()+1).padStart(2,'0');
        const yyyy  = today.getFullYear();
        const todayFmt = `${dd}/${mm}/${yyyy}`;

        const url = new URL('https://trader-calendar-api.p.rapidapi.com/calendar');
        url.searchParams.append('startDate', todayFmt);
        url.searchParams.append('endDate',   todayFmt);

        const r = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'x-rapidapi-host': 'trader-calendar-api.p.rapidapi.com',
            'x-rapidapi-key':  RAPIDAPI_KEY,
          },
        });
        const d   = await r.json();
        const raw = Array.isArray(d) ? d : (d.data || d.events || d.calendar || d.result || []);
        events = raw
          .filter(e => {
            const imp = ((e.impact || e.Impact || e.volatility || e.importance || '') + '').toLowerCase();
            return ['high','medium','3','2','red','orange'].includes(imp);
          })
          .slice(0, 5)
          .map(e => {
            const name = e.event || e.Event || e.name || e.title || e.indicator || '';
            const time = e.time  || e.Time  || e.hour || e.releaseTime || '';
            const imp  = ((e.impact || e.Impact || e.volatility || 'medium') + '');
            return `${time} — ${name} (Impact: ${imp})`;
          });
      } catch {}

      const month      = new Date().getMonth() + 1;
      const goodMonths = [1, 8, 9, 11, 12];
      const seasonality = goodMonths.includes(month)
        ? "Favorable (mois historiquement haussier pour l'or)"
        : 'Neutre à baissier (mois historiquement moins favorable)';

      const hour = new Date().getUTCHours();
      let session = 'Hors session (liquidité faible)';
      if (hour >= 7  && hour < 12) session = 'Session Londres (haute liquidité)';
      if (hour >= 12 && hour < 17) session = 'Session New York (haute liquidité)';
      if (hour >= 17 && hour < 21) session = 'Overlap Londres/NY (liquidité maximale)';

      const collected = {
        xauusd, dxy, fear_greed: fearGreed,
        news:   news.length   > 0 ? news   : ["Aucune news filtrée disponible"],
        events: events.length > 0 ? events : ["Aucun événement majeur aujourd'hui"],
        seasonality, session,
        date: new Date().toLocaleDateString('fr-FR', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        }),
      };

      setRawData(collected);

      const prompt = `Tu es un analyste financier expert spécialisé sur le XAUUSD (Or/Dollar).
Analyse ces données de marché en temps réel et donne une analyse fondamentale complète et précise en français.

DONNÉES DU MARCHÉ (${collected.date}) :

📈 XAUUSD :
- Prix actuel : ${collected.xauusd.price}$
- Variation du jour : ${collected.xauusd.change}$ (${collected.xauusd.change_percent}%)

💵 DXY (Dollar Index) :
- Valeur : ${collected.dxy.price}
- Variation : ${collected.dxy.change_percent}%
- Rappel : corrélation INVERSE avec l'or (DXY monte = or baisse)

😨 Fear & Greed Index : ${collected.fear_greed.value}/100 (${collected.fear_greed.label})
- 0-25 = Extreme Fear → or refuge très demandé
- 25-45 = Fear → légèrement favorable à l'or
- 45-55 = Neutre
- 55-75 = Greed → défavorable à l'or
- 75-100 = Extreme Greed → très défavorable

📰 Actualités récentes sur le Gold/Dollar :
${collected.news.map((n,i) => `${i+1}. ${n}`).join('\n')}

📅 Événements économiques du jour :
${collected.events.map((e,i) => `${i+1}. ${e}`).join('\n')}

🗓️ Saisonnalité : ${collected.seasonality}
⏰ Session actuelle : ${collected.session}

INSTRUCTIONS IMPORTANTES :
- Analyse chaque donnée séparément et en combinaison
- Identifie les confluences haussières ou baissières
- Donne des zones de prix RÉELLES basées sur le prix actuel
- Sois précis et concret comme un analyste professionnel
- Ne dis pas "données insuffisantes" — analyse ce que tu as

Réponds UNIQUEMENT avec un JSON valide (sans markdown, sans backticks) :
{
  "biais": "HAUSSIER" ou "BAISSIER" ou "NEUTRE",
  "force_signal": "FORT" ou "MODÉRÉ" ou "FAIBLE",
  "resume": "résumé précis en 2-3 phrases de la situation actuelle",
  "analyse_dxy": "impact précis du dollar sur l'or aujourd'hui",
  "analyse_sentiment": "interprétation précise du Fear&Greed",
  "analyse_news": "impact des actualités sur l'or",
  "evenements_importants": "événements à surveiller aujourd'hui et cette semaine",
  "meilleur_moment": "moment précis pour trader avec justification",
  "zones_cles": "supports et résistances précis basés sur le prix actuel",
  "risques": ["risque concret 1", "risque concret 2"],
  "opportunites": ["opportunité concrète 1", "opportunité concrète 2"],
  "conseil_final": "conseil précis et actionnable pour trader aujourd'hui"
}`;

      const text    = await callOpenRouter(prompt, 2000);
      const cleaned = text.replace(/```json|```/g, '').trim();
      const parsed  = JSON.parse(cleaned);
      setAnalysis(parsed);
      setCurrentModel(null);

    } catch (err) {
      console.error('Erreur analyse:', err);
      setError('Tous les modèles IA sont temporairement indisponibles. Réessaie dans quelques minutes.');
      setCurrentModel(null);
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
      <div style={s.header}>
        <div>
          <h1 style={s.title}>📊 Analyse Marché</h1>
          <p style={s.subtitle}>Analyse fondamentale XAUUSD en temps réel par IA</p>
        </div>
      </div>

      <EconomicCalendar />

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

      {rawData && !loading && (
        <div style={s.rawDataGrid}>
          <div style={s.rawCard}>
            <div style={s.rawLabel}>🥇 XAUUSD</div>
            <div style={s.rawValue}>{rawData.xauusd.price}$</div>
            <div style={{...s.rawChange, color: parseFloat(rawData.xauusd.change_percent) >= 0 ? '#00d4aa' : '#ef4444'}}>
              {parseFloat(rawData.xauusd.change_percent) >= 0 ? '▲' : '▼'} {rawData.xauusd.change_percent}%
            </div>
          </div>
          <div style={s.rawCard}>
            <div style={s.rawLabel}>💵 DXY</div>
            <div style={s.rawValue}>{rawData.dxy.price}</div>
            <div style={{...s.rawChange, color: parseFloat(rawData.dxy.change_percent) >= 0 ? '#ef4444' : '#00d4aa'}}>
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
          {currentModel && <div style={s.modelInfo}>{currentModel}</div>}
        </div>
      )}

      {analysis && (
        <div style={s.results}>
          <div style={{...s.biaisCard, borderColor: biaisColor(analysis.biais)+'44'}}>
            <div style={{...s.biaisIcon, color: biaisColor(analysis.biais), background: biaisColor(analysis.biais)+'22'}}>
              {biaisIcon(analysis.biais)}
            </div>
            <div style={s.biaisInfo}>
              <div style={s.biaisLabel}>Biais du jour</div>
              <div style={{...s.biaisValue, color: biaisColor(analysis.biais)}}>{analysis.biais}</div>
              <div style={{...s.forceTag, background: biaisColor(analysis.biais)+'22', color: biaisColor(analysis.biais)}}>
                Signal {analysis.force_signal}
              </div>
            </div>
            <div style={s.resume}>{analysis.resume}</div>
          </div>

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
  modelInfo:      { color:'#6b7280', fontSize:'11px', marginTop:'8px', textAlign:'center', fontStyle:'italic' },
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