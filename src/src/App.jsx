import { useState, useEffect } from "react";

const CLUB = "highera";
const SALAS = ["Sala Grande","Sala Medio","Sala Fondo","Sala Arriba","Sala Esquejes"];
const NUTRIENTES = ["A","B","Calmag","Rhizotonic","Silex","Melaza","Trichodermas","Otro"];
const TRATAMIENTOS = ["Amistar","IPW","Moonlight","Otro"];
const SEMANAS = ["S1","S2","S3","S4","S5","S6","S7","S8","S9"];
const COSECHAS = ["C1","C2","C3","C4","C5"];

const S = {
  page: { minHeight:"100vh", background:"#0f1a0f", color:"#d4e8c2", fontFamily:"system-ui,sans-serif" },
  header: { background:"#162716", borderBottom:"1px solid #2a4a2a", padding:"12px 14px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"8px" },
  tabs: { display:"flex", gap:"5px", flexWrap:"wrap" },
  body: { maxWidth:"600px", margin:"0 auto", padding:"16px 14px" },
  col: { display:"flex", flexDirection:"column", gap:"14px" },
  row: { display:"flex", gap:"10px" },
  label: { fontSize:"11px", color:"#5a8a4a", textTransform:"uppercase", letterSpacing:"0.5px", fontWeight:600, marginBottom:"5px" },
  input: { background:"#162716", border:"1px solid #2a4a2a", borderRadius:"8px", padding:"9px 11px", color:"#d4e8c2", fontSize:"14px", outline:"none", width:"100%", boxSizing:"border-box" },
  chip: (on, color="#4a9a20") => ({ padding:"6px 11px", borderRadius:"20px", cursor:"pointer", fontSize:"13px", fontWeight:500, border: on ? `1px solid ${color}` : "1px solid #2a4a2a", background: on ? color+"33" : "#1e2e1e", color: on ? "#d4e8c2" : "#7a9a6a" }),
  btn: (on) => ({ padding:"13px", borderRadius:"10px", border:"none", cursor: on?"pointer":"not-allowed", background: on?"#4a9a20":"#1e2e1e", color: on?"#fff":"#4a6a3a", fontWeight:700, fontSize:"14px", width:"100%" }),
  tabBtn: (on, color="#4a9a20") => ({ padding:"7px 10px", borderRadius:"7px", border:"none", cursor:"pointer", fontWeight:600, fontSize:"12px", background: on ? color : "#1e2e1e", color: on?"#fff":"#7a9a6a" }),
  card: { background:"#162716", border:"1px solid #2a4a2a", borderRadius:"11px", padding:"14px" },
  toast: (color) => ({ background: color+"22", border:`1px solid ${color}`, color, padding:"10px", borderRadius:"9px", textAlign:"center", fontWeight:600, fontSize:"13px" }),
};

function safeParse(value, fallback) {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function useStorage(key) {
  const load = async (setter, fallback) => { try { const r = await window.storage.get(key, true); if (r?.value !== undefined && r?.value !== null) setter(safeParse(r.value, fallback)); } catch {} };
  const save = async (val) => { try { await window.storage.set(key, JSON.stringify(val), true); } catch {} };
  return { load, save };
}

function Field({ label, children }) {
  return <div><div style={S.label}>{label}</div>{children}</div>;
}

function ChipGroup({ options, selected, onToggle, color }) {
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:"7px" }}>
      {options.map(o => (
        <button key={o} onClick={() => onToggle(o)} style={S.chip(selected.includes(o), color)}>
          {selected.includes(o) ? "✓ " : ""}{o}
        </button>
      ))}
    </div>
  );
}

// ── LOG TAB ──────────────────────────────────────────────
function LogTab() {
  const store = useStorage(`${CLUB}-feed-log`);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0,10), salas:[], stage:"", nutrients:[], otherN:"", nDoses:{}, ph:"", ec:"", temp:"", treatments:[], otherT:"", tDoses:{}, notes:"", author:"" });
  const [saved, setSaved] = useState(false);

  const toggle = (field, val) => setForm(f => ({ ...f, [field]: f[field].includes(val) ? f[field].filter(x=>x!==val) : [...f[field], val] }));
  const dose = (field, k, v) => setForm(f => ({ ...f, [field]: { ...f[field], [k]: v } }));

  const submit = async () => {
    if (!form.salas.length || !form.author) return;
    const entry = {
      id: Date.now(), ts: new Date().toISOString(),
      date: form.date, salas: form.salas, stage: form.stage,
      nutrients: form.nutrients.map(n => ({ name: n==="Otro" ? form.otherN||"Otro" : n, dose: form.nDoses[n]||"" })),
      ph: form.ph, ec: form.ec, temp: form.temp,
      treatments: form.treatments.map(t => ({ name: t==="Otro" ? form.otherT||"Otro" : t, dose: form.tDoses[t]||"" })),
      notes: form.notes, author: form.author,
    };
    let prev = []; try { const r = await window.storage.get(`${CLUB}-feed-log`, true); if (r?.value) prev = safeParse(r.value, []); } catch {}
    await store.save([entry, ...prev]);
    setForm({ date: new Date().toISOString().slice(0,10), salas:[], stage:"", nutrients:[], otherN:"", nDoses:{}, ph:"", ec:"", temp:"", treatments:[], otherT:"", tDoses:{}, notes:"", author:"" });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={S.col}>
      {saved && <div style={S.toast("#7ec850")}>✅ Registro guardado</div>}

      <div style={S.row}>
        <Field label="Fecha *"><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} style={{...S.input,flex:1}}/></Field>
        <Field label="Quién *"><input value={form.author} onChange={e=>setForm({...form,author:e.target.value})} placeholder="Nombre" style={{...S.input,flex:1}}/></Field>
      </div>

      <Field label="Salas * (elegí una o más)">
        <ChipGroup options={SALAS} selected={form.salas} onToggle={s=>toggle("salas",s)}/>
      </Field>

      <Field label="Etapa">
        <div style={{display:"flex",gap:"8px",marginBottom:"8px"}}>
          <button onClick={()=>setForm({...form,stage:form.stage==="Vegetativo"?"":"Vegetativo"})} style={S.chip(form.stage==="Vegetativo")}>🌱 Vegetativo</button>
          <button onClick={()=>setForm({...form,stage:form.stage?.startsWith("Flora")?"":"Flora S1"})} style={S.chip(form.stage?.startsWith("Flora"))}>🌸 Flora</button>
        </div>
        {form.stage?.startsWith("Flora") && (
          <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
            {SEMANAS.map(s => <button key={s} onClick={()=>setForm({...form,stage:`Flora ${s}`})} style={S.chip(form.stage===`Flora ${s}`)}>{s}</button>)}
          </div>
        )}
      </Field>

      <Field label="Nutrientes">
        <ChipGroup options={NUTRIENTES} selected={form.nutrients} onToggle={n=>toggle("nutrients",n)}/>
        {form.nutrients.length > 0 && (
          <div style={{marginTop:"10px",display:"flex",flexDirection:"column",gap:"7px"}}>
            {form.nutrients.map(n => (
              <div key={n} style={{display:"flex",gap:"7px",alignItems:"center"}}>
                {n==="Otro" ? <input value={form.otherN} onChange={e=>setForm({...form,otherN:e.target.value})} placeholder="¿plagas? ¿cuál?" style={{...S.input,flex:1,fontSize:"13px",padding:"7px 10px"}}/> : <span style={{fontSize:"13px",color:"#7ec850",minWidth:"100px"}}>{n}</span>}
                <input value={form.nDoses[n]||""} onChange={e=>dose("nDoses",n,e.target.value)} placeholder="dosis" style={{...S.input,fontSize:"13px",padding:"7px 10px",flex:n==="Otro"?"0 0 80px":1}}/>
              </div>
            ))}
          </div>
        )}
      </Field>

      <div style={S.row}>
        <Field label="pH"><input value={form.ph} onChange={e=>setForm({...form,ph:e.target.value})} placeholder="6.2" style={S.input} type="number" step="0.1"/></Field>
        <Field label="EC mS/cm"><input value={form.ec} onChange={e=>setForm({...form,ec:e.target.value})} placeholder="1.8" style={S.input} type="number" step="0.1"/></Field>
        <Field label="Temp °C"><input value={form.temp} onChange={e=>setForm({...form,temp:e.target.value})} placeholder="20" style={S.input} type="number" step="0.5"/></Field>
      </div>

      <Field label="Tratamientos">
        <ChipGroup options={TRATAMIENTOS} selected={form.treatments} onToggle={t=>toggle("treatments",t)} color="#7a4ab8"/>
        {form.treatments.length > 0 && (
          <div style={{marginTop:"10px",display:"flex",flexDirection:"column",gap:"7px"}}>
            {form.treatments.map(t => (
              <div key={t} style={{display:"flex",gap:"7px",alignItems:"center"}}>
                {t==="Otro" ? <input value={form.otherT} onChange={e=>setForm({...form,otherT:e.target.value})} placeholder="¿plagas? ¿cuál?" style={{...S.input,flex:1,fontSize:"13px",padding:"7px 10px"}}/> : <span style={{fontSize:"13px",color:"#b07ee8",minWidth:"100px"}}>{t}</span>}
                <input value={form.tDoses[t]||""} onChange={e=>dose("tDoses",t,e.target.value)} placeholder="dosis" style={{...S.input,fontSize:"13px",padding:"7px 10px",flex:t==="Otro"?"0 0 80px":1}}/>
              </div>
            ))}
          </div>
        )}
      </Field>

      <Field label="Notas">
        <textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Observaciones..." style={{...S.input,minHeight:"65px",resize:"vertical"}}/>
      </Field>

      <button onClick={submit} style={S.btn(form.salas.length>0&&!!form.author)}>💾 Guardar</button>
    </div>
  );
}

// ── HISTORY TAB ───────────────────────────────────────────
function HistoryTab() {
  const [entries, setEntries] = useState([]);
  const [fAuthor, setFAuthor] = useState("");
  const [fDate, setFDate] = useState("");

  useEffect(() => {
