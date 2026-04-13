"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import SAP_CATALOG from "@/lib/catalogo.json";

/* ───────────────────────────────────────────────────────────────
   DVB — Herramienta de Fichas · Prototipo v3
   Árbol 100% fiel al original (208 hojas en Aliado)
   ─────────────────────────────────────────────────────────────── */

// ── Generate Aliado subtree with exact original IDs ──
const PROVS = ['Huawei','ZTE','LPS','Comfica','Tabasco','Fiber Home','Inmel','Sicte','Telcos','Dominion','Conectar','Dico','Cinco'];
const PKEYS = ['hw','zte','lps','com','tab','fh','inm','sic','tel','dom','con','dic','cin'];
const CONS = [{s:'a',n:'Construcción 0%–30%'},{s:'b',n:'Construcción 31%–50%'},{s:'c',n:'Construcción 51%–70%'},{s:'d',n:'Construcción 71%–100%'}];
const NM='Nicolás Mendez', AC='Alberto Cantillo', LC='Liliana Chacón';

function mkProviders(clNum, conSuffix) {
  return PROVS.map((p,i) => {
    let id;
    if (clNum === 1 && conSuffix === 'a') id = `${PKEYS[i]}1`;
    else if (clNum === 1) id = `${PKEYS[i]}1${conSuffix}`;
    else id = `${PKEYS[i]}${clNum}${conSuffix}`;
    return { id, lv:7, name:p, gestor:NM };
  });
}

function mkConstructions(clNum) {
  return CONS.map(c => ({
    id: `c${clNum}${c.s}`, lv:6, name:c.n, gestor:NM,
    children: mkProviders(clNum, c.s),
  }));
}

const ALIADO_CHILDREN = [
  { id:'c1',lv:5,name:'Cluster 1–1000',gestor:NM, children:mkConstructions(1) },
  { id:'c2',lv:5,name:'Cluster 1001–2000',gestor:NM, children:mkConstructions(2) },
  { id:'c3',lv:5,name:'Cluster 2001–3000',gestor:NM, children:mkConstructions(3) },
  { id:'c4',lv:5,name:'Cluster >3000',gestor:NM, children:mkConstructions(4) },
];

// ── Full Tree ──
const TREE = {
  id:'root',lv:0,name:'Disminución del churn 0.5%',desc:'Planeación Estratégica',gestor:null,
  children:[
    {id:'bf',lv:1,name:'Brownfield',desc:'Protección EBITDA · 100k HHPP',gestor:null,
     children:[
      {id:'af',lv:2,name:'Acceso Fijo',gestor:NM,
       children:[
        {id:'lpe',lv:3,name:'Licencias P. Externa',desc:'(PEG)',gestor:NM},
        {id:'odn',lv:3,name:'ODN',desc:'(PEG)',gestor:NM,
         children:[
          {id:'aliado',lv:4,name:'Aliado',gestor:NM,children:ALIADO_CHILDREN},
          {id:'calidad',lv:4,name:'Calidad / Interventoría',gestor:NM},
          {id:'oc',lv:4,name:'Obra Civil',gestor:NM},
         ]},
        {id:'pon',lv:3,name:'PUERTOS PON',gestor:NM,
         children:[
          {id:'gpon',lv:4,name:'Puerto GPON',desc:'(PGI)',gestor:NM},
          {id:'xgs',lv:4,name:'Puerto XGSPON',desc:'(PXI)',gestor:NM},
         ]},
        {id:'noc',lv:3,name:'Conf. NOC',desc:'(PGI)',gestor:NM},
        {id:'reg',lv:3,name:'Registro de Red',desc:'(PEG)',gestor:NM},
       ]},
      {id:'om',lv:2,name:'O&M',gestor:AC,
       children:[
        {id:'licg',lv:3,name:'Licencias Gestión',desc:'(OSO)',gestor:AC},
       ]},
      {id:'tx',lv:2,name:'Transmisión',gestor:LC,
       children:[
        {id:'fac',lv:3,name:'Facilities',desc:'(ITX)',gestor:LC},
        {id:'fom',lv:3,name:'FO Metro',desc:'(FBM)',gestor:NM},
        {id:'fon',lv:3,name:'FO Nacional',desc:'(FRN)',gestor:NM},
        {id:'tip',lv:3,name:'Transporte IP',gestor:LC,
         children:[
          {id:'bng',lv:4,name:'Licencia BNG',desc:'(CIP)',gestor:LC},
          {id:'uan',lv:4,name:'UAN',desc:'(IPA)',gestor:LC,
           children:[
            {id:'u100',lv:5,name:'Pto 100G capas sup.',gestor:LC},
            {id:'u10',lv:5,name:'Pto 10G capas sup.',gestor:LC},
           ]},
          {id:'ipf',lv:4,name:'IP+ Fot',desc:'(CIP)',gestor:LC,
           children:[
            {id:'ip10',lv:5,name:'Pto 10G to OLT',gestor:LC},
            {id:'ip100',lv:5,name:'Pto 100G capas sup.',gestor:LC},
           ]},
          {id:'cache',lv:4,name:'Caching',gestor:LC,
           children:[{id:'cap1',lv:5,name:'Capacidades 100G',gestor:LC}]},
          {id:'peer',lv:4,name:'Peering',gestor:LC,
           children:[{id:'cap2',lv:5,name:'Capacidades 100G',gestor:LC}]},
         ]},
        {id:'topt',lv:3,name:'Transporte Óptico',gestor:LC,
         children:[
          {id:'ofn',lv:4,name:'FO Nacional',desc:'(FRN)',gestor:LC},
          {id:'p10',lv:4,name:'Puerto 10G',gestor:LC},
          {id:'p100',lv:4,name:'Puerto 100G',gestor:LC},
         ]},
       ]},
     ]},
    {id:'mig',lv:1,name:'Migración HFC → FTTx',desc:'Protección EBITDA · 30k clientes',gestor:null},
    {id:'des',lv:1,name:'Desmonte Red HFC',desc:'Crecimiento EBITDA',gestor:null},
  ]
};

const LEVEL_NAMES = ['PROGRAMA','PROYECTO','DOMINIO','DRIVER','SUB-DRIVER','CLUSTER','NIVEL CONSTR.','PROVEEDOR'];
const GESTORES = [NM,AC,LC];

// Categoría mapping from Excel tipos
const TIPO_TO_CAT = { 'Hardware': 'Hardware', 'Software / Licencia': 'Software', 'Mano de obra': 'Servicios' };
const CATEGORIAS = ['Hardware','Software','Servicios'];

// ── Helpers ──
function isLeaf(n){return !n?.children||n.children.length===0;}
function getLeaves(n,g){if(isLeaf(n)){if(!g||n.gestor===g)return[n];return[];}return(n.children||[]).flatMap(c=>getLeaves(c,g));}
function findNode(t,id){if(t.id===id)return t;if(t.children)for(const c of t.children){const f=findNode(c,id);if(f)return f;}return null;}
function getBreadcrumb(t,tid,p=[]){p.push(t);if(t.id===tid)return[...p];if(t.children)for(const c of t.children){const r=getBreadcrumb(c,tid,p);if(r)return r;}p.pop();return null;}
function hasGestorLeaves(n,g){if(isLeaf(n))return n.gestor===g;return(n.children||[]).some(c=>hasGestorLeaves(c,g));}

// ── Colors ──
const C={bg:'#F4F4F4',dk:'#1A1A1A',rd:'#DA291C',g1:'#3D3D3D',g2:'#5C5C5C',g3:'#767676',g4:'#999',g5:'#B0B0B0',bd:'#E0E0E0',wh:'#FFFFFF',gn:'#2E7D32'};
const LB=[C.dk,C.rd,C.g1,C.g2,C.g3,C.g4,C.gn,C.g5];
const LT=[C.wh,C.wh,C.wh,C.wh,C.wh,C.wh,C.wh,C.dk];

// ── Login ──
function Login({onLogin}){
  const[hov,setHov]=useState(null);
  return(
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:`linear-gradient(135deg,${C.dk} 0%,${C.g1} 100%)`,fontFamily:"'Barlow',sans-serif"}}>
      <div style={{background:C.wh,borderRadius:12,padding:'48px 40px',width:420,maxWidth:'92vw',boxShadow:'0 24px 80px rgba(0,0,0,.35)'}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:800,color:C.dk}}><span style={{color:C.rd}}>DVB</span> Fichas</div>
          <div style={{fontSize:12,color:C.g3,marginTop:6}}>Herramienta de diligenciamiento de fichas técnicas</div>
        </div>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:9,fontWeight:700,letterSpacing:'.15em',textTransform:'uppercase',color:C.rd,marginBottom:10}}>Selecciona tu perfil</div>
        {GESTORES.map((g,i)=>{
          const lc=getLeaves(TREE,g).length;const h=hov===i;
          return(
            <div key={g} onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)} onClick={()=>onLogin(g)}
              style={{padding:'14px 16px',marginBottom:8,borderRadius:6,border:`1.5px solid ${h?C.rd:C.bd}`,background:h?'#FFF5F4':C.wh,cursor:'pointer',transition:'all .2s',display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:36,height:36,borderRadius:'50%',flexShrink:0,background:LB[2+i],display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:14,color:C.wh}}>
                {g.split(' ').map(w=>w[0]).join('')}
              </div>
              <div style={{flex:1}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:14,color:C.dk}}>{g}</div>
                <div style={{fontSize:11,color:C.g3}}>{lc} fichas asignadas</div>
              </div>
              <div style={{fontSize:10,color:C.rd,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,opacity:h?1:.4}}>ENTRAR →</div>
            </div>
          );
        })}
        <div style={{marginTop:20,padding:'10px 14px',background:'#FAFAFA',borderRadius:6,fontSize:10,color:C.g4,textAlign:'center'}}>Los datos se guardan en la base de datos</div>
        <a href="/admin" style={{display:'block',marginTop:12,padding:'10px 14px',borderRadius:6,border:`1.5px solid ${C.bd}`,fontSize:11,color:C.g3,textAlign:'center',textDecoration:'none',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,cursor:'pointer',transition:'all .2s'}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=C.rd;e.currentTarget.style.color=C.rd;e.currentTarget.style.background='#FFF5F4';}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=C.bd;e.currentTarget.style.color=C.g3;e.currentTarget.style.background='transparent';}}>
          Panel Administrador →
        </a>
      </div>
    </div>
  );
}

// ── Tree Nav ──
function TreeNav({gestor,path,onSelect,fichas}){
  const cid=path[path.length-1];
  const cn=findNode(TREE,cid);
  const kids=(cn?.children||[]).filter(c=>hasGestorLeaves(c,gestor));

  return(
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      {/* Breadcrumb */}
      <div style={{padding:'14px 16px',borderBottom:`1px solid ${C.bd}`,flexShrink:0}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:8,fontWeight:700,letterSpacing:'.15em',textTransform:'uppercase',color:C.rd,marginBottom:8}}>Navegación</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:4,alignItems:'center'}}>
          {path.map((pid,i)=>{
            const n=findNode(TREE,pid);const last=i===path.length-1;
            return(
              <span key={pid+i} style={{display:'inline-flex',alignItems:'center',gap:4}}>
                <span onClick={()=>{if(!last)onSelect(path.slice(0,i+1));}}
                  style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,fontWeight:last?800:600,color:last?C.dk:C.rd,cursor:last?'default':'pointer'}}>
                  {n?.name||pid}
                </span>
                {!last&&<span style={{color:C.g5,fontSize:10}}>›</span>}
              </span>
            );
          })}
        </div>
      </div>

      {path.length>1&&(
        <div onClick={()=>onSelect(path.slice(0,-1))}
          style={{padding:'10px 16px',borderBottom:`1px solid ${C.bd}`,cursor:'pointer',display:'flex',alignItems:'center',gap:6,fontSize:11,color:C.g3,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:600}}
          onMouseEnter={e=>e.currentTarget.style.background='#FAFAFA'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
          <span style={{fontSize:14}}>←</span> Volver
        </div>
      )}

      <div style={{flex:1,overflowY:'auto',padding:'8px 0'}}>
        {kids.length===0&&isLeaf(cn)&&(
          <div style={{padding:'20px 16px',textAlign:'center',color:C.g4,fontSize:11}}>
            <div style={{fontSize:28,marginBottom:8,opacity:.3}}>📋</div>
            Nodo hoja seleccionado.<br/>Diligencia la ficha en el panel derecho.
          </div>
        )}
        {kids.map(child=>{
          const leaf=isLeaf(child);const lv=Math.min(child.lv,7);
          const lc=getLeaves(child,gestor).length;
          const fc=getLeaves(child,gestor).filter(l=>fichas[l.id]).length;
          const done=leaf&&fichas[child.id];
          return(
            <div key={child.id} onClick={()=>onSelect([...path,child.id])}
              style={{margin:'0 10px 6px',borderRadius:6,overflow:'hidden',border:`1.5px solid ${done?C.gn:C.bd}`,cursor:'pointer',transition:'all .2s'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=C.rd;e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,.08)';e.currentTarget.style.transform='translateY(-1px)';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=done?C.gn:C.bd;e.currentTarget.style.boxShadow='none';e.currentTarget.style.transform='none';}}>
              <div style={{display:'flex',alignItems:'center',background:LB[lv],color:LT[lv],minHeight:42}}>
                <div style={{width:34,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:13,opacity:.45}}>{child.lv}</div>
                <div style={{flex:1,padding:'6px 8px',borderLeft:'1px solid rgba(255,255,255,.15)',minWidth:0}}>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:11,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{child.name}</div>
                  {child.desc&&<div style={{fontSize:8,opacity:.5,marginTop:1}}>{child.desc}</div>}
                </div>
                <div style={{padding:'0 8px',fontSize:9,opacity:.6,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:600,textAlign:'right',lineHeight:1.4}}>
                  {leaf?(done?'✓':'📋'):(<span>{fc>0&&<span style={{color:'#90EE90'}}>{fc}/</span>}{lc}</span>)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── BOM row ──
const mkRow=()=>({id:Date.now()+Math.random(),categoria:'',codigoSAP:'',descripcion:'',unidadMedida:'',cantidad:'',factor:'',valorP:''});

// ── Ficha Form ──
function FichaForm({nodeId,gestor,fichaData,onSave}){
  const node=findNode(TREE,nodeId);
  const bc=getBreadcrumb(TREE,nodeId)||[];
  const[rows,setRows]=useState(fichaData?.rows||[mkRow(),mkRow(),mkRow()]);
  const[saved,setSaved]=useState(false);
  const[sapDD,setSapDD]=useState({ri:null,fl:[]});

  // Derive proyecto and driver from breadcrumb
  const proyecto = bc.length>1 ? bc[1].name : '';
  const driverTecnico = bc.length>2 ? bc[bc.length-1].name : node?.name || '';

  useEffect(()=>{setRows(fichaData?.rows||[mkRow(),mkRow(),mkRow()]);setSaved(false);},[nodeId]);

  const upd=(idx,f,v)=>{
    const n=[...rows];n[idx]={...n[idx],[f]:v};
    if(f==='codigoSAP'){
      const m=SAP_CATALOG.find(s=>s.codigoSAP===v);
      if(m){
        n[idx].descripcion=m.descripcionSAP;
        n[idx].unidadMedida=m.umbSAP;
        n[idx].categoria=TIPO_TO_CAT[m.tipo]||m.tipo;
        n[idx].factor=String(m.ratio);
        setSapDD({ri:null,fl:[]});
      } else {
        setSapDD({ri:idx,fl:SAP_CATALOG.filter(s=>
          s.codigoSAP.includes(v)||s.descripcionSAP.toLowerCase().includes(v.toLowerCase())
        ).slice(0,8)});
      }
    }
    setRows(n);setSaved(false);
  };

  const pickSAP=(idx,s)=>{
    const n=[...rows];
    n[idx]={...n[idx],
      codigoSAP:s.codigoSAP,
      descripcion:s.descripcionSAP,
      unidadMedida:s.umbSAP,
      categoria:TIPO_TO_CAT[s.tipo]||s.tipo,
      factor:String(s.ratio),
    };
    setRows(n);setSapDD({ri:null,fl:[]});setSaved(false);
  };

  const total=rows.reduce((s,r)=>{
    const q=parseFloat(r.cantidad)||0;
    const f=parseFloat(r.factor)||0;
    const p=parseFloat(r.valorP)||0;
    return s+(q*f*p);
  },0);

  if(!node)return null;

  const hStyle={padding:'6px 8px',fontFamily:"'Barlow Condensed',sans-serif",fontSize:8,fontWeight:700,letterSpacing:'.06em',textTransform:'uppercase',color:C.wh,background:C.g2};
  const cellBase={padding:'6px 8px',fontSize:10,fontFamily:"'Barlow',sans-serif",display:'flex',alignItems:'center'};
  const inputStyle={width:'100%',border:'none',background:'transparent',fontSize:10,fontFamily:"'Barlow',sans-serif",outline:'none',padding:'2px 0'};
  const gridCols='100px 110px 90px 90px 1fr 70px 70px 70px 80px 80px 30px';

  return(
    <div style={{height:'100%',display:'flex',flexDirection:'column',fontFamily:"'Barlow',sans-serif"}}>
      <div style={{background:C.dk,color:C.wh,padding:'14px 20px',borderBottom:`3px solid ${C.rd}`,flexShrink:0}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:8,fontWeight:700,letterSpacing:'.2em',textTransform:'uppercase',opacity:.5,marginBottom:4}}>FICHA DE DRIVER OPERATIVO</div>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:800}}>{node.name}</div>
        <div style={{fontSize:10,opacity:.5,marginTop:4,lineHeight:1.4}}>{bc.map(n=>n.name).join(' → ')}</div>
        <div style={{marginTop:8,display:'flex',gap:12,fontSize:10}}>
          <span style={{opacity:.5}}>Gestor:</span><span style={{fontWeight:600}}>{gestor}</span>
          <span style={{opacity:.3}}>|</span>
          <span style={{opacity:.5}}>Nivel:</span><span style={{fontWeight:600}}>N{node.lv} · {LEVEL_NAMES[node.lv]}</span>
        </div>
      </div>

      <div style={{flex:1,overflowY:'auto',overflowX:'auto',padding:'16px 16px 80px'}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:9,fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:C.rd,marginBottom:10}}>Bill of Materials (BOM)</div>

        <div style={{minWidth:950}}>
          {/* Header */}
          <div style={{display:'grid',gridTemplateColumns:gridCols,gap:1,background:C.g2,borderRadius:'6px 6px 0 0',overflow:'hidden'}}>
            <div style={hStyle}>Proyecto</div>
            <div style={hStyle}>Unid. Proy. Driver</div>
            <div style={hStyle}>Categoría</div>
            <div style={hStyle}>Código SAP</div>
            <div style={hStyle}>Descripción</div>
            <div style={hStyle}>Ud. Medida</div>
            <div style={hStyle}>Cantidad Q</div>
            <div style={hStyle}>Factor</div>
            <div style={hStyle}>Valor P</div>
            <div style={hStyle}>Total</div>
            <div style={hStyle}></div>
          </div>

          {/* Rows */}
          {rows.map((row,idx)=>{
            const q=parseFloat(row.cantidad)||0;
            const f=parseFloat(row.factor)||0;
            const p=parseFloat(row.valorP)||0;
            const rt=q*f*p;
            const bg=idx%2===0?'#FAFAFA':C.wh;
            const border={borderLeft:`1px solid ${C.bd}`,borderRight:`1px solid ${C.bd}`,borderBottom:`1px solid ${C.bd}`};
            return(
              <div key={row.id} style={{position:'relative'}}>
                <div style={{display:'grid',gridTemplateColumns:gridCols,gap:1,background:bg,...border}}>
                  {/* Proyecto - auto */}
                  <div style={{...cellBase,background:'#F0F0F0',color:C.g2,fontSize:9,fontWeight:600}}>{proyecto}</div>
                  {/* Driver Técnico - auto */}
                  <div style={{...cellBase,background:'#F0F0F0',color:C.g2,fontSize:9,fontWeight:600}}>{driverTecnico}</div>
                  {/* Categoría - dropdown */}
                  <div style={{...cellBase,padding:'2px 4px'}}>
                    <select value={row.categoria} onChange={e=>upd(idx,'categoria',e.target.value)}
                      style={{width:'100%',border:'none',background:'transparent',fontSize:10,fontFamily:"'Barlow',sans-serif",outline:'none',cursor:'pointer',color:row.categoria?C.dk:C.g5}}>
                      <option value="">—</option>
                      {CATEGORIAS.map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  {/* Código SAP - input with autocomplete */}
                  <div style={{...cellBase,padding:'2px 6px',position:'relative'}}>
                    <input value={row.codigoSAP} onChange={e=>upd(idx,'codigoSAP',e.target.value)}
                      onFocus={()=>{if(!row.codigoSAP)setSapDD({ri:idx,fl:SAP_CATALOG.slice(0,8)});}}
                      onBlur={()=>setTimeout(()=>setSapDD({ri:null,fl:[]}),200)}
                      placeholder="Buscar..." style={inputStyle}/>
                    {sapDD.ri===idx&&sapDD.fl.length>0&&(
                      <div style={{position:'absolute',top:'100%',left:0,width:450,zIndex:100,background:C.wh,border:`1.5px solid ${C.rd}`,borderRadius:6,boxShadow:'0 8px 32px rgba(0,0,0,.15)',maxHeight:220,overflowY:'auto'}}>
                        {sapDD.fl.map(s=>(
                          <div key={s.codigoSAP+s.item} onMouseDown={()=>pickSAP(idx,s)}
                            style={{padding:'6px 10px',cursor:'pointer',borderBottom:`1px solid ${C.bd}`,fontSize:10,display:'flex',gap:6,alignItems:'center'}}
                            onMouseEnter={e=>e.currentTarget.style.background='#FFF5F4'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                            <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,color:C.rd,flexShrink:0,width:55}}>{s.codigoSAP}</span>
                            <span style={{color:C.g1,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.descripcionSAP}</span>
                            <span style={{color:C.g4,fontSize:8,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:600,flexShrink:0}}>{TIPO_TO_CAT[s.tipo]||s.tipo}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Descripción - auto */}
                  <div style={{...cellBase,background:'#F0F0F0',color:row.descripcion?C.g1:C.g5,fontSize:9,fontStyle:row.descripcion?'normal':'italic',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}
                    title={row.descripcion}>{row.descripcion||'Auto con SAP'}</div>
                  {/* Unidad de Medida - auto */}
                  <div style={{...cellBase,background:'#F0F0F0',color:row.unidadMedida?C.g1:C.g5,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:600,justifyContent:'center',fontSize:9}}>{row.unidadMedida||'—'}</div>
                  {/* Cantidad Q - placeholder only */}
                  <div style={{...cellBase,background:'#F0F0F0',color:C.g5,fontSize:9,fontStyle:'italic',justifyContent:'center'}}>—</div>
                  {/* Factor - input with reference */}
                  <div style={{...cellBase,padding:'2px 6px',background:row.factor?'#FFF8E1':'transparent'}}>
                    <input type="number" min="0" step="any" value={row.factor} onChange={e=>upd(idx,'factor',e.target.value)}
                      placeholder="—" style={{...inputStyle,textAlign:'right',color:C.g1}}/>
                  </div>
                  {/* Valor P - placeholder only */}
                  <div style={{...cellBase,background:'#F0F0F0',color:C.g5,fontSize:9,fontStyle:'italic',justifyContent:'center'}}>—</div>
                  {/* Total - calculated */}
                  <div style={{...cellBase,background:'#F0F0F0',fontWeight:700,fontFamily:"'Barlow Condensed',sans-serif",justifyContent:'flex-end',fontSize:10,color:rt>0?C.dk:C.g5}}>
                    {rt>0?`$${rt.toLocaleString()}`:'—'}
                  </div>
                  {/* Delete */}
                  <div onClick={()=>{if(rows.length>1){setRows(rows.filter((_,i)=>i!==idx));setSaved(false);}}}
                    style={{...cellBase,justifyContent:'center',cursor:rows.length>1?'pointer':'default',color:rows.length>1?C.g5:'transparent',fontSize:13}}
                    onMouseEnter={e=>{if(rows.length>1)e.currentTarget.style.color=C.rd;}} onMouseLeave={e=>e.currentTarget.style.color=C.g5}>×</div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8,gap:12}}>
          <div onClick={()=>{setRows([...rows,mkRow()]);setSaved(false);}}
            style={{padding:'8px 16px',borderRadius:6,border:`1.5px dashed ${C.bd}`,fontSize:11,color:C.g3,cursor:'pointer',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:600}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.rd;e.currentTarget.style.color=C.rd;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.bd;e.currentTarget.style.color=C.g3;}}>
            + Agregar fila
          </div>
          <div style={{padding:'10px 20px',background:C.dk,borderRadius:6,fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,fontWeight:800,color:C.wh,display:'flex',gap:12,alignItems:'center'}}>
            <span style={{fontSize:9,opacity:.5,letterSpacing:'.1em',textTransform:'uppercase'}}>TOTAL</span>
            <span>${total.toLocaleString()}</span>
          </div>
        </div>

        <div style={{marginTop:16,padding:'12px 16px',background:'#FAFAFA',borderRadius:6,border:`1px solid ${C.bd}`}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:8,fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:C.g4,marginBottom:6}}>Categorías en este BOM</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {CATEGORIAS.map(cat=>{
              const cnt=rows.filter(r=>r.categoria===cat).length;
              return <div key={cat} style={{padding:'4px 10px',borderRadius:20,fontSize:10,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:600,background:cnt>0?C.rd:C.bd,color:cnt>0?C.wh:C.g4}}>{cat} ({cnt})</div>;
            })}
          </div>
        </div>
      </div>

      <div style={{position:'sticky',bottom:0,padding:'12px 16px',background:C.wh,borderTop:`2px solid ${C.bd}`,display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
        <div style={{fontSize:10,color:C.g4}}>{rows.filter(r=>r.codigoSAP).length} de {rows.length} filas diligenciadas</div>
        <div onClick={()=>{onSave(nodeId,{rows,timestamp:new Date().toISOString()});setSaved(true);setTimeout(()=>setSaved(false),2500);}}
          style={{padding:'10px 28px',borderRadius:6,background:saved?C.gn:C.rd,color:C.wh,cursor:'pointer',fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,fontWeight:700,letterSpacing:'.05em',transition:'all .25s',boxShadow:saved?'0 4px 16px rgba(46,125,50,.3)':'0 4px 16px rgba(218,41,28,.3)'}}>
          {saved?'✓ Guardado':'Guardar ficha'}
        </div>
      </div>
    </div>
  );
}

// ── Main ──
export default function DVBFichas(){
  const[gestor,setGestor]=useState(null);
  const[path,setPath]=useState(['root']);
  const[fichas,setFichas]=useState({});
  const[loading,setLoading]=useState(false);

  // Load all fichas for this gestor from Supabase
  const loadFichas = useCallback(async (g) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('fichas')
      .select('node_id, rows')
      .eq('gestor', g);
    if (!error && data) {
      const map = {};
      data.forEach(d => { map[d.node_id] = { rows: d.rows }; });
      setFichas(map);
    }
    setLoading(false);
  }, []);

  // Save a ficha to Supabase (upsert)
  const saveFicha = useCallback(async (nodeId, fichaData) => {
    setFichas(p => ({ ...p, [nodeId]: fichaData }));
    const { error } = await supabase
      .from('fichas')
      .upsert({
        node_id: nodeId,
        gestor: gestor,
        rows: fichaData.rows,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'node_id,gestor' });
    if (error) console.error('Supabase save error:', error);
    else console.log('Ficha saved OK:', nodeId);
  }, [gestor]);

  const handleLogin = (g) => {
    setGestor(g);
    setPath(['root']);
    loadFichas(g);
  };

  const cid=path[path.length-1];
  const cn=findNode(TREE,cid);
  const showForm=cn&&isLeaf(cn)&&cn.gestor===gestor;
  const totalF=gestor?getLeaves(TREE,gestor).length:0;
  const filledF=gestor?getLeaves(TREE,gestor).filter(l=>fichas[l.id]).length:0;

  if(!gestor) return <Login onLogin={handleLogin}/>;

  return(
    <div style={{minHeight:'100vh',background:C.bg,fontFamily:"'Barlow',sans-serif",display:'flex',flexDirection:'column'}}>
      <div style={{background:C.dk,color:C.wh,padding:'10px 20px',borderBottom:`3px solid ${C.rd}`,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:800}}><span style={{color:C.rd}}>DVB</span> Fichas</div>
          <div style={{width:1,height:20,background:'rgba(255,255,255,.15)'}}/>
          <div style={{fontSize:11,opacity:.6}}>{gestor}</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <div style={{padding:'4px 12px',borderRadius:20,fontSize:10,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,background:filledF===totalF&&totalF>0?C.gn:'rgba(255,255,255,.1)',color:C.wh}}>
            {filledF}/{totalF} fichas
          </div>
          <div onClick={()=>{setGestor(null);setPath(['root']);}}
            style={{fontSize:10,color:'rgba(255,255,255,.4)',cursor:'pointer',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:600}}
            onMouseEnter={e=>e.currentTarget.style.color=C.rd} onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,.4)'}>
            Salir
          </div>
        </div>
      </div>

      <div style={{flex:1,display:'flex',minHeight:0}}>
        <div style={{width:340,flexShrink:0,background:C.wh,borderRight:`1.5px solid ${C.bd}`,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <TreeNav gestor={gestor} path={path} onSelect={setPath} fichas={fichas}/>
        </div>
        <div style={{flex:1,minWidth:0,overflow:'hidden',display:'flex',flexDirection:'column'}}>
          {showForm?(
            <FichaForm nodeId={cid} gestor={gestor} fichaData={fichas[cid]} onSave={saveFicha}/>
          ):(
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12,color:C.g4}}>
              <div style={{fontSize:48,opacity:.15}}>📋</div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:700,color:C.g3}}>Navega el árbol para seleccionar una ficha</div>
              <div style={{fontSize:11,color:C.g5,maxWidth:300,textAlign:'center',lineHeight:1.6}}>Desciende por la estructura hasta un nodo hoja. Allí se habilitará el formulario BOM.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
