"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";

/* ═══════════════════════════════════════════════════════════════
   DVB FICHAS — MÓDULO ADMINISTRADOR
   Conecta a Supabase · Visual: DM Sans + DM Mono
   ═══════════════════════════════════════════════════════════════ */

// ── Tree structure (same as user module) ──
const NM='Nicolás Mendez', AC='Alberto Cantillo', LC='Liliana Chacón';
const PROVS=['Huawei','ZTE','LPS','Comfica','Tabasco','Fiber Home','Inmel','Sicte','Telcos','Dominion','Conectar','Dico','Cinco'];
const PKEYS=['hw','zte','lps','com','tab','fh','inm','sic','tel','dom','con','dic','cin'];
const CLUSTERS=[{n:1,name:'Cluster 1–1000'},{n:2,name:'Cluster 1001–2000'},{n:3,name:'Cluster 2001–3000'},{n:4,name:'Cluster >3000'}];
const CONSTRS=[{s:'a',name:'Construcción 0%–30%'},{s:'b',name:'Construcción 31%–50%'},{s:'c',name:'Construcción 51%–70%'},{s:'d',name:'Construcción 71%–100%'}];
const LN=['PROGRAMA','PROYECTO','DOMINIO','DRIVER','SUB-DRIVER','CLUSTER','NIVEL CONSTR.','PROVEEDOR'];

function buildAllLeaves() {
  const leaves = [];
  const P0='Disminución del churn 0.5%', P1='Brownfield';
  leaves.push({id:'lpe',steps:[P0,P1,'Acceso Fijo','Licencias P. Externa','','','',''],lv:'N3',gestor:NM});
  CLUSTERS.forEach(cl => CONSTRS.forEach(co => PROVS.forEach((p,pi) => {
    let id; const n=cl.n;
    if(n===1&&co.s==='a') id=`${PKEYS[pi]}1`;
    else if(n===1) id=`${PKEYS[pi]}1${co.s}`;
    else id=`${PKEYS[pi]}${n}${co.s}`;
    leaves.push({id,steps:[P0,P1,'Acceso Fijo','ODN','Aliado',cl.name,co.name,p],lv:'N7',gestor:NM});
  })));
  leaves.push({id:'calidad',steps:[P0,P1,'Acceso Fijo','ODN','Calidad / Interventoría','','',''],lv:'N4',gestor:NM});
  leaves.push({id:'oc',steps:[P0,P1,'Acceso Fijo','ODN','Obra Civil','','',''],lv:'N4',gestor:NM});
  leaves.push({id:'gpon',steps:[P0,P1,'Acceso Fijo','PUERTOS PON','Puerto GPON','','',''],lv:'N4',gestor:NM});
  leaves.push({id:'xgs',steps:[P0,P1,'Acceso Fijo','PUERTOS PON','Puerto XGSPON','','',''],lv:'N4',gestor:NM});
  leaves.push({id:'noc',steps:[P0,P1,'Acceso Fijo','Conf. NOC','','','',''],lv:'N3',gestor:NM});
  leaves.push({id:'reg',steps:[P0,P1,'Acceso Fijo','Registro de Red','','','',''],lv:'N3',gestor:NM});
  leaves.push({id:'licg',steps:[P0,P1,'O&M','Licencias Gestión','','','',''],lv:'N3',gestor:AC});
  leaves.push({id:'fac',steps:[P0,P1,'Transmisión','Facilities','','','',''],lv:'N3',gestor:LC});
  leaves.push({id:'fom',steps:[P0,P1,'Transmisión','FO Metro','','','',''],lv:'N3',gestor:NM});
  leaves.push({id:'fon',steps:[P0,P1,'Transmisión','FO Nacional','','','',''],lv:'N3',gestor:NM});
  leaves.push({id:'bng',steps:[P0,P1,'Transmisión','Transporte IP','Licencia BNG','','',''],lv:'N4',gestor:LC});
  leaves.push({id:'u100',steps:[P0,P1,'Transmisión','Transporte IP','UAN','Pto 100G capas sup.','',''],lv:'N5',gestor:LC});
  leaves.push({id:'u10',steps:[P0,P1,'Transmisión','Transporte IP','UAN','Pto 10G capas sup.','',''],lv:'N5',gestor:LC});
  leaves.push({id:'ip10',steps:[P0,P1,'Transmisión','Transporte IP','IP+ Fot','Pto 10G to OLT','',''],lv:'N5',gestor:LC});
  leaves.push({id:'ip100',steps:[P0,P1,'Transmisión','Transporte IP','IP+ Fot','Pto 100G capas sup.','',''],lv:'N5',gestor:LC});
  leaves.push({id:'cap1',steps:[P0,P1,'Transmisión','Transporte IP','Caching','Capacidades 100G','',''],lv:'N5',gestor:LC});
  leaves.push({id:'cap2',steps:[P0,P1,'Transmisión','Transporte IP','Peering','Capacidades 100G','',''],lv:'N5',gestor:LC});
  leaves.push({id:'ofn',steps:[P0,P1,'Transmisión','Transporte Óptico','FO Nacional','','',''],lv:'N4',gestor:LC});
  leaves.push({id:'p10',steps:[P0,P1,'Transmisión','Transporte Óptico','Puerto 10G','','',''],lv:'N4',gestor:LC});
  leaves.push({id:'p100',steps:[P0,P1,'Transmisión','Transporte Óptico','Puerto 100G','','',''],lv:'N4',gestor:LC});
  return leaves;
}

const ALL_LEAVES = buildAllLeaves();
const GESTORES = [NM, AC, LC];

// ── Helpers ──
const fmt = n => '$' + Number(n||0).toLocaleString('es-CO');
const fmtM = n => '$' + (Number(n||0)/1e6).toFixed(1) + 'M';
const fmtD = ts => { if(!ts) return '—'; const d=new Date(ts); return d.toLocaleDateString('es-CO',{day:'2-digit',month:'short'})+' '+d.toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'}); };

// ── Styles ──
const S = {
  red:'#C8281A',redH:'#A8200F',redL:'#FEF2F0',redB:'#F5C6C0',
  ink:'#0F0F0F',inkM:'#3D3D3D',inkS:'#6B6B6B',inkF:'#9E9E9E',inkG:'#C8C8C8',
  wh:'#FFFFFF',bg:'#F5F4F0',bgS:'#EFEDE8',bgC:'#FAFAF8',
  bd:'#DEDAD3',bdS:'#E8E5DE',
  gn:'#1A7A3C',gnBg:'#EDF7F1',gnB:'#B8E0C7',
  bl:'#1E4FC7',blBg:'#EEF3FC',
  am:'#B05C00',amBg:'#FDF5E8',
  pu:'#6A1B9A',puBg:'#F3E8FC',
  ff:"'DM Sans',system-ui,sans-serif",
  fm:"'DM Mono','JetBrains Mono',monospace",
};

// ── Breadcrumb ──
function Crumb({steps}) {
  const filtered = steps.filter(s => s);
  return (
    <div style={{display:'flex',alignItems:'center',gap:0,flexWrap:'wrap'}}>
      {filtered.map((s,i) => {
        const last = i === filtered.length - 1;
        return (
          <span key={i} style={{display:'inline-flex',alignItems:'center'}}>
            <span style={{
              fontSize: last ? 11 : 10, fontWeight: last ? 700 : 400,
              color: last ? S.red : S.inkS, padding: '1px 3px',
            }}>{s}</span>
            {!last && <span style={{color:S.inkG,fontSize:8,margin:'0 1px',fontFamily:S.fm}}>›</span>}
          </span>
        );
      })}
    </div>
  );
}

// ── Build leaf lookup for mapping fichas to steps ──
const LEAF_MAP = {};
ALL_LEAVES.forEach(l => { LEAF_MAP[l.id] = l; });

// ═══════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════
export default function AdminDVB() {
  const [view, setView] = useState('progreso');
  const [fichasData, setFichasData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterG, setFilterG] = useState('Todos');
  const [selFicha, setSelFicha] = useState(null);
  const [dbConnected, setDbConnected] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('fichas')
        .select('node_id, gestor, rows, updated_at');
      if (error) throw error;
      setFichasData(data || []);
      setDbConnected(true);
    } catch (e) {
      console.log('Error loading fichas:', e.message);
      setDbConnected(false);
      setFichasData([]);
    }
    setLoading(false);
  }

  // ── Transform fichas data into flat BOM rows ──
  const bomData = useMemo(() => {
    const rows = [];
    fichasData.forEach(f => {
      const leaf = LEAF_MAP[f.node_id];
      const steps = leaf ? leaf.steps : ['','','','','','','',''];
      (f.rows || []).forEach(r => {
        if (!r.codigoSAP) return;
        rows.push({
          ficha_id: f.node_id,
          gestor: f.gestor,
          steps,
          codigo_sap: r.codigoSAP,
          descripcion: r.descripcion || '',
          unidad: r.unidadMedida || r.unidad || '',
          categoria: r.categoria || '',
          cantidad: r.cantidad || 0,
          factor: r.factor || 0,
          valor_p: r.valorP || 0,
          created_at: f.updated_at,
        });
      });
    });
    return rows;
  }, [fichasData]);

  const filteredBom = filterG === 'Todos' ? bomData : bomData.filter(r => r.gestor === filterG);
  const filledFichaIds = [...new Set(filteredBom.map(r => r.ficha_id))];

  const byGestor = {};
  GESTORES.forEach(g => {
    const total = ALL_LEAVES.filter(l => l.gestor === g).length;
    const filled = [...new Set(fichasData.filter(r => r.gestor === g).map(r => r.node_id))].length;
    byGestor[g] = { total, filled, pct: total > 0 ? Math.round(filled / total * 100) : 0 };
  });

  const fichaGroups = {};
  filteredBom.forEach(r => {
    if (!fichaGroups[r.ficha_id]) fichaGroups[r.ficha_id] = { rows: [], ficha_id: r.ficha_id, gestor: r.gestor, steps: r.steps, lastUpdate: r.created_at };
    fichaGroups[r.ficha_id].rows.push(r);
    if (r.created_at > fichaGroups[r.ficha_id].lastUpdate) fichaGroups[r.ficha_id].lastUpdate = r.created_at;
  });
  const fichaList = Object.values(fichaGroups).sort((a, b) => new Date(b.lastUpdate) - new Date(a.lastUpdate));

  const grandTotal = filteredBom.reduce((s, r) => s + (Number(r.cantidad || 0) * Number(r.factor || 0) * Number(r.valor_p || 0)), 0);

  // ── Export CSV ──
  function exportCSV() {
    const headers = ['ficha_id','gestor','programa','proyecto','dominio','driver','sub_driver','cluster','nivel_constr','proveedor','codigo_sap','descripcion','unidad','categoria','cantidad','factor','valor_p','total','fecha'];
    const rows = filteredBom.map(r => {
      const t = Number(r.cantidad||0) * Number(r.factor||0) * Number(r.valor_p||0);
      return [r.ficha_id,r.gestor,...r.steps,r.codigo_sap,r.descripcion,r.unidad,r.categoria,r.cantidad,r.factor,r.valor_p,t,r.created_at||''];
    });
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `dvb_fichas_export_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  const tab = (v, label, icon) => (
    <div onClick={() => { setView(v); setSelFicha(null); }} style={{
      display:'flex',alignItems:'center',gap:7,padding:'0 16px',height:56,
      fontFamily:S.ff,fontSize:12,fontWeight:view===v?700:600,color:view===v?S.red:S.inkS,
      cursor:'pointer',borderBottom:`2px solid ${view===v?S.red:'transparent'}`,marginBottom:-3,
      transition:'all .15s',
    }}
    onMouseEnter={e=>{if(view!==v)e.currentTarget.style.color=S.ink;}}
    onMouseLeave={e=>{if(view!==v)e.currentTarget.style.color=S.inkS;}}>
      <span style={{fontSize:13,opacity:.8}}>{icon}</span>{label}
    </div>
  );

  return (
    <div style={{minHeight:'100vh',background:S.bg,fontFamily:S.ff,display:'flex',flexDirection:'column'}}>
      {/* NAV */}
      <div style={{height:56,background:S.wh,borderTop:`3px solid ${S.red}`,borderBottom:`1.5px solid ${S.bd}`,padding:'0 24px',display:'flex',alignItems:'center',flexShrink:0}}>
        <a href="/" style={{textDecoration:'none',display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:32,height:32,background:S.red,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'#fff',letterSpacing:'-.5px'}}>DVB</div>
          <span style={{fontFamily:S.ff,fontSize:14,fontWeight:800,color:S.ink}}>Fichas</span>
        </a>
        <span style={{fontSize:10,color:S.inkF,padding:'2px 8px',borderRadius:4,background:S.bgS,border:`1px solid ${S.bd}`,fontWeight:600,marginLeft:8}}>ADMIN</span>
        <div style={{width:1,height:20,background:S.bd,margin:'0 16px'}} />
        {tab('progreso','Progreso','◉')}
        {tab('fichas','Fichas','☰')}
        {tab('bom','BOM Consolidado','▤')}
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:8,height:8,borderRadius:'50%',background:dbConnected?S.gn:'#E8504A'}} />
          <span style={{fontSize:10,color:S.inkS}}>{dbConnected?'Supabase conectado':'Sin conexión'}</span>
          <div onClick={exportCSV} style={{padding:'6px 13px',borderRadius:6,background:'#16A34A',color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer',marginLeft:8}}>
            ↓ Exportar CSV
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div style={{padding:'12px 24px',display:'flex',alignItems:'center',gap:10,background:S.wh,borderBottom:`1px solid ${S.bdS}`}}>
        <span style={{fontSize:8,fontWeight:700,color:S.inkF,textTransform:'uppercase',letterSpacing:'.13em'}}>GESTOR</span>
        {['Todos',...GESTORES].map(g => (
          <div key={g} onClick={() => setFilterG(g)} style={{
            padding:'5px 14px',borderRadius:6,fontSize:11,fontWeight:filterG===g?700:600,cursor:'pointer',
            border:`1.5px solid ${filterG===g?S.red:S.bd}`,background:filterG===g?S.redL:S.wh,color:filterG===g?S.red:S.inkM,
            transition:'all .15s',
          }}>{g==='Todos'?'Todos':g.split(' ')[0]}</div>
        ))}
        <div style={{marginLeft:'auto',display:'flex',alignItems:'baseline',gap:6}}>
          <span style={{fontSize:8.5,color:S.inkF,textTransform:'uppercase',letterSpacing:'.13em',fontFamily:S.fm}}>CAPEX</span>
          <span style={{fontSize:22,fontWeight:900,color:S.red,letterSpacing:'-.06em',fontFamily:S.fm}}>{fmtM(grandTotal)}</span>
        </div>
      </div>

      <div style={{flex:1,overflowY:'auto',padding:'20px 24px 60px'}}>
        <div style={{maxWidth:1200,margin:'0 auto'}}>

        {loading && <div style={{textAlign:'center',padding:40,color:S.inkS}}>Cargando datos...</div>}

        {/* ═══ PROGRESO ═══ */}
        {view==='progreso' && !loading && (<>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:20}}>
            {GESTORES.map(g => {
              const d = byGestor[g];
              return (
                <div key={g} style={{background:S.wh,border:`1.5px solid ${S.bd}`,borderRadius:12,overflow:'hidden'}}>
                  <div style={{padding:'12px 18px',background:S.bgC,borderBottom:`1.5px solid ${S.bd}`,display:'flex',alignItems:'center',gap:10}}>
                    <div style={{width:32,height:32,borderRadius:'50%',background:S.ink,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,color:'#fff'}}>
                      {g.split(' ').map(w=>w[0]).join('')}
                    </div>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:S.ink}}>{g}</div>
                      <div style={{fontSize:10,color:S.inkS}}>{d.total} fichas asignadas</div>
                    </div>
                  </div>
                  <div style={{padding:'16px 18px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                      <span style={{fontFamily:S.fm,fontSize:24,fontWeight:900,color:d.pct===100?S.gn:S.red}}>{d.pct}%</span>
                      <span style={{fontSize:11,color:S.inkS,alignSelf:'flex-end'}}>{d.filled} / {d.total}</span>
                    </div>
                    <div style={{height:6,background:S.bgS,borderRadius:99,overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${d.pct}%`,background:d.pct===100?S.gn:`linear-gradient(90deg,${S.redL},${S.red})`,borderRadius:99,transition:'width .5s'}} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
            {[
              {l:'Fichas completadas',v:`${filledFichaIds.length}/${ALL_LEAVES.length}`,c:S.red},
              {l:'Líneas BOM',v:filteredBom.length,c:S.bl},
              {l:'Códigos SAP únicos',v:[...new Set(filteredBom.map(r=>r.codigo_sap))].length,c:S.am},
              {l:'Inversión total',v:fmtM(grandTotal),c:S.red},
            ].map((k,i) => (
              <div key={i} style={{background:S.wh,border:`1.5px solid ${S.bd}`,borderRadius:12,overflow:'hidden'}}>
                <div style={{padding:'10px 16px',background:S.bgC,borderBottom:`1.5px solid ${S.bd}`}}>
                  <div style={{fontSize:8,fontWeight:700,color:S.inkF,textTransform:'uppercase',letterSpacing:'.14em'}}>{k.l}</div>
                </div>
                <div style={{padding:'14px 16px'}}>
                  <div style={{fontSize:24,fontWeight:900,color:k.c,letterSpacing:'-.04em',fontFamily:S.fm}}>{k.v}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{background:S.wh,border:`1.5px solid ${S.bd}`,borderRadius:12,overflow:'hidden'}}>
            <div style={{padding:'12px 18px',background:S.bgC,borderBottom:`1.5px solid ${S.bd}`}}>
              <span style={{fontSize:9,fontWeight:700,color:S.inkF,textTransform:'uppercase',letterSpacing:'.12em'}}>ACTIVIDAD RECIENTE</span>
            </div>
            {fichaList.length === 0 ? (
              <div style={{padding:40,textAlign:'center',color:S.inkF,fontSize:12,fontStyle:'italic'}}>
                No hay fichas diligenciadas aún
              </div>
            ) : fichaList.slice(0,8).map(f => (
              <div key={f.ficha_id} onClick={()=>{setSelFicha(f);setView('fichas');}}
                style={{padding:'12px 18px',borderBottom:`1px solid ${S.bdS}`,cursor:'pointer',transition:'background .12s',display:'flex',alignItems:'center',gap:14}}
                onMouseEnter={e=>e.currentTarget.style.background=S.redL} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div style={{width:6,height:6,borderRadius:'50%',background:S.gn,flexShrink:0}} />
                <div style={{flex:1,minWidth:0}}>
                  <Crumb steps={f.steps} />
                  <div style={{fontSize:10,color:S.inkS,marginTop:3}}>{f.gestor} · {f.rows.length} líneas · {fmtD(f.lastUpdate)}</div>
                </div>
              </div>
            ))}
          </div>
        </>)}

        {/* ═══ FICHAS ═══ */}
        {view==='fichas' && !loading && (
          <div style={{display:'grid',gridTemplateColumns:selFicha?'1fr 1fr':'1fr',gap:14}}>
            <div style={{background:S.wh,border:`1.5px solid ${S.bd}`,borderRadius:12,overflow:'hidden'}}>
              <div style={{padding:'14px 18px',background:S.ink,color:S.wh,borderBottom:`3px solid ${S.red}`}}>
                <div style={{fontSize:13,fontWeight:800}}>Fichas Diligenciadas ({fichaList.length})</div>
              </div>
              <div style={{maxHeight:'70vh',overflowY:'auto'}}>
                {fichaList.map(f => {
                  const isSel = selFicha?.ficha_id === f.ficha_id;
                  return (
                    <div key={f.ficha_id} onClick={()=>setSelFicha(f)}
                      style={{padding:'14px 16px',borderBottom:`1px solid ${S.bdS}`,cursor:'pointer',
                        background:isSel?S.redL:'transparent',borderLeft:isSel?`3px solid ${S.red}`:'3px solid transparent'}}
                      onMouseEnter={e=>{if(!isSel)e.currentTarget.style.background=S.bgS;}} onMouseLeave={e=>{if(!isSel)e.currentTarget.style.background='transparent';}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                        <div style={{fontSize:12,fontWeight:700,color:S.ink}}>{f.steps.filter(s=>s).pop()}</div>
                      </div>
                      <Crumb steps={f.steps} />
                      <div style={{fontSize:9,color:S.inkF,marginTop:4}}>{f.gestor} · {f.rows.length} líneas · {fmtD(f.lastUpdate)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            {selFicha && (
              <div style={{background:S.wh,border:`1.5px solid ${S.bd}`,borderRadius:12,overflow:'hidden',alignSelf:'start',position:'sticky',top:20}}>
                <div style={{background:S.ink,color:S.wh,padding:'16px 20px',borderBottom:`3px solid ${S.red}`}}>
                  <div style={{fontSize:8,fontWeight:700,letterSpacing:'.18em',textTransform:'uppercase',opacity:.5}}>DETALLE</div>
                  <div style={{fontSize:16,fontWeight:800,marginTop:4}}>{selFicha.steps.filter(s=>s).pop()}</div>
                  <div style={{fontSize:10,opacity:.5,marginTop:4}}>{selFicha.gestor} · {fmtD(selFicha.lastUpdate)}</div>
                </div>
                <div style={{padding:'12px 16px',background:S.bgC,borderBottom:`1px solid ${S.bd}`}}>
                  <div style={{fontSize:8,fontWeight:700,color:S.inkF,textTransform:'uppercase',letterSpacing:'.12em',marginBottom:6}}>CAMINO</div>
                  <Crumb steps={selFicha.steps} />
                </div>
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                    <thead>
                      <tr>{['SAP','Descripción','Ud','Categoría','Cant','Factor'].map(h=>(
                        <th key={h} style={{background:S.bgS,padding:'9px 10px',textAlign:'left',fontSize:9,fontWeight:700,color:S.inkF,textTransform:'uppercase',letterSpacing:'.1em',borderBottom:`1.5px solid ${S.bd}`}}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {selFicha.rows.map((r,i) => (
                        <tr key={i} onMouseEnter={e=>e.currentTarget.querySelectorAll('td').forEach(td=>td.style.background=S.redL)} onMouseLeave={e=>e.currentTarget.querySelectorAll('td').forEach(td=>td.style.background='transparent')}>
                          <td style={{padding:'8px 10px',fontFamily:S.fm,fontWeight:700,color:S.red,fontSize:10}}>{r.codigo_sap}</td>
                          <td style={{padding:'8px 10px',color:S.inkM}}>{r.descripcion}</td>
                          <td style={{padding:'8px 10px',fontFamily:S.fm,fontSize:9,color:S.inkS}}>{r.unidad}</td>
                          <td style={{padding:'8px 10px',fontSize:10,color:S.inkS}}>{r.categoria}</td>
                          <td style={{padding:'8px 10px',textAlign:'right',fontFamily:S.fm,fontWeight:700}}>{Number(r.cantidad||0).toLocaleString()}</td>
                          <td style={{padding:'8px 10px',textAlign:'right',fontFamily:S.fm,color:S.inkM}}>{r.factor||'—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ BOM CONSOLIDADO ═══ */}
        {view==='bom' && !loading && (<>
          <div style={{background:S.wh,border:`1.5px solid ${S.bd}`,borderRadius:12,overflow:'hidden',marginBottom:16}}>
            <div style={{padding:'14px 20px',background:S.bgC,borderBottom:`1.5px solid ${S.bd}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:S.ink}}>BOM Consolidado</div>
                <div style={{fontSize:11,color:S.inkS,marginTop:2}}>{filteredBom.length} líneas de {fichaList.length} fichas</div>
              </div>
              <div onClick={exportCSV} style={{padding:'6px 14px',borderRadius:6,background:'#16A34A',color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer'}}>↓ CSV</div>
            </div>
            <div style={{overflowX:'auto',maxHeight:'60vh'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                <thead>
                  <tr style={{background:S.bgS,position:'sticky',top:0,zIndex:2}}>
                    {['SAP','Descripción','Ud','Categoría','Gestor','Ficha','Cant','Factor'].map(h=>(
                      <th key={h} style={{padding:'10px 12px',textAlign:'left',fontSize:9,fontWeight:700,color:S.inkF,textTransform:'uppercase',letterSpacing:'.1em',borderBottom:`1.5px solid ${S.bd}`,background:S.bgS}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredBom.map((r,i) => {
                    const leaf = r.steps.filter(s=>s).pop() || '';
                    return (
                      <tr key={i} onMouseEnter={e=>e.currentTarget.querySelectorAll('td').forEach(td=>td.style.background=S.redL)} onMouseLeave={e=>e.currentTarget.querySelectorAll('td').forEach(td=>td.style.background='transparent')}>
                        <td style={{padding:'8px 12px',fontFamily:S.fm,fontWeight:700,color:S.red,fontSize:10}}>{r.codigo_sap}</td>
                        <td style={{padding:'8px 12px',color:S.inkM,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.descripcion}</td>
                        <td style={{padding:'8px 12px',fontFamily:S.fm,fontSize:9,color:S.inkS}}>{r.unidad}</td>
                        <td style={{padding:'8px 12px',fontSize:10,color:S.inkS}}>{r.categoria}</td>
                        <td style={{padding:'8px 12px',fontSize:10,color:S.inkS}}>{r.gestor?.split(' ')[0]}</td>
                        <td style={{padding:'8px 12px',fontSize:10,color:S.inkM,fontWeight:600}}>{leaf}</td>
                        <td style={{padding:'8px 12px',textAlign:'right',fontFamily:S.fm,fontWeight:700}}>{Number(r.cantidad||0).toLocaleString()}</td>
                        <td style={{padding:'8px 12px',textAlign:'right',fontFamily:S.fm,color:S.inkM}}>{r.factor||'—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>)}

        </div>
      </div>
    </div>
  );
}
