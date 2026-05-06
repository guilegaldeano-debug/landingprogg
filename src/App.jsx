import { useState, useEffect } from "react";

const TABS = ["Dashboard", "Vendas", "Prospectar"];
const MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

const SEGMENTS = [
  "Restaurante","Lanchonete","Pizzaria","Barbearia","Salão de beleza",
  "Pet shop","Clínica","Dentista","Advogado","Contabilidade",
  "Escola","Academia","Mecânica","Loja de roupas","Farmácia",
  "Padaria","Hotel","Pousada","Imobiliária","Arquiteto"
];

const CITIES = [
  "São Paulo","Rio de Janeiro","Belo Horizonte","Curitiba","Porto Alegre",
  "Salvador","Fortaleza","Recife","Manaus","Belém",
  "Goiânia","Florianópolis","Campinas","Santos","São Bernardo do Campo",
  "Niterói","Duque de Caxias","Nova Iguaçu","Petrópolis","Volta Redonda"
];

const C = {
  blue:"#3b82f6", blueDark:"#1d4ed8", blueLight:"#93c5fd",
  red:"#ef4444", redDark:"#b91c1c", redLight:"#fca5a5",
  bg:"#080b14", surface:"#0d1120", border:"#151d30", border2:"#1e2a45",
  text:"#e2e8f0", muted:"#64748b", dim:"#1e293b",
};

const STATUS_COLORS = {
  novo: C.blue, contatado:"#f59e0b", negociando:"#a78bfa",
  fechado:"#10b981", perdido:C.red,
};
const STATUS_LABELS = {
  novo:"Novo", contatado:"Contatado", negociando:"Negociando",
  fechado:"Fechado", perdido:"Perdido",
};

function formatCurrency(v) {
  return v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
}

function Login({ onLogin }) {
  const [pwd, setPwd] = useState("");
  const [erro, setErro] = useState(false);
  const [show, setShow] = useState(false);

  function tentar() {
    fetch("/api/places", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-app-password": pwd },
      body: JSON.stringify({ segment: "ping", city: "ping" }),
    }).then(r => {
      if (r.status === 401) { setErro(true); setPwd(""); }
      else { sessionStorage.setItem("lp_pwd", pwd); onLogin(pwd); }
    }).catch(() => {
      sessionStorage.setItem("lp_pwd", pwd);
      onLogin(pwd);
    });
  }

  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Mono',monospace"}}>
      <div style={{background:C.surface,border:`1px solid ${C.border2}`,borderRadius:14,padding:"40px 36px",width:320,textAlign:"center"}}>
        <div style={{width:48,height:48,borderRadius:12,background:`linear-gradient(135deg,${C.blueDark},${C.red})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:900,color:"#fff",margin:"0 auto 20px"}}>LP</div>
        <div style={{fontSize:16,fontWeight:700,color:"#fff",marginBottom:4}}>LandingPro</div>
        <div style={{fontSize:11,color:C.muted,letterSpacing:2,marginBottom:28}}>ACESSO RESTRITO</div>
        <div style={{position:"relative",marginBottom:12}}>
          <input
            type={show?"text":"password"}
            placeholder="Sua senha"
            value={pwd}
            onChange={e=>{setPwd(e.target.value);setErro(false);}}
            onKeyDown={e=>e.key==="Enter"&&tentar()}
            style={{...inp,textAlign:"center",borderColor:erro?C.red:C.border2}}
          />
          <button onClick={()=>setShow(s=>!s)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:14}}>
            {show?"🙈":"👁️"}
          </button>
        </div>
        {erro&&<div style={{fontSize:11,color:C.red,marginBottom:10}}>Senha incorreta</div>}
        <button onClick={tentar} style={{...btnStyle,width:"100%",padding:"11px"}}>Entrar</button>
        <div style={{fontSize:10,color:C.dim,marginTop:16}}>Apenas você tem acesso</div>
      </div>
    </div>
  );
}

function LineChart({ data, color }) {
  const [hover, setHover] = useState(null);
  const W=600, H=160;
  const pad={top:20,bottom:32,left:56,right:16};
  const iW=W-pad.left-pad.right, iH=H-pad.top-pad.bottom;
  const maxV=Math.max(...data.map(d=>d.total),1);

  if (data.length < 2) return (
    <div style={{height:H,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontSize:12}}>
      Registre vendas em mais de um mês para ver o gráfico
    </div>
  );

  const pts=data.map((d,i)=>({
    x: pad.left+(i/(data.length-1))*iW,
    y: pad.top+iH-(d.total/maxV)*iH,
    ...d
  }));
  const pathD=pts.map((p,i)=>`${i===0?"M":"L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const areaD=`${pathD} L ${pts[pts.length-1].x.toFixed(1)} ${(pad.top+iH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(pad.top+iH).toFixed(1)} Z`;
  const yTicks=[0,.25,.5,.75,1].map(f=>({y:pad.top+iH-f*iH,v:Math.round(f*maxV)}));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:H,display:"block"}}>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.02"/>
        </linearGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      {yTicks.map((t,i)=>(
        <g key={i}>
          <line x1={pad.left} y1={t.y} x2={W-pad.right} y2={t.y} stroke={C.border2} strokeWidth="1" strokeDasharray="3 4"/>
          <text x={pad.left-8} y={t.y+4} textAnchor="end" fill={C.muted} fontSize="10" fontFamily="monospace">
            {t.v>=1000?`${(t.v/1000).toFixed(0)}k`:t.v}
          </text>
        </g>
      ))}
      <path d={areaD} fill="url(#lg)"/>
      <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" filter="url(#glow)"/>
      {pts.map((p,i)=>(
        <g key={i}>
          <rect x={p.x-22} y={pad.top} width={44} height={iH} fill="transparent" style={{cursor:"pointer"}} onMouseEnter={()=>setHover(i)} onMouseLeave={()=>setHover(null)}/>
          {hover===i&&<line x1={p.x} y1={pad.top} x2={p.x} y2={pad.top+iH} stroke={color} strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.5"/>}
          <circle cx={p.x} cy={p.y} r={hover===i?6:3.5} fill={p.total>0?color:C.dim} stroke={C.bg} strokeWidth="2" style={{transition:"r 0.15s"}}/>
          <text x={p.x} y={H-4} textAnchor="middle" fill={hover===i?"#fff":C.muted} fontSize="10" fontFamily="monospace">{p.label}</text>
          {hover===i&&p.total>0&&(
            <g>
              <rect x={p.x-50} y={p.y-34} width={100} height={24} rx={5} fill={C.surface} stroke={color} strokeWidth="1" strokeOpacity="0.7"/>
              <text x={p.x} y={p.y-18} textAnchor="middle" fill="#fff" fontSize="11" fontFamily="monospace" fontWeight="700">{formatCurrency(p.total)}</text>
            </g>
          )}
        </g>
      ))}
    </svg>
  );
}

function BarChart({ data }) {
  const now=new Date();
  const maxV=Math.max(...data.map(d=>d.total),1);
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:10,height:120}}>
      {data.map((d,i)=>{
        const isNow=d.m===now.getMonth()&&d.y===now.getFullYear();
        const h=d.total>0?Math.max(8,(d.total/maxV)*100):4;
        return (
          <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
            <div style={{fontSize:9,color:d.total>0?C.blueLight:"transparent",fontWeight:700}}>
              {d.total>0?`${(d.total/1000).toFixed(1)}k`:"x"}
            </div>
            <div style={{width:"100%",height:h,background:isNow?`linear-gradient(180deg,${C.blue},${C.blueDark})`:`linear-gradient(180deg,${C.border2},${C.dim})`,borderRadius:"4px 4px 0 0",transition:"height 0.5s",boxShadow:isNow?`0 0 10px ${C.blue}55`:"none"}}/>
            <div style={{fontSize:10,color:isNow?C.blueLight:C.muted}}>{d.label}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(!!sessionStorage.getItem("lp_pwd"));
  const [pwd, setPwd] = useState(sessionStorage.getItem("lp_pwd")||"");
  const [tab, setTab] = useState("Dashboard");
  const [sales, setSales] = useState(()=>{try{return JSON.parse(localStorage.getItem("lp_sales")||"[]")}catch{return[]}});
  const [prospects, setProspects] = useState(()=>{try{return JSON.parse(localStorage.getItem("lp_prospects")||"[]")}catch{return[]}});
  const [saleForm, setSaleForm] = useState({client:"",value:"",month:new Date().getMonth(),year:new Date().getFullYear(),desc:""});
  const [searchSeg, setSearchSeg] = useState(SEGMENTS[0]);
  const [searchCity, setSearchCity] = useState("Rio de Janeiro");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState(null);

  useEffect(()=>{try{localStorage.setItem("lp_sales",JSON.stringify(sales))}catch{}},[sales]);
  useEffect(()=>{try{localStorage.setItem("lp_prospects",JSON.stringify(prospects))}catch{}},[prospects]);

  if (!authed) return <Login onLogin={p=>{setPwd(p);setAuthed(true);}}/>;

  const now=new Date();
  const thisMonth=sales.filter(s=>s.month===now.getMonth()&&s.year===now.getFullYear());
  const thisMonthTotal=thisMonth.reduce((a,s)=>a+Number(s.value),0);
  const lastMonth=sales.filter(s=>{
    const lm=now.getMonth()===0?11:now.getMonth()-1;
    const ly=now.getMonth()===0?now.getFullYear()-1:now.getFullYear();
    return s.month===lm&&s.year===ly;
  });
  const lastMonthTotal=lastMonth.reduce((a,s)=>a+Number(s.value),0);
  const delta=lastMonthTotal>0?Math.round(((thisMonthTotal-lastMonthTotal)/lastMonthTotal)*100):null;
  const totalProspects=prospects.length;
  const closedProspects=prospects.filter(p=>p.status==="fechado").length;

  const mkData=(n)=>Array.from({length:n},(_,i)=>{
    const d=new Date(now.getFullYear(),now.getMonth()-n+1+i,1);
    const m=d.getMonth(),y=d.getFullYear();
    const total=sales.filter(s=>s.month===m&&s.year===y).reduce((a,s)=>a+Number(s.value),0);
    return{label:MONTHS[m],total,m,y};
  });

  function addSale(){
    if(!saleForm.client||!saleForm.value)return;
    setSales(prev=>[...prev,{...saleForm,id:Date.now(),value:Number(saleForm.value)}]);
    setSaleForm({client:"",value:"",month:new Date().getMonth(),year:new Date().getFullYear(),desc:""});
  }
  function removeSale(id){setSales(p=>p.filter(s=>s.id!==id));}

  async function doSearch(){
    setSearching(true);
    setSearchError(null);
    setSearchResults([]);
    try{
      const res=await fetch("/api/places",{
        method:"POST",
        headers:{"Content-Type":"application/json","x-app-password":pwd},
        body:JSON.stringify({segment:searchSeg,city:searchCity}),
      });
      if(res.status===401){setSearchError("Senha inválida. Recarregue a página.");setSearching(false);return;}
      const data=await res.json();
      if(data.error){setSearchError(data.error);setSearching(false);return;}
      setSearchResults(data.results||[]);
      if((data.results||[]).length===0) setSearchError("Nenhum resultado encontrado para essa busca.");
    }catch(e){
      setSearchError("Erro de conexão. Verifique se o app está no Netlify.");
    }
    setSearching(false);
  }

  function addProspect(p){
    if(prospects.find(x=>x.id===p.id))return;
    setProspects(prev=>[...prev,{...p,addedAt:new Date().toISOString()}]);
  }
  function updateProspectStatus(id,status){setProspects(p=>p.map(x=>x.id===id?{...x,status}:x));}
  function removeProspect(id){setProspects(p=>p.filter(x=>x.id!==id));}

  return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'DM Mono','Courier New',monospace"}}>
      <div style={{borderBottom:`1px solid ${C.border}`,padding:"16px 28px",display:"flex",alignItems:"center",gap:14,background:C.surface}}>
        <div style={{width:34,height:34,borderRadius:8,background:`linear-gradient(135deg,${C.blueDark},${C.red})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:"#fff"}}>LP</div>
        <div>
          <div style={{fontWeight:700,fontSize:14,color:"#fff",letterSpacing:1}}>LandingPro</div>
          <div style={{fontSize:10,color:C.muted,letterSpacing:2}}>SEU CRM DE LANDING PAGES</div>
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:6,flexWrap:"wrap"}}>
          {TABS.map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:"6px 16px",borderRadius:6,fontFamily:"inherit",fontSize:11,cursor:"pointer",letterSpacing:1,fontWeight:tab===t?700:400,border:tab===t?`1px solid ${C.blue}`:`1px solid ${C.border}`,background:tab===t?`${C.blue}22`:"transparent",color:tab===t?C.blueLight:C.muted,transition:"all 0.2s"}}>{t.toUpperCase()}</button>
          ))}
          <button onClick={()=>{sessionStorage.clear();setAuthed(false);}} style={{padding:"6px 12px",borderRadius:6,fontFamily:"inherit",fontSize:11,cursor:"pointer",border:`1px solid ${C.red}44`,background:"transparent",color:C.red}}>Sair</button>
        </div>
      </div>

      <div style={{padding:"28px",maxWidth:980,margin:"0 auto"}}>

        {tab==="Dashboard"&&(
          <div>
            <div style={{fontSize:10,color:C.muted,letterSpacing:3,marginBottom:20}}>VISÃO GERAL</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
              {[
                {label:"Este mês",value:formatCurrency(thisMonthTotal),sub:`${thisMonth.length} venda${thisMonth.length!==1?"s":""}`,color:C.blue,icon:"💰"},
                {label:"Mês passado",value:formatCurrency(lastMonthTotal),sub:delta!==null?`${delta>=0?"+":""}${delta}% vs anterior`:"—",color:C.red,icon:"📅"},
                {label:"Prospects",value:totalProspects,sub:`${closedProspects} fechados`,color:"#a78bfa",icon:"🎯"},
                {label:"Conversão",value:totalProspects>0?`${Math.round(closedProspects/totalProspects*100)}%`:"—",sub:"do pipeline",color:"#10b981",icon:"📈"},
              ].map(card=>(
                <div key={card.label} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"16px 18px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:card.color}}/>
                  <div style={{fontSize:18,marginBottom:8}}>{card.icon}</div>
                  <div style={{fontSize:10,color:C.muted,letterSpacing:2,marginBottom:6}}>{card.label.toUpperCase()}</div>
                  <div style={{fontSize:20,fontWeight:800,color:"#fff",letterSpacing:-1}}>{card.value}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:4}}>{card.sub}</div>
                </div>
              ))}
            </div>
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"20px 22px 14px",marginBottom:14}}>
              <div style={{fontSize:10,color:C.muted,letterSpacing:2,marginBottom:16}}>RECEITA — ÚLTIMOS 6 MESES</div>
              <BarChart data={mkData(3)}/>
            </div>
            {prospects.length>0&&(
              <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"18px 22px"}}>
                <div style={{fontSize:10,color:C.muted,letterSpacing:2,marginBottom:14}}>PIPELINE DE PROSPECTS</div>
                <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                  {Object.entries(STATUS_LABELS).map(([key,label])=>{
                    const count=prospects.filter(p=>p.status===key).length;
                    return(
                      <div key={key} style={{display:"flex",alignItems:"center",gap:8,background:C.dim,borderRadius:6,padding:"7px 14px",border:`1px solid ${STATUS_COLORS[key]}33`}}>
                        <div style={{width:7,height:7,borderRadius:"50%",background:STATUS_COLORS[key]}}/>
                        <span style={{fontSize:11,color:"#aaa"}}>{label}</span>
                        <span style={{fontSize:13,fontWeight:700,color:"#fff"}}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {tab==="Vendas"&&(
          <div>
            <div style={{fontSize:10,color:C.muted,letterSpacing:3,marginBottom:20}}>REGISTRAR VENDAS</div>
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:20,marginBottom:16}}>
              <div style={{fontSize:10,color:C.muted,letterSpacing:2,marginBottom:14}}>NOVA VENDA</div>
              <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:10,marginBottom:10}}>
                <input placeholder="Nome do cliente" value={saleForm.client} onChange={e=>setSaleForm(p=>({...p,client:e.target.value}))} style={inp}/>
                <input placeholder="Valor (R$)" type="number" value={saleForm.value} onChange={e=>setSaleForm(p=>({...p,value:e.target.value}))} style={inp}/>
                <select value={saleForm.month} onChange={e=>setSaleForm(p=>({...p,month:Number(e.target.value)}))} style={inp}>
                  {MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}
                </select>
                <select value={saleForm.year} onChange={e=>setSaleForm(p=>({...p,year:Number(e.target.value)}))} style={inp}>
                  {[2024,2025,2026].map(y=><option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div style={{display:"flex",gap:10}}>
                <input placeholder="Descrição (opcional)" value={saleForm.desc} onChange={e=>setSaleForm(p=>({...p,desc:e.target.value}))} style={{...inp,flex:1}}/>
                <button onClick={addSale} style={btnStyle}>+ Registrar</button>
              </div>
            </div>

            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"20px 22px 12px",marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <div style={{fontSize:10,color:C.muted,letterSpacing:2}}>EVOLUÇÃO — 12 MESES</div>
                <div style={{fontSize:11,color:C.blueLight,fontWeight:700}}>Total: {formatCurrency(mkData(12).reduce((a,d)=>a+d.total,0))}</div>
              </div>
              {sales.length===0?(
                <div style={{height:160,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontSize:12}}>Registre vendas para ver o gráfico</div>
              ):(
                <LineChart data={mkData(12)} color={C.blue}/>
              )}
            </div>

            {sales.length>0&&(
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
                {[
                  {label:"Total acumulado",value:formatCurrency(sales.reduce((a,s)=>a+Number(s.value),0)),color:C.blue},
                  {label:"Ticket médio",value:formatCurrency(sales.reduce((a,s)=>a+Number(s.value),0)/sales.length),color:"#a78bfa"},
                  {label:"Nº de vendas",value:sales.length,color:C.red},
                ].map(item=>(
                  <div key={item.label} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"12px 16px",borderTop:`2px solid ${item.color}`}}>
                    <div style={{fontSize:10,color:C.muted,letterSpacing:1,marginBottom:4}}>{item.label.toUpperCase()}</div>
                    <div style={{fontSize:17,fontWeight:800,color:"#fff"}}>{item.value}</div>
                  </div>
                ))}
              </div>
            )}

            {sales.length===0?(
              <div style={{textAlign:"center",padding:50,color:C.muted,fontSize:12}}>Nenhuma venda registrada ainda.</div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {[...sales].reverse().map(s=>(
                  <div key={s.id} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"12px 16px",display:"flex",alignItems:"center",gap:14}}>
                    <div style={{width:38,height:38,borderRadius:8,background:`${C.blue}15`,border:`1px solid ${C.blue}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:C.blueLight,fontWeight:700}}>{MONTHS[s.month]}</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,color:"#fff",fontSize:13}}>{s.client}</div>
                      {s.desc&&<div style={{fontSize:11,color:C.muted,marginTop:2}}>{s.desc}</div>}
                    </div>
                    <div style={{fontWeight:800,fontSize:15,color:"#4ade80"}}>{formatCurrency(s.value)}</div>
                    <div style={{fontSize:10,color:C.muted}}>{MONTHS[s.month]}/{s.year}</div>
                    <button onClick={()=>removeSale(s.id)} style={{background:"transparent",border:`1px solid ${C.red}44`,color:C.red,borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab==="Prospectar"&&(
          <div>
            <div style={{fontSize:10,color:C.muted,letterSpacing:3,marginBottom:20}}>ENCONTRAR PROSPECTS REAIS</div>
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:20,marginBottom:16}}>
              <div style={{fontSize:10,color:C.muted,letterSpacing:2,marginBottom:12}}>BUSCAR NEGÓCIOS — GOOGLE PLACES</div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <select value={searchSeg} onChange={e=>setSearchSeg(e.target.value)} style={{...inp,flex:1,minWidth:160}}>
                  {SEGMENTS.map(s=><option key={s}>{s}</option>)}
                </select>
                <select value={searchCity} onChange={e=>setSearchCity(e.target.value)} style={{...inp,flex:1,minWidth:160}}>
                  {CITIES.map(c=><option key={c}>{c}</option>)}
                </select>
                <button onClick={doSearch} disabled={searching} style={btnStyle}>
                  {searching?"🔍 Buscando...":"🔍 Buscar"}
                </button>
              </div>
              {searchError&&<div style={{fontSize:11,color:C.red,marginTop:10}}>⚠️ {searchError}</div>}
              <div style={{fontSize:10,color:C.muted,marginTop:10,opacity:0.5}}>
                🔴 Sem site &nbsp;|&nbsp; 🟢 Com site — priorize os sem site para prospectar
              </div>
            </div>

            {searchResults.length>0&&(
              <div style={{marginBottom:16}}>
                <div style={{fontSize:10,color:C.muted,letterSpacing:2,marginBottom:10}}>
                  {searchResults.length} RESULTADOS EM {searchCity.toUpperCase()} &nbsp;·&nbsp;
                  <span style={{color:C.redLight}}>{searchResults.filter(r=>!r.hasWebsite).length} SEM SITE</span>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:7}}>
                  {searchResults.map(p=>{
                    const already=prospects.find(x=>x.id===p.id);
                    return(
                      <div key={p.id} style={{background:C.surface,border:`1px solid ${p.hasWebsite?C.border:C.red+"44"}`,borderLeft:`3px solid ${p.hasWebsite?C.border2:C.red}`,borderRadius:8,padding:"14px 16px",display:"flex",alignItems:"center",gap:12,opacity:p.hasWebsite?0.6:1}}>
                        <div style={{fontSize:20}}>🏪</div>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:700,color:"#fff",fontSize:13}}>{p.name}</div>
                          <div style={{fontSize:11,color:C.muted,marginTop:2}}>{p.address}</div>
                          {p.phone&&<div style={{fontSize:11,color:C.blueLight,marginTop:2}}>📞 {p.phone}</div>}
                          {p.website&&<div style={{fontSize:10,color:C.muted,marginTop:2}}>🌐 {p.website}</div>}
                          {p.rating&&<div style={{fontSize:10,color:"#f59e0b",marginTop:2}}>⭐ {p.rating} ({p.reviews} avaliações)</div>}
                        </div>
                        <div style={{fontSize:10,padding:"3px 8px",borderRadius:4,background:p.hasWebsite?`#10b98115`:`${C.red}15`,color:p.hasWebsite?"#4ade80":C.redLight,border:`1px solid ${p.hasWebsite?"#10b98133":C.red+"33"}`,whiteSpace:"nowrap"}}>
                          {p.hasWebsite?"COM SITE":"SEM SITE"}
                        </div>
                        {!p.hasWebsite&&(
                          <button onClick={()=>addProspect(p)} disabled={!!already} style={{...btnStyle,opacity:already?0.4:1,cursor:already?"not-allowed":"pointer",fontSize:11,padding:"6px 14px",whiteSpace:"nowrap"}}>
                            {already?"✓ Adicionado":"+ Pipeline"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {searchResults.length===0&&!searching&&!searchError&&(
              <div style={{textAlign:"center",padding:40,color:C.muted,fontSize:12}}>
                Escolha um segmento e cidade e clique em Buscar
              </div>
            )}

            {prospects.length>0&&(
              <div>
                <div style={{fontSize:10,color:C.muted,letterSpacing:2,marginBottom:10}}>MEU PIPELINE ({prospects.length})</div>
                <div style={{display:"flex",flexDirection:"column",gap:7}}>
                  {prospects.map(p=>(
                    <div key={p.id} style={{background:C.surface,border:`1px solid ${STATUS_COLORS[p.status]||C.border}33`,borderLeft:`3px solid ${STATUS_COLORS[p.status]||C.border}`,borderRadius:8,padding:"11px 16px",display:"flex",alignItems:"center",gap:12}}>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700,color:"#fff",fontSize:13}}>{p.name}</div>
                        <div style={{fontSize:11,color:C.muted}}>{p.segment} · {p.city}</div>
                        {p.phone&&<div style={{fontSize:11,color:C.blueLight,marginTop:2}}>📞 {p.phone}</div>}
                      </div>
                      <select value={p.status} onChange={e=>updateProspectStatus(p.id,e.target.value)} style={{...inp,width:130,color:STATUS_COLORS[p.status],borderColor:`${STATUS_COLORS[p.status]}55`}}>
                        {Object.entries(STATUS_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                      </select>
                      <button onClick={()=>removeProspect(p.id)} style={{background:"transparent",border:`1px solid ${C.red}44`,color:C.red,borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const inp={background:"#0a0f1e",border:"1px solid #1e2a45",borderRadius:7,color:"#e2e8f0",fontFamily:"'DM Mono',monospace",fontSize:12,padding:"9px 12px",outline:"none",width:"100%",boxSizing:"border-box"};
const btnStyle={background:`linear-gradient(135deg,#1d4ed8,#3b82f6)`,border:"none",borderRadius:7,color:"#fff",fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:700,padding:"9px 20px",cursor:"pointer",whiteSpace:"nowrap",letterSpacing:0.5,boxShadow:`0 0 14px #3b82f644`};
