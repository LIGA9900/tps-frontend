import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../components/Toast';
import { Plus, Trash2, X, Check, Edit3, Camera, ZoomIn } from 'lucide-react';

const ASSETS = ['XAUUSD','EURUSD','GBPUSD','USDJPY','BTCUSD','NAS100','US30','GBPJPY','XAGUSD','ETHUSD'];
const SETUPS = ['Breakout','Pullback','Reversal','Continuation','Support/Resistance','EMA Bounce','ICT','SMC','Fibonacci','Order Block'];

const emptyForm = {
  date: new Date().toISOString().split('T')[0],
  asset: 'XAUUSD', type: 'BUY', setup: '',
  confluences: '', entry: '', sl: '', tp: '',
  lot: '', risk_percent: '', risk_dollar: '',
  result: 'WIN', profit: '', comment: '',
};

export default function Journal() {
  const [trades, setTrades]         = useState([]);
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(emptyForm);
  const [editingId, setEditingId]   = useState(null);
  const [loading, setLoading]       = useState(false);
  const [calc, setCalc]             = useState(null);
  const [screenshot, setScreenshot] = useState(null);
  const [preview, setPreview]       = useState(null);
  const [zoomImage, setZoomImage]   = useState(null);

  // Filtres
  const [filterAsset,  setFilterAsset]  = useState('all');
  const [filterResult, setFilterResult] = useState('all');

  const { refreshUser }           = useAuth();
  const { refresh }               = useData();
  const { show, ToastComponent }  = useToast();

  useEffect(() => { fetchTrades(); }, []);

  const fetchTrades = async () => {
    const res = await api.get('/trades');
    setTrades(res.data);
  };

  const handleChange = (e) => {
    const updated = { ...form, [e.target.name]: e.target.value };
    setForm(updated);
    if (['entry', 'sl', 'risk_percent', 'asset'].includes(e.target.name)) {
      autoCalculate(updated);
    }
  };

  // Gérer la sélection du screenshot
  const handleScreenshot = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      show('Image trop lourde (max 5MB)', 'error');
      return;
    }
    setScreenshot(file);
    setPreview(URL.createObjectURL(file));
  };

  const autoCalculate = async (f) => {
    if (f.entry && f.sl && f.risk_percent) {
      try {
        const res = await api.post('/calculate-lot', {
          capital:      parseFloat(localStorage.getItem('tps_capital') || 20),
          risk_percent: parseFloat(f.risk_percent),
          entry:        parseFloat(f.entry),
          sl:           parseFloat(f.sl),
          asset:        f.asset,
        });
        setCalc(res.data);
        setForm(prev => ({
          ...prev,
          lot:         res.data.lot,
          risk_dollar: res.data.risk_dollar,
        }));
      } catch {}
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Utiliser FormData pour envoyer l'image
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (form[key] !== '') formData.append(key, form[key]);
      });
      if (screenshot) {
        formData.append('screenshot', screenshot);
      }

      if (editingId) {
        formData.append('_method', 'PUT');
        await api.post(`/trades/${editingId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        show('Trade modifié ! ✏️', 'success');
      } else {
        await api.post('/trades', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        show('Trade enregistré ! 🎯', 'success');
      }

      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      setCalc(null);
      setScreenshot(null);
      setPreview(null);
      await fetchTrades();
      await refresh();
      await refreshUser();
    } catch (err) {
      show('Erreur lors de l\'enregistrement', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (trade) => {
    setForm({
      date:         trade.date,
      asset:        trade.asset,
      type:         trade.type,
      setup:        trade.setup        || '',
      confluences:  trade.confluences  || '',
      entry:        trade.entry,
      sl:           trade.sl,
      tp:           trade.tp,
      lot:          trade.lot,
      risk_percent: trade.risk_percent,
      risk_dollar:  trade.risk_dollar,
      result:       trade.result       || 'WIN',
      profit:       trade.profit,
      comment:      trade.comment      || '',
    });
    setEditingId(trade.id);
    setPreview(trade.screenshot_url || null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setShowForm(false);
    setForm(emptyForm);
    setEditingId(null);
    setCalc(null);
    setScreenshot(null);
    setPreview(null);
  };

  const deleteTrade = async (id) => {
    if (!confirm('Supprimer ce trade ?')) return;
    await api.delete(`/trades/${id}`);
    await fetchTrades();
    await refresh();
    await refreshUser();
    show('Trade supprimé', 'warning');
  };

  const exportCSV = () => {
    const headers = ['Date','Actif','Type','Setup','Entrée','SL','TP','Lot','Risque%','Résultat','Profit'];
    const rows = trades.map(t => [
      t.date, t.asset, t.type, t.setup || '',
      t.entry, t.sl, t.tp, t.lot,
      t.risk_percent, t.result, t.profit
    ]);
    const csv  = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `tps-trades-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    show('Export CSV téléchargé ! 📊', 'success');
  };

  const filteredTrades = trades.filter(t => {
    const assetOk  = filterAsset  === 'all' || t.asset  === filterAsset;
    const resultOk = filterResult === 'all' || t.result === filterResult;
    return assetOk && resultOk;
  });

  const uniqueAssets = [...new Set(trades.map(t => t.asset))];

  return (
    <div style={s.page}>

      {/* Modal zoom image */}
      {zoomImage && (
        <div onClick={() => setZoomImage(null)} style={s.zoomOverlay}>
          <div style={s.zoomContainer}>
            <img src={zoomImage} alt="Screenshot trade" style={s.zoomImage}/>
            <button onClick={() => setZoomImage(null)} style={s.zoomClose}>
              <X size={20}/>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>📒 Journal de Trading</h1>
          <p style={s.subtitle}>{trades.length} trades enregistrés</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={exportCSV} style={s.exportBtn}>📥 CSV</button>
          <button onClick={() => showForm ? handleCancel() : setShowForm(true)} style={s.addBtn}>
            {showForm ? <X size={16}/> : <Plus size={16}/>}
            {showForm ? 'Annuler' : 'Nouveau Trade'}
          </button>
        </div>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div style={s.formCard}>
          <h3 style={s.formTitle}>
            {editingId ? '✏️ Modifier le trade' : '➕ Nouveau trade'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={s.grid3}>
              <Field label="Date"  name="date"  type="date"   value={form.date}  onChange={handleChange}/>
              <SelectField label="Actif" name="asset" value={form.asset} onChange={handleChange} options={ASSETS}/>
              <SelectField label="Type"  name="type"  value={form.type}  onChange={handleChange} options={['BUY','SELL']}/>
            </div>
            <div style={s.grid3}>
              <Field label="Entrée"      name="entry" type="number" step="0.00001" value={form.entry} onChange={handleChange} placeholder="4547.00"/>
              <Field label="Stop Loss"   name="sl"    type="number" step="0.00001" value={form.sl}    onChange={handleChange} placeholder="4540.00"/>
              <Field label="Take Profit" name="tp"    type="number" step="0.00001" value={form.tp}    onChange={handleChange} placeholder="4561.00"/>
            </div>
            <div style={s.grid3}>
              <Field label="Risque %"   name="risk_percent" type="number" step="0.1"  value={form.risk_percent} onChange={handleChange} placeholder="50"/>
              <Field label="Lot (auto)" name="lot"          type="number" step="0.01" value={form.lot}          onChange={handleChange} placeholder="0.01"/>
              <Field label="Risque $"   name="risk_dollar"  type="number" step="0.01" value={form.risk_dollar}  onChange={handleChange} placeholder="0.00"/>
            </div>

            {calc && (
              <div style={s.calcResult}>
                <Check size={14} color="#00d4aa"/>
                <span>Lot : <strong style={{color:'#00d4aa'}}>{calc.lot}</strong></span>
                <span>Risque : <strong style={{color:'#f59e0b'}}>{calc.risk_dollar}$</strong></span>
                <span>SL : <strong style={{color:'#fff'}}>{calc.sl_distance} pts</strong></span>
              </div>
            )}

            <div style={s.grid2}>
              <SelectField label="Setup"    name="setup"  value={form.setup}  onChange={handleChange} options={['', ...SETUPS]}/>
              <SelectField label="Résultat" name="result" value={form.result} onChange={handleChange} options={['WIN','LOSS','BREAKEVEN']}/>
            </div>
            <div style={s.grid2}>
              <Field label="Profit/Perte ($)" name="profit"      type="number" step="0.01" value={form.profit}      onChange={handleChange} placeholder="7.54"/>
              <Field label="Confluences"      name="confluences"                            value={form.confluences} onChange={handleChange} placeholder="Support H4, EMA 200..."/>
            </div>

            <div style={{ marginTop: '10px' }}>
              <label style={s.label}>Commentaire</label>
              <textarea name="comment" value={form.comment} onChange={handleChange}
                placeholder="Notes sur ce trade..." style={s.textarea} rows={2}/>
            </div>

            {/* Upload Screenshot */}
            <div style={s.screenshotSection}>
              <label style={s.label}>📸 Screenshot TradingView</label>
              <div style={s.screenshotUpload}>
                {preview ? (
                  <div style={s.previewContainer}>
                    <img src={preview} alt="Preview" style={s.previewImg}/>
                    <button type="button" onClick={() => { setScreenshot(null); setPreview(null); }} style={s.removeImg}>
                      <X size={14}/> Supprimer
                    </button>
                  </div>
                ) : (
                  <label style={s.uploadLabel}>
                    <input type="file" accept="image/*" onChange={handleScreenshot} style={{display:'none'}}/>
                    <Camera size={24} color="#6b7280"/>
                    <span style={{color:'#6b7280', fontSize:'13px', marginTop:'8px'}}>
                      Cliquer pour uploader
                    </span>
                    <span style={{color:'#374151', fontSize:'11px'}}>PNG, JPG, max 5MB</span>
                  </label>
                )}
              </div>
            </div>

            <div style={{ display:'flex', gap:'10px', marginTop:'16px' }}>
              <button type="submit" style={s.submitBtn} disabled={loading}>
                {loading ? 'Enregistrement...' : editingId ? '💾 Sauvegarder' : '✅ Enregistrer'}
              </button>
              {editingId && (
                <button type="button" onClick={handleCancel} style={s.cancelBtn}>Annuler</button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Filtres */}
      <div style={s.filtersBar}>
        <div style={s.filterGroup}>
          <label style={s.filterLabel}>Actif :</label>
          <select value={filterAsset} onChange={e => setFilterAsset(e.target.value)} style={s.filterSelect}>
            <option value="all">Tous</option>
            {uniqueAssets.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div style={s.filterGroup}>
          <label style={s.filterLabel}>Résultat :</label>
          <select value={filterResult} onChange={e => setFilterResult(e.target.value)} style={s.filterSelect}>
            <option value="all">Tous</option>
            <option value="WIN">WIN</option>
            <option value="LOSS">LOSS</option>
            <option value="BREAKEVEN">BREAKEVEN</option>
          </select>
        </div>
        <div style={s.filterInfo}>{filteredTrades.length} / {trades.length} trades</div>
      </div>

      {/* Tableau */}
      <div style={s.tableCard}>
        {filteredTrades.length === 0 ? (
          <p style={s.empty}>
            {trades.length === 0 ? 'Aucun trade. Commencez par ajouter un trade !' : 'Aucun trade ne correspond aux filtres.'}
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['📸','Date','Actif','Type','Setup','Entrée','SL','TP','Lot','R%','Résultat','Profit','Actions'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTrades.map(trade => (
                  <tr key={trade.id} style={{
                    ...s.tr,
                    background: editingId === trade.id ? '#00d4aa08' : 'transparent',
                    borderLeft: editingId === trade.id ? '2px solid #00d4aa' : '2px solid transparent',
                  }}>
                    {/* Screenshot thumbnail */}
                    <td style={s.td}>
                      {trade.screenshot_url ? (
                        <img
                          src={trade.screenshot_url}
                          alt="screenshot"
                          style={s.thumbnail}
                          onClick={() => setZoomImage(trade.screenshot_url)}
                        />
                      ) : (
                        <div style={s.noScreenshot}>-</div>
                      )}
                    </td>
                    <td style={s.td}>{trade.date}</td>
                    <td style={s.td}><strong style={{color:'#00a8ff'}}>{trade.asset}</strong></td>
                    <td style={s.td}>
                      <span style={{color: trade.type==='BUY' ? '#00d4aa':'#ef4444', fontWeight:'600'}}>{trade.type}</span>
                    </td>
                    <td style={s.td}>{trade.setup || '-'}</td>
                    <td style={s.td}>{trade.entry}</td>
                    <td style={s.td}>{trade.sl}</td>
                    <td style={s.td}>{trade.tp}</td>
                    <td style={s.td}>{trade.lot}</td>
                    <td style={s.td}>{trade.risk_percent}%</td>
                    <td style={s.td}>
                      <span style={{
                        background: trade.result==='WIN' ? '#00d4aa22' : trade.result==='LOSS' ? '#ef444422' : '#f59e0b22',
                        color:      trade.result==='WIN' ? '#00d4aa'   : trade.result==='LOSS' ? '#ef4444'   : '#f59e0b',
                        padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600'
                      }}>{trade.result}</span>
                    </td>
                    <td style={{...s.td, color: trade.profit>=0 ? '#00d4aa':'#ef4444', fontWeight:'600'}}>
                      {trade.profit>=0?'+':''}{trade.profit}$
                    </td>
                    <td style={s.td}>
                      <div style={{ display:'flex', gap:'4px' }}>
                        <button onClick={() => handleEdit(trade)} style={s.editBtn} title="Modifier">
                          <Edit3 size={13}/>
                        </button>
                        <button onClick={() => deleteTrade(trade.id)} style={s.deleteBtn} title="Supprimer">
                          <Trash2 size={13}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {ToastComponent}
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <div>
      <label style={s.label}>{label}</label>
      <input {...props} style={s.input}/>
    </div>
  );
}

function SelectField({ label, options, ...props }) {
  return (
    <div>
      <label style={s.label}>{label}</label>
      <select {...props} style={s.input}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

const s = {
  page:        { maxWidth: '1200px', margin: '0 auto' },
  header:      { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'20px', flexWrap:'wrap', gap:'10px' },
  title:       { color:'#fff', fontSize:'20px', fontWeight:'700', margin:0 },
  subtitle:    { color:'#6b7280', fontSize:'13px', marginTop:'4px' },
  exportBtn:   { background:'#1f2937', border:'1px solid #374151', color:'#9ca3af', fontWeight:'600', borderRadius:'10px', padding:'10px 14px', cursor:'pointer', fontSize:'13px' },
  addBtn:      { display:'flex', alignItems:'center', gap:'8px', background:'linear-gradient(135deg,#00d4aa,#00a8ff)', color:'#000', fontWeight:'700', border:'none', borderRadius:'10px', padding:'10px 16px', cursor:'pointer', fontSize:'13px' },
  formCard:    { background:'#111827', border:'1px solid #1f2937', borderRadius:'12px', padding:'20px', marginBottom:'16px' },
  formTitle:   { color:'#fff', fontSize:'14px', fontWeight:'600', margin:'0 0 16px' },
  grid3:       { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(130px, 1fr))', gap:'10px', marginBottom:'10px' },
  grid2:       { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'10px', marginBottom:'10px' },
  label:       { display:'block', color:'#9ca3af', fontSize:'12px', fontWeight:'500', marginBottom:'5px' },
  input:       { width:'100%', background:'#1f2937', border:'1px solid #374151', borderRadius:'8px', padding:'9px 12px', color:'#fff', fontSize:'13px', outline:'none', boxSizing:'border-box' },
  textarea:    { width:'100%', background:'#1f2937', border:'1px solid #374151', borderRadius:'8px', padding:'9px 12px', color:'#fff', fontSize:'13px', outline:'none', boxSizing:'border-box', resize:'vertical' },
  calcResult:  { display:'flex', alignItems:'center', gap:'12px', background:'#00d4aa11', border:'1px solid #00d4aa33', borderRadius:'8px', padding:'10px 14px', marginBottom:'10px', fontSize:'12px', color:'#9ca3af', flexWrap:'wrap' },

  // Screenshot
  screenshotSection: { marginTop: '12px' },
  screenshotUpload:  { marginTop: '6px' },
  uploadLabel:       {
    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
    border:'2px dashed #374151', borderRadius:'10px', padding:'24px',
    cursor:'pointer', transition:'border-color 0.2s',
    background:'#1f2937',
  },
  previewContainer:  { position:'relative', display:'inline-block' },
  previewImg:        { width:'100%', maxHeight:'200px', objectFit:'cover', borderRadius:'8px', border:'1px solid #374151' },
  removeImg:         {
    position:'absolute', top:'8px', right:'8px',
    display:'flex', alignItems:'center', gap:'4px',
    background:'#ef4444', color:'#fff', border:'none',
    borderRadius:'6px', padding:'4px 8px', cursor:'pointer', fontSize:'11px'
  },

  submitBtn:   { flex:1, background:'linear-gradient(135deg,#00d4aa,#00a8ff)', color:'#000', fontWeight:'700', border:'none', borderRadius:'10px', padding:'12px 24px', cursor:'pointer', fontSize:'14px' },
  cancelBtn:   { background:'#1f2937', border:'1px solid #374151', color:'#9ca3af', fontWeight:'600', borderRadius:'10px', padding:'12px 20px', cursor:'pointer', fontSize:'14px' },

  filtersBar:  { display:'flex', alignItems:'center', gap:'12px', background:'#111827', border:'1px solid #1f2937', borderRadius:'10px', padding:'10px 14px', marginBottom:'14px', flexWrap:'wrap' },
  filterGroup: { display:'flex', alignItems:'center', gap:'8px' },
  filterLabel: { color:'#9ca3af', fontSize:'12px', fontWeight:'500', whiteSpace:'nowrap' },
  filterSelect:{ background:'#1f2937', border:'1px solid #374151', borderRadius:'6px', padding:'5px 10px', color:'#fff', fontSize:'12px', outline:'none', cursor:'pointer' },
  filterInfo:  { marginLeft:'auto', color:'#6b7280', fontSize:'12px' },

  tableCard:   { background:'#111827', border:'1px solid #1f2937', borderRadius:'12px', padding:'16px' },
  empty:       { color:'#6b7280', textAlign:'center', padding:'40px', fontSize:'14px' },
  table:       { width:'100%', borderCollapse:'collapse', minWidth:'800px' },
  th:          { color:'#6b7280', fontSize:'11px', fontWeight:'600', padding:'8px 8px', textAlign:'left', borderBottom:'1px solid #1f2937', whiteSpace:'nowrap' },
  tr:          { borderBottom:'1px solid #0f172a', transition:'background 0.15s' },
  td:          { color:'#d1d5db', fontSize:'12px', padding:'8px 8px', whiteSpace:'nowrap' },
  editBtn:     { background:'#00a8ff22', border:'none', color:'#00a8ff', borderRadius:'6px', padding:'5px 7px', cursor:'pointer' },
  deleteBtn:   { background:'#ef444422', border:'none', color:'#ef4444', borderRadius:'6px', padding:'5px 7px', cursor:'pointer' },

  // Thumbnail
  thumbnail:     { width:'40px', height:'40px', objectFit:'cover', borderRadius:'6px', cursor:'pointer', border:'1px solid #374151' },
  noScreenshot:  { color:'#374151', textAlign:'center' },

  // Zoom modal
  zoomOverlay:   { position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' },
  zoomContainer: { position:'relative', maxWidth:'95vw', maxHeight:'95vh' },
  zoomImage:     { maxWidth:'100%', maxHeight:'90vh', objectFit:'contain', borderRadius:'12px' },
  zoomClose:     { position:'absolute', top:'-40px', right:'0', background:'#ef4444', border:'none', color:'#fff', borderRadius:'8px', padding:'6px 10px', cursor:'pointer' },
};