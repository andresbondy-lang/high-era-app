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

function useStorage(key) {
  const load = async (setter) => { try { const r = await window.storage.get(key, true); if (r?.value) setter(JSON.parse(r.value)); } catch {} };
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
    let prev = []; try { const r = await window.storage.get(`${CLUB}-feed-log`, true); if (r?.value) prev = JSON.parse(r.value); } catch {}
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
    (async () => { try { const r = await window.storage.get(`${CLUB}-feed-log`, true); if (r?.value) setEntries(JSON.parse(r.value)); } catch {} })();
  }, []);

  const del = async (id) => {
    const u = entries.filter(e=>e.id!==id); setEntries(u);
    try { await window.storage.set(`${CLUB}-feed-log`, JSON.stringify(u), true); } catch {}
  };

  const list = entries.filter(e =>
    (fAuthor ? e.author.toLowerCase().includes(fAuthor.toLowerCase()) : true) &&
    (fDate ? e.date===fDate : true)
  );

  return (
    <div style={S.col}>
      <div style={S.row}>
        <input value={fAuthor} onChange={e=>setFAuthor(e.target.value)} placeholder="🔍 Nombre" style={{...S.input,flex:1}}/>
        <input type="date" value={fDate} onChange={e=>setFDate(e.target.value)} style={{...S.input,flex:1}}/>
      </div>
      {list.length===0 ? <div style={{textAlign:"center",color:"#4a6a3a",padding:"30px"}}>📭 Sin registros</div> :
        list.map(e => (
          <div key={e.id} style={S.card}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"8px"}}>
              <div>
                <div style={{fontWeight:700,color:"#7ec850"}}>🏠 {Array.isArray(e.salas)?e.salas.join(", "):e.sala}</div>
                <div style={{fontSize:"12px",color:"#4a6a3a"}}>{e.date} · {e.author}</div>
                {e.stage&&<span style={{fontSize:"11px",background:"#1e3a1e",color:"#5a9a3a",padding:"2px 8px",borderRadius:"20px",marginTop:"4px",display:"inline-block"}}>{e.stage}</span>}
              </div>
              <button onClick={()=>del(e.id)} style={{background:"transparent",border:"none",cursor:"pointer",color:"#4a3a3a",fontSize:"16px"}}>✕</button>
            </div>
            {e.nutrients?.length>0&&<div style={{marginBottom:"7px"}}><div style={{fontSize:"11px",color:"#4a6a3a",marginBottom:"5px"}}>NUTRIENTES</div><div style={{display:"flex",flexWrap:"wrap",gap:"5px"}}>{e.nutrients.map((n,i)=><span key={i} style={{background:"#1e3a1e",border:"1px solid #2a5a2a",color:"#7ec850",padding:"2px 9px",borderRadius:"20px",fontSize:"12px"}}>{n.name}{n.dose?` · ${n.dose}`:""}</span>)}</div></div>}
            {(e.ph||e.ec||e.temp)&&<div style={{display:"flex",gap:"12px",marginBottom:"7px",flexWrap:"wrap"}}>{e.ph&&<span style={{fontSize:"12px",color:"#8aaa7a"}}>💧 pH {e.ph}</span>}{e.ec&&<span style={{fontSize:"12px",color:"#8aaa7a"}}>⚡ {e.ec} mS/cm</span>}{e.temp&&<span style={{fontSize:"12px",color:"#8aaa7a"}}>🌡️ {e.temp}°C</span>}</div>}
            {e.treatments?.length>0&&<div style={{marginBottom:"7px"}}><div style={{fontSize:"11px",color:"#7a4ab8",marginBottom:"5px"}}>TRATAMIENTOS</div><div style={{display:"flex",flexWrap:"wrap",gap:"5px"}}>{e.treatments.map((t,i)=><span key={i} style={{background:"#2a1e3a",border:"1px solid #5a3a9a",color:"#b07ee8",padding:"2px 9px",borderRadius:"20px",fontSize:"12px"}}>{t.name}{t.dose?` · ${t.dose}`:""}</span>)}</div></div>}
            {e.notes&&<div style={{fontSize:"13px",color:"#6a8a5a",borderTop:"1px solid #1e3a1e",paddingTop:"7px",marginTop:"7px"}}>{e.notes}</div>}
          </div>
        ))
      }
    </div>
  );
}

// ── SHOP TAB ─────────────────────────────────────────────
function ShopTab() {
  const KEY = `${CLUB}-shopping-list`;
  const [items, setItems] = useState([]);
  const [input, setInput] = useState("");
  const [author, setAuthor] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => { (async()=>{ try { const r=await window.storage.get(KEY,true); if(r?.value) setItems(JSON.parse(r.value)); } catch {} })(); }, []);

  const save = async (u) => { setItems(u); try { await window.storage.set(KEY,JSON.stringify(u),true); } catch {} };
  const add = async () => {
    if (!input.trim()||!author.trim()) return;
    await save([{id:Date.now(),product:input.trim(),author:author.trim(),ts:new Date().toISOString(),done:false},...items]);
    setInput(""); setSaved(true); setTimeout(()=>setSaved(false),1500);
  };
  const toggle = async (id) => save(items.map(i=>i.id===id?{...i,done:!i.done}:i));
  const del = async (id) => save(items.filter(i=>i.id!==id));
  const clearDone = async () => save(items.filter(i=>!i.done));

  const pending = items.filter(i=>!i.done);
  const done = items.filter(i=>i.done);

  return (
    <div style={S.col}>
      {saved&&<div style={S.toast("#f0c050")}>✅ Agregado</div>}
      <div style={{background:"#1e1a0a",border:"1px solid #3a3010",borderRadius:"11px",padding:"14px",display:"flex",flexDirection:"column",gap:"9px"}}>
        <div style={{fontSize:"11px",color:"#c8930a",fontWeight:600,textTransform:"uppercase"}}>🛒 Agregar producto</div>
        <input value={author} onChange={e=>setAuthor(e.target.value)} placeholder="Tu nombre" style={{...S.input,borderColor:"#3a3010"}}/>
        <div style={{display:"flex",gap:"8px"}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder="¿Qué falta?" style={{...S.input,flex:1,borderColor:"#3a3010"}}/>
          <button onClick={add} style={{padding:"9px 14px",borderRadius:"8px",border:"none",cursor:"pointer",background:input&&author?"#b87d10":"#2a2010",color:input&&author?"#fff":"#5a4a20",fontWeight:700}}>+</button>
        </div>
      </div>

      {pending.length>0&&<div>
        <div style={{fontSize:"11px",color:"#c8930a",fontWeight:600,textTransform:"uppercase",marginBottom:"8px"}}>📋 Pendientes ({pending.length})</div>
        {pending.map(item=>(
          <div key={item.id} style={{background:"#1e1a0a",border:"1px solid #3a3010",borderRadius:"9px",padding:"11px 13px",display:"flex",alignItems:"center",gap:"9px",marginBottom:"7px"}}>
            <button onClick={()=>toggle(item.id)} style={{width:"20px",height:"20px",borderRadius:"5px",border:"2px solid #c8930a",background:"transparent",cursor:"pointer",flexShrink:0}}/>
            <div style={{flex:1}}>
              <div style={{fontWeight:600,color:"#f0c050"}}>{item.product}</div>
              <div style={{fontSize:"11px",color:"#7a6a3a"}}>{item.author} · {item.ts?.slice(0,10)}</div>
            </div>
            <button onClick={()=>del(item.id)} style={{background:"transparent",border:"none",cursor:"pointer",color:"#4a3a3a"}}>✕</button>
          </div>
        ))}
      </div>}

      {done.length>0&&<div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
          <div style={{fontSize:"11px",color:"#4a6a3a",fontWeight:600,textTransform:"uppercase"}}>✅ Comprados ({done.length})</div>
          <button onClick={clearDone} style={{fontSize:"12px",color:"#c87070",background:"transparent",border:"none",cursor:"pointer",fontWeight:600}}>Limpiar</button>
        </div>
        {done.map(item=>(
          <div key={item.id} style={{background:"#121a12",border:"1px solid #2a3a2a",borderRadius:"9px",padding:"9px 13px",display:"flex",alignItems:"center",gap:"9px",marginBottom:"6px",opacity:0.6}}>
            <button onClick={()=>toggle(item.id)} style={{width:"20px",height:"20px",borderRadius:"5px",border:"2px solid #4a9a20",background:"#4a9a20",cursor:"pointer",flexShrink:0,fontSize:"11px",color:"#fff"}}>✓</button>
            <div style={{flex:1,textDecoration:"line-through",fontSize:"13px",color:"#5a7a5a"}}>{item.product}</div>
            <button onClick={()=>del(item.id)} style={{background:"transparent",border:"none",cursor:"pointer",color:"#3a2a2a"}}>✕</button>
          </div>
        ))}
      </div>}

      {items.length===0&&<div style={{textAlign:"center",color:"#4a5a3a",padding:"30px"}}>🛒 Lista vacía</div>}
    </div>
  );
}

// ── TRAZ TAB ─────────────────────────────────────────────
function TrazTab() {
  const KEY = `${CLUB}-trazabilidad`;
  const empty = () => { const o={}; COSECHAS.forEach(c=>{o[c]={veg:{count:null,history:[]},flora:{count:null,history:[]}}}); return o; };
  const [traz, setTraz] = useState(empty());
  const [form, setForm] = useState({ cosecha:"C1", etapa:"veg", count:"", motivo:"", author:"" });
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { (async()=>{ try { const r=await window.storage.get(KEY,true); if(r?.value) setTraz(JSON.parse(r.value)); } catch {} })(); }, []);

  const submit = async () => {
    if (!form.count||!form.author) return;
    const n = parseInt(form.count);
    const cur = traz[form.cosecha][form.etapa];
    const prev = cur.count;
    const h = { id:Date.now(), date:new Date().toISOString().slice(0,10), count:n, prev, diff:prev!==null?n-prev:null, motivo:form.motivo, author:form.author };
    const updated = { ...traz, [form.cosecha]: { ...traz[form.cosecha], [form.etapa]: { count:n, history:[h,...(cur.history||[])] } } };
    setTraz(updated);
    try { await window.storage.set(KEY,JSON.stringify(updated),true); } catch {}
    setForm(f=>({...f,count:"",motivo:""}));
    setSaved(true); setTimeout(()=>setSaved(false),2000);
  };

  return (
    <div style={S.col}>
      {saved&&<div style={S.toast("#70c8f0")}>✅ Actualizado</div>}

      <div style={{background:"#101e2a",border:"1px solid #1a4a6a",borderRadius:"11px",padding:"14px",display:"flex",flexDirection:"column",gap:"11px"}}>
        <div style={{fontSize:"11px",color:"#4a9ac8",fontWeight:600,textTransform:"uppercase"}}>📝 Actualizar conteo</div>

        <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
          {COSECHAS.map(c=><button key={c} onClick={()=>setForm(f=>({...f,cosecha:c}))} style={{...S.chip(form.cosecha===c,"#2a8ac8"),flex:1,minWidth:"40px"}}>{c}</button>)}
        </div>

        <div style={{display:"flex",gap:"8px"}}>
          <button onClick={()=>setForm(f=>({...f,etapa:"veg"}))} style={S.chip(form.etapa==="veg")}>🌱 Veg</button>
          <button onClick={()=>setForm(f=>({...f,etapa:"flora"}))} style={{...S.chip(form.etapa==="flora","#c87020")}}>🌸 Flora</button>
        </div>

        <div style={{background:"#0a1420",borderRadius:"8px",padding:"9px 12px",fontSize:"13px",color:"#6a9ab8"}}>
          {form.cosecha} · {form.etapa==="veg"?"Vegetativo":"Floración"}: <strong style={{color:"#f0c050",fontSize:"16px"}}>{traz[form.cosecha]?.[form.etapa]?.count??"-"}</strong> plantas
        </div>

        <Field label="Nuevo conteo *"><input value={form.count} onChange={e=>setForm(f=>({...f,count:e.target.value}))} placeholder="Ej: 28" style={{...S.input,borderColor:"#1a4a6a"}} type="number" min="0"/></Field>
        <Field label="Motivo (opcional)"><input value={form.motivo} onChange={e=>setForm(f=>({...f,motivo:e.target.value}))} placeholder="Ej: murió 1 por raíz, se agregaron 5..." style={{...S.input,borderColor:"#1a4a6a"}}/></Field>
        <Field label="Quién registra *"><input value={form.author} onChange={e=>setForm(f=>({...f,author:e.target.value}))} placeholder="Tu nombre" style={{...S.input,borderColor:"#1a4a6a"}}/></Field>
        <button onClick={submit} style={S.btn(!!form.count&&!!form.author)}>💾 Guardar</button>
      </div>

      {COSECHAS.map(c=>{
        const veg=traz[c]?.veg; const flora=traz[c]?.flora;
        return (
          <div key={c} style={{background:"#0f1a20",border:"1px solid #1a3a5a",borderRadius:"10px",overflow:"hidden"}}>
            <button onClick={()=>setExpanded(expanded===c?null:c)} style={{width:"100%",background:"transparent",border:"none",cursor:"pointer",padding:"12px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                <span style={{fontWeight:700,fontSize:"15px",color:"#70a8d8"}}>{c}</span>
                <span style={{fontSize:"13px",color:"#5a9a4a"}}>🌱 {veg?.count??"-"}</span>
                <span style={{fontSize:"13px",color:"#c87a3a"}}>🌸 {flora?.count??"-"}</span>
              </div>
              <span style={{color:"#3a5a7a"}}>{expanded===c?"▲":"▼"}</span>
            </button>
            {expanded===c&&(
              <div style={{borderTop:"1px solid #1a3a5a",padding:"12px 14px",display:"flex",flexDirection:"column",gap:"12px"}}>
                {[["veg","🌱 Vegetativo","#5a9a4a"],["flora","🌸 Floración","#c87a3a"]].map(([et,label,col])=>{
                  const d=traz[c]?.[et];
                  return (
                    <div key={et}>
                      <div style={{fontSize:"12px",color:col,fontWeight:600,marginBottom:"7px"}}>{label} — {d?.count??"-"} plantas</div>
                      {d?.history?.length>0
                        ? d.history.map(h=>(
                          <div key={h.id} style={{background:"#0a1420",borderRadius:"7px",padding:"8px 11px",marginBottom:"5px",display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:"4px"}}>
                            <div>
                              <span style={{fontWeight:700,color:"#c8e8f0"}}>{h.count} plantas</span>
                              {h.diff!==null&&<span style={{fontSize:"12px",marginLeft:"7px",color:h.diff>0?"#7ec850":h.diff<0?"#c87070":"#6a8aaa"}}>{h.diff>0?`+${h.diff}`:h.diff===0?"=":h.diff}</span>}
                              {h.motivo&&<div style={{fontSize:"12px",color:"#5a7a8a",marginTop:"2px"}}>{h.motivo}</div>}
                            </div>
                            <div style={{fontSize:"11px",color:"#3a5a7a",textAlign:"right"}}>{h.date}<br/>{h.author}</div>
                          </div>
                        ))
                        : <div style={{fontSize:"12px",color:"#2a4a6a"}}>Sin movimientos</div>
                      }
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("log");
  const TABS = [["log","➕ Reg."],["history","📋 Historial"],["shop","🛒 Compras"],["traz","🌱 Trazab."]];

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={{display:"flex",alignItems:"center",gap:"9px"}}>
          <span style={{fontSize:"20px"}}>🌿</span>
          <div>
            <div style={{fontWeight:700,fontSize:"15px",color:"#7ec850"}}>High Era</div>
            <div style={{fontSize:"10px",color:"#6a8a5a"}}>Registro de Alimentación</div>
          </div>
        </div>
        <div style={S.tabs}>
          {TABS.map(([v,l])=><button key={v} onClick={()=>setTab(v)} style={S.tabBtn(tab===v)}>{l}</button>)}
        </div>
      </div>
      <div style={S.body}>
        {tab==="log"&&<LogTab/>}
        {tab==="history"&&<HistoryTab/>}
        {tab==="shop"&&<ShopTab/>}
        {tab==="traz"&&<TrazTab/>}
      </div>
    </div>
  );
}
