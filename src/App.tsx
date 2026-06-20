import { useState, useEffect } from "react";

type Phase = "setup" | "game";
type Cell = number | null;
interface Game { cells: Cell[]; _isNew?: boolean; }
interface SavedState {
  phase?: Phase;
  names?: string[];
  playerNames?: string[];
  games?: Game[];
}
interface NumpadTarget { gIdx: number; pIdx: number; }
interface RekapEntry { loser: string | null; }

const INIT_NAMES: string[] = ["", "", "", ""];
function fmt(n: number): string { if(n===0)return"0"; return n>0?`+${n}`:`${n}`; }

interface RekapModalProps {
  history: RekapEntry[];
  onBack: () => void;
  onResetSamePlayer: () => void;
  onResetNewPlayer: () => void;
}
function RekapModal({history,onBack,onResetSamePlayer,onResetNewPlayer}: RekapModalProps){
  const sanksiCount: Record<string, number> = {};
  history.forEach(g=>{ if(g.loser) sanksiCount[g.loser]=(sanksiCount[g.loser]||0)+1; });
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:999}}>
      <div style={{background:"#0d1f0d",borderTop:"2px solid #2a6b2a",borderRadius:"20px 20px 0 0",padding:"24px 16px 36px",width:"100%",maxWidth:480,maxHeight:"85vh",overflowY:"auto"}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:11,color:"#4ade80",letterSpacing:3,fontFamily:"monospace"}}>SESI SELESAI</div>
          <div style={{fontSize:26,color:"#d4af37",fontWeight:900,letterSpacing:2,marginTop:4}}>REKAP SEMUA GAME</div>
        </div>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:10,color:"#6b7280",letterSpacing:2,fontFamily:"monospace",marginBottom:8}}>SANKSI PER GAME</div>
          {history.map((g,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",marginBottom:6,borderRadius:10,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)"}}>
              <span style={{fontFamily:"monospace",fontSize:11,color:"#6b7280",flexShrink:0}}>Game #{i+1}</span>
              {g.loser
                ?<span style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{color:"#f87171",fontWeight:700,fontSize:13}}>{g.loser}</span>
                  <span style={{background:"rgba(220,38,38,0.2)",color:"#f87171",fontSize:10,fontWeight:800,padding:"1px 7px",borderRadius:20}}>🍶 SANKSI</span>
                </span>
                :<span style={{color:"#6b7280",fontSize:12}}>—</span>
              }
            </div>
          ))}
        </div>
        {Object.keys(sanksiCount).length>0&&(
          <div style={{background:"rgba(0,0,0,0.3)",borderRadius:12,padding:"12px 14px",marginBottom:16}}>
            <div style={{fontSize:10,color:"#6b7280",letterSpacing:2,fontFamily:"monospace",marginBottom:10}}>TOTAL SANKSI</div>
            {Object.entries(sanksiCount).sort((a,b)=>b[1]-a[1]).map(([name,count])=>(
              <div key={name} style={{display:"flex",justifyContent:"space-between",color:"#e5e7eb",fontSize:13,marginBottom:6}}>
                <span>{name}</span>
                <span style={{color:"#f87171",fontFamily:"monospace"}}>{"🍶".repeat(Math.min(count,6))} {count}×</span>
              </div>
            ))}
          </div>
        )}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <button onClick={onResetSamePlayer} style={{width:"100%",padding:14,borderRadius:12,border:"none",background:"linear-gradient(135deg,#d97706,#b45309)",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}>🃏 Main Baru (Pemain Sama)</button>
          <button onClick={onResetNewPlayer} style={{width:"100%",padding:14,borderRadius:12,border:"none",background:"linear-gradient(135deg,#7c3aed,#5b21b6)",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}>👤 Main Baru (Pemain Baru)</button>
          <button onClick={onBack} style={{width:"100%",padding:14,borderRadius:12,border:"1px solid rgba(255,255,255,0.12)",background:"transparent",color:"#9ca3af",fontSize:14,fontWeight:600,cursor:"pointer"}}>← Kembali</button>
        </div>
      </div>
    </div>
  );
}

interface UndoModalProps {
  games: Game[];
  playerNames: string[];
  onUndo: (gIdx: number, pIdx: number) => void;
  onClose: () => void;
}
interface UndoEntry { gIdx: number; pIdx: number; name: string; val: number; }
function UndoModal({games,playerNames,onUndo,onClose}: UndoModalProps){
  const entries: UndoEntry[]=[];
  games.forEach((g,gIdx)=>{
    playerNames.forEach((name,pIdx)=>{
      const val=g.cells[pIdx];
      if(val!==null&&val!==undefined) entries.push({gIdx,pIdx,name,val});
    });
  });
  const recent=[...entries].reverse().slice(0,12);
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:998}}>
      <div style={{background:"#110a0a",borderTop:"2px solid #7f1d1d",borderRadius:"20px 20px 0 0",padding:"20px 16px 36px",width:"100%",maxWidth:480,maxHeight:"70vh",overflowY:"auto"}}>
        <div style={{textAlign:"center",marginBottom:16}}>
          <div style={{fontSize:11,color:"#f87171",letterSpacing:3,fontFamily:"monospace"}}>HAPUS ENTRI</div>
          <div style={{fontSize:20,color:"#fca5a5",fontWeight:900,marginTop:4}}>UNDO INPUT</div>
        </div>
        {recent.length===0&&<div style={{textAlign:"center",color:"#6b7280",fontFamily:"monospace",fontSize:12,padding:20}}>tidak ada data</div>}
        {recent.map((r,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",marginBottom:8,borderRadius:10,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:18}}>{r.val<0?"📉":"📈"}</span>
              <div>
                <div style={{color:"#e5e7eb",fontWeight:700,fontSize:14}}>{r.name} <span style={{color:"#6b7280",fontSize:11,fontWeight:400}}>Game #{r.gIdx+1}</span></div>
                <div style={{fontSize:12,color:r.val<0?"#f87171":"#4ade80",fontFamily:"monospace"}}>{fmt(r.val)}</div>
              </div>
            </div>
            <button onClick={()=>onUndo(r.gIdx,r.pIdx)} style={{background:"rgba(220,38,38,0.2)",border:"1px solid rgba(220,38,38,0.4)",borderRadius:8,color:"#f87171",padding:"6px 12px",fontSize:12,fontWeight:700,cursor:"pointer"}}>HAPUS</button>
          </div>
        ))}
        <button onClick={onClose} style={{width:"100%",marginTop:8,padding:12,borderRadius:10,border:"1px solid rgba(255,255,255,0.1)",background:"transparent",color:"#9ca3af",fontSize:14,fontWeight:600,cursor:"pointer"}}>Tutup</button>
      </div>
    </div>
  );
}

interface NumpadModalProps {
  title: string;
  onConfirm: (val: number) => void;
  onClose: () => void;
}
function NumpadModal({title,onConfirm,onClose}: NumpadModalProps){
  const [display,setDisplay]=useState("");
  const [negative,setNegative]=useState(false);
  const press=(k: string)=>{
    if(k==="DEL"){setDisplay(d=>d.slice(0,-1));return;}
    if(k==="+/-"){setNegative(n=>!n);return;}
    if(display.length>=5)return;
    setDisplay(d=>d+k);
  };
  const confirm=()=>{
    const val=parseInt(display);
    if(!isNaN(val)&&val!==0) onConfirm(negative?-Math.abs(val):Math.abs(val));
  };
  const keys=["7","8","9","4","5","6","1","2","3","+/-","0","DEL"];
  const finalVal=display?(negative?`-${display}`:display):"";
  const isNeg=negative&&display!=="";
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:997}}>
      <div style={{background:"#0a0d0a",borderTop:"2px solid #1f2d1f",borderRadius:"20px 20px 0 0",padding:"20px 16px 32px",width:"100%",maxWidth:420}}>
        <div style={{textAlign:"center",marginBottom:14}}>
          <div style={{fontSize:12,color:"#9ca3af",letterSpacing:2,fontFamily:"monospace"}}>{title}</div>
          <div style={{marginTop:10,fontFamily:"monospace",fontWeight:900,fontSize:48,color:finalVal===""?"rgba(255,255,255,0.15)":isNeg?"#f87171":"#4ade80",minHeight:60,lineHeight:"60px"}}>
            {finalVal===""?"0":finalVal}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:12}}>
          {keys.map(k=>{
            const isSpec=k==="DEL"||k==="+/-";
            const isActive=k==="+/-"&&negative;
            return(
              <button key={k} onClick={()=>press(k)} style={{padding:"18px 0",borderRadius:12,border:"none",cursor:"pointer",fontFamily:"monospace",fontSize:20,fontWeight:700,background:isActive?"rgba(220,38,38,0.3)":isSpec?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.06)",color:isActive?"#f87171":isSpec?"#9ca3af":"#e5e7eb"}}>
                {k}
              </button>
            );
          })}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:10}}>
          <button onClick={onClose} style={{padding:16,borderRadius:12,border:"1px solid rgba(255,255,255,0.1)",background:"transparent",color:"#9ca3af",fontSize:14,fontWeight:600,cursor:"pointer"}}>Batal</button>
          <button onClick={confirm} style={{padding:16,borderRadius:12,border:"none",background:"linear-gradient(135deg,#16a34a,#15803d)",color:"#fff",fontSize:16,fontWeight:900,cursor:"pointer",opacity:display===""?0.4:1}}>MASUKKAN</button>
        </div>
      </div>
    </div>
  );
}

// ── localStorage helpers ──
const LS_KEY="remi_tracker_v1";
function loadState(): SavedState | null {
  try{
    const raw=localStorage.getItem(LS_KEY);
    if(!raw)return null;
    return JSON.parse(raw);
  }catch(e){return null;}
}
function saveState(obj: SavedState): void {
  try{ localStorage.setItem(LS_KEY,JSON.stringify(obj)); }catch(e){}
}

export default function App(){
  const saved=loadState();
  const [phase,setPhase]=useState<Phase>(saved?.phase||"setup");
  const [names,setNames]=useState<string[]>(saved?.names||INIT_NAMES);
  const [playerNames,setPlayerNames]=useState<string[]>(saved?.playerNames||[]);
  const [games,setGames]=useState<Game[]>(saved?.games||[]);
  const [showRekap,setShowRekap]=useState(false);
  const [showUndo,setShowUndo]=useState(false);
  const [numpad,setNumpad]=useState<NumpadTarget | null>(null);

  const n=playerNames.length||4;

  // auto-save whenever phase/playerNames/games changes
  useEffect(()=>{
    saveState({phase,names,playerNames,games});
  },[phase,names,playerNames,games]);

  const cumulative=(gIdx: number, pIdx: number): number =>{
    let t=0;
    for(let i=0;i<=gIdx;i++){
      const v=games[i]?.cells[pIdx];
      if(v!==null&&v!==undefined) t+=v;
    }
    return t;
  };
  const lastCumulative=(pIdx: number): number =>games.length===0?0:cumulative(games.length-1,pIdx);

  const loserAtGame=(gIdx: number): string | null =>{
    let anyFilled=false;
    const vals=playerNames.map((_,pi)=>{
      let filled=false;
      for(let i=0;i<=gIdx;i++){
        if(games[i]?.cells[pi]!==null&&games[i]?.cells[pi]!==undefined){filled=true;break;}
      }
      if(filled)anyFilled=true;
      return filled?cumulative(gIdx,pi):null;
    });
    if(!anyFilled)return null;
    const nonNull=vals.filter((v): v is number=>v!==null);
    if(nonNull.length===0)return null;
    const minVal=Math.min(...nonNull);
    const idx=vals.indexOf(minVal);
    return idx>=0?playerNames[idx]:null;
  };

  const startGame=()=>{
    const r=names.map((nm,i)=>nm.trim()||`P${i+1}`);
    setPlayerNames(r);
    setGames([]);
    setPhase("game");
  };

  const openNumpad=(gIdx: number, pIdx: number)=>setNumpad({gIdx,pIdx});

  const confirmNumpad=(val: number)=>{
    if(!numpad)return;
    const {gIdx,pIdx}=numpad;
    setGames(prev=>{
      const next=[...prev];
      while(next.length<=gIdx) next.push({cells:Array(n).fill(null)});
      const g={...next[gIdx],cells:[...next[gIdx].cells]};
      g.cells[pIdx]=val;
      next[gIdx]=g;
      return next;
    });
    setNumpad(null);
  };

  const undoCell=(gIdx: number, pIdx: number)=>{
    setGames(prev=>{
      const next=[...prev];
      const g={...next[gIdx],cells:[...next[gIdx].cells]};
      g.cells[pIdx]=null;
      next[gIdx]=g;
      while(next.length>0&&next[next.length-1].cells.every(c=>c===null||c===undefined)) next.pop();
      return next;
    });
  };

  const handleReset=()=>setShowRekap(true);
  const confirmResetSamePlayer=()=>{
    const freshGames: Game[]=[];
    setGames(freshGames);
    saveState({phase,names,playerNames,games:freshGames});
    setShowRekap(false);
  };
  const confirmResetNewPlayer=()=>{
    const freshGames: Game[]=[];
    const freshNames=INIT_NAMES;
    setGames(freshGames);
    setPlayerNames([]);
    setNames(freshNames);
    setPhase("setup");
    saveState({phase:"setup",names:freshNames,playerNames:[],games:freshGames});
    setShowRekap(false);
  };

  const low=(()=>{
    if(games.length===0||playerNames.length===0)return -1;
    const vals=playerNames.map((_,pi)=>lastCumulative(pi));
    const m=Math.min(...vals);
    return vals.indexOf(m);
  })();

  const displayRows: Game[]=games.length>0
    ?(games[games.length-1].cells.every(c=>c===null)
      ?games
      :[...games,{cells:Array(n).fill(null),_isNew:true}])
    :[{cells:Array(n).fill(null),_isNew:true}];

  const rekapHistory=games.map((_,gi)=>({loser:loserAtGame(gi)}));

  const root={
    minHeight:"100vh",
    background:"radial-gradient(ellipse at top,#0a2010 0%,#020502 70%)",
    color:"#e5e7eb",
    fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    fontSize:14,
  };

  const globalCss=`*{box-sizing:border-box;margin:0;padding:0;}input::placeholder{color:rgba(255,255,255,0.2);}@keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}`;

  /* ── SETUP ── */
  if(phase==="setup") return(
    <div style={root}>
      <style>{globalCss}</style>
      <div style={{maxWidth:420,margin:"0 auto",padding:"48px 20px 32px"}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{fontSize:52}}>🃏</div>
          <h1 style={{fontFamily:"monospace",fontSize:28,color:"#d4af37",letterSpacing:4,margin:"8px 0 4px",fontWeight:900}}>REMI AFWAJAA</h1>
          <p style={{color:"#6b7280",fontSize:11,letterSpacing:2,fontFamily:"monospace"}}>MASUKKAN NAMA 4 PEMAIN</p>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {INIT_NAMES.map((_,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:34,height:34,borderRadius:"50%",background:"linear-gradient(135deg,#16a34a,#15803d)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:900,fontSize:13,flexShrink:0,fontFamily:"monospace"}}>P{i+1}</div>
              <input
                type="text" placeholder={`Pemain ${i+1}`} value={names[i]}
                onChange={e=>{const u=[...names];u[i]=e.target.value;setNames(u);}}
                onKeyDown={e=>e.key==="Enter"&&i===3&&startGame()}
                style={{flex:1,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(74,222,128,0.2)",borderRadius:10,padding:"12px 14px",color:"#e5e7eb",fontSize:16,outline:"none",fontFamily:"inherit"}}
              />
            </div>
          ))}
        </div>
        <button onClick={startGame} style={{width:"100%",marginTop:28,padding:16,borderRadius:14,border:"none",background:"linear-gradient(135deg,#16a34a,#15803d)",color:"#fff",fontSize:17,fontWeight:900,letterSpacing:3,cursor:"pointer",fontFamily:"monospace",boxShadow:"0 4px 20px rgba(22,163,74,0.35)"}}>🃏 MULAI MAIN</button>
      </div>
    </div>
  );

  /* ── GAME ── */
  return(
    <div style={root}>
      <style>{globalCss}</style>

      {showRekap&&<RekapModal history={rekapHistory} onBack={()=>setShowRekap(false)} onResetSamePlayer={confirmResetSamePlayer} onResetNewPlayer={confirmResetNewPlayer}/>}
      {showUndo&&<UndoModal games={games} playerNames={playerNames} onUndo={undoCell} onClose={()=>setShowUndo(false)}/>}
      {numpad!==null&&(
        <NumpadModal
          title={`${playerNames[numpad.pIdx]} · Game #${numpad.gIdx+1}`}
          onConfirm={confirmNumpad}
          onClose={()=>setNumpad(null)}
        />
      )}

      {/* HEADER */}
      <div style={{position:"sticky",top:0,zIndex:50,background:"rgba(5,13,5,0.97)",backdropFilter:"blur(10px)",borderBottom:"1px solid rgba(74,222,128,0.15)",padding:"10px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
        <span style={{fontFamily:"monospace",color:"#d4af37",fontWeight:900,fontSize:16,letterSpacing:2}}>🃏 REMI AFWAJAA</span>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>setShowUndo(true)} style={{background:"rgba(220,38,38,0.2)",border:"1px solid rgba(220,38,38,0.3)",borderRadius:8,color:"#f87171",padding:"7px 10px",fontWeight:700,fontSize:12,cursor:"pointer"}}>↩ UNDO</button>
          <button onClick={handleReset} style={{background:"linear-gradient(135deg,#d97706,#b45309)",border:"none",borderRadius:8,color:"#fff",padding:"7px 12px",fontWeight:700,fontSize:12,cursor:"pointer"}}>🔄 RESET</button>
        </div>
      </div>

      {/* TOTAL BAR — nama + skor total */}
      <div style={{display:"grid",gridTemplateColumns:`40px repeat(${n},1fr)`,background:"rgba(0,0,0,0.5)",borderBottom:"2px solid rgba(74,222,128,0.12)"}}>
        <div/>
        {playerNames.map((name,pi)=>{
          const isLow=pi===low&&games.length>0;
          const total=lastCumulative(pi);
          return(
            <div key={pi} style={{padding:"6px 4px",textAlign:"center",borderLeft:"1px solid rgba(255,255,255,0.06)"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:3}}>
                <span style={{fontSize:"clamp(9px,2.5vw,12px)",fontFamily:"monospace",fontWeight:800,color:isLow?"#f87171":"#4ade80",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</span>
                {isLow&&<span style={{fontSize:10,animation:"blink 1.1s infinite"}}>🍶</span>}
              </div>
              <div style={{fontFamily:"monospace",fontWeight:900,fontSize:"clamp(13px,3.5vw,18px)",color:total>0?"#4ade80":total<0?"#f87171":"#9ca3af"}}>
                {games.length>0?fmt(total):"—"}
              </div>
            </div>
          );
        })}
      </div>

      {/* TABLE */}
      <table style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed"}}>
        <colgroup>
          <col style={{width:"40px"}}/>
          {playerNames.map((_,i)=><col key={i}/>)}
        </colgroup>
        <thead>
          <tr>
            <th style={{background:"rgba(0,0,0,0.4)",color:"#4b5563",fontSize:9,fontFamily:"monospace",padding:"6px 0",textAlign:"center",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>GAME</th>
            {playerNames.map((name,pi)=>(
              <th key={pi} style={{padding:"7px 4px",textAlign:"center",fontSize:"clamp(9px,2.5vw,12px)",fontWeight:700,fontFamily:"monospace",color:"#9ca3af",borderBottom:"1px solid rgba(255,255,255,0.06)",borderLeft:"1px solid rgba(255,255,255,0.05)"}}>
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayRows.map((g,gIdx)=>{
            const isNewRow=g._isNew||gIdx>=games.length;
            const loserName=!isNewRow?loserAtGame(gIdx):null;
            return(
              <tr key={gIdx} style={{background:gIdx%2===0?"rgba(255,255,255,0.015)":"transparent"}}>
                {/* nomor game */}
                <td style={{textAlign:"center",padding:"7px 2px",borderRight:"1px solid rgba(255,255,255,0.06)",verticalAlign:"middle"}}>
                  <div style={{fontFamily:"monospace",fontSize:11,color:"#6b7280"}}>{gIdx+1}</div>
                </td>
                {/* sel per pemain */}
                {playerNames.map((_,pi)=>{
                  const val=!isNewRow?g.cells[pi]:null;
                  const isEmpty=val===null||val===undefined;
                  const cumVal=!isNewRow&&!isEmpty?cumulative(gIdx,pi):null;
                  const isSanksi=!isNewRow&&!isEmpty&&loserName===playerNames[pi];
                  return(
                    <td key={pi}
                      onClick={()=>openNumpad(gIdx,pi)}
                      style={{textAlign:"center",padding:"10px 3px",borderLeft:"1px solid rgba(255,255,255,0.05)",cursor:"pointer",verticalAlign:"middle",background:isEmpty?"transparent":val<0?"rgba(220,38,38,0.06)":"rgba(74,222,128,0.04)"}}
                    >
                      {isEmpty
                        ?<span style={{color:"rgba(255,255,255,0.15)",fontSize:18}}>+</span>
                        :<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:3}}>
                          <span style={{fontFamily:"monospace",fontSize:"clamp(12px,3.5vw,16px)",fontWeight:900,color:(cumVal??0)>0?"#4ade80":(cumVal??0)<0?"#f87171":"#9ca3af"}}>
                            {fmt(cumVal??0)}
                          </span>
                          {isSanksi&&<span style={{fontSize:12,animation:"blink 1.3s infinite"}}>🍶</span>}
                        </div>
                      }
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{padding:"12px",borderTop:"1px solid rgba(255,255,255,0.07)",background:"rgba(0,0,0,0.2)"}}>
        <div style={{fontSize:10,color:"#4b5563",textAlign:"center",fontFamily:"monospace"}}>
          ketuk <span style={{color:"rgba(255,255,255,0.2)"}}>+</span> untuk input nilai · gunakan <span style={{color:"#9ca3af"}}>+/-</span> untuk nilai minus
        </div>
      </div>
      <div style={{height:20}}/>
    </div>
  );
}
