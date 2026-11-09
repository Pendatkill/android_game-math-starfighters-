/* Math Starfighters v4 — ART module (diseños originales, render procedural pre-cacheado)
   API: ART.init, wall, laser, asteroid, drone, bolt, turret, portal, gem, star, finish, ship, explosion, clear */
(function(){
'use strict';
const RES=2;                       // resolución de los sprites pre-renderizados (px por unidad lógica)
const FONT='"Orbitron","Exo 2","Arial Black",Impact,sans-serif';
const PAL={
 hangar:{hull:'#617189',dark:'#262e3c',light:'#b4c3d8',acc:'#4fd8ff',label:'#eaf8ff',trim:'#ffb000',rock:['#a4a4ab','#5d5d66','#26262c']},
 space:{hull:'#615c86',dark:'#24213c',light:'#b2aadf',acc:'#b98cff',label:'#f2eaff',trim:'#ff7ad9',rock:['#b0a296','#6c5f56','#2a221e']},
 desert:{hull:'#8e6c4a',dark:'#3a2716',light:'#e0bd92',acc:'#ffb347',label:'#fff3dc',trim:'#ff5a1f',rock:['#d9a874','#8c5a33','#3a2412']},
 ice:{hull:'#3f5e7b',dark:'#162536',light:'#9ec6ea',acc:'#8ff6ff',label:'#ffffff',trim:'#ff5a7a',rock:['#f2fbff','#93bfe0','#36587a']},
 forest:{hull:'#58633f',dark:'#1f2614',light:'#b0c08a',acc:'#b0ff4f',label:'#f6ffe2',trim:'#ffcf3f',rock:['#9a9878','#5a5a40','#22231a']},
 lava:{hull:'#4a3838',dark:'#170e10',light:'#9a7a78',acc:'#ff6a1a',label:'#ffe6cc',trim:'#ffcf3f',rock:['#6e544c','#3a2a26','#120a08']},
 city:{hull:'#4e4274',dark:'#1b152d',light:'#a294d2',acc:'#ff4fd8',label:'#fff0ff',trim:'#4fe3ff',rock:['#a69cc0','#5e5476','#211a30']},
 tunnel:{hull:'#5e5e55',dark:'#23231c',light:'#b0b0a0',acc:'#ffd23f',label:'#fffbe2',trim:'#ff3a2a',rock:['#a8a290','#666450','#28261e']},
 storm:{hull:'#4e4774',dark:'#1a172c',light:'#a59cd2',acc:'#c6a8ff',label:'#f8f2ff',trim:'#5ff0ff',rock:['#aea6cc','#655d8c','#231e3e']},
 dark:{hull:'#3a2f3b',dark:'#100a10',light:'#857486',acc:'#ff2a3a',label:'#ffdcdc',trim:'#ff2a3a',rock:['#82727a','#40333a','#120c10']},
};
const P=t=>PAL[t]||PAL.space;
// ---------- utilidades ----------
function rng(seed){seed=(seed|0)||1;return function(){seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function hex(h){const n=parseInt(h.slice(1),16);return[n>>16&255,n>>8&255,n&255];}
function rgba(h,a){const c=hex(h);return`rgba(${c[0]},${c[1]},${c[2]},${a})`;}
function mix(a,b,f){const x=hex(a),y=hex(b);return'#'+[0,1,2].map(i=>Math.round(x[i]+(y[i]-x[i])*f).toString(16).padStart(2,'0')).join('');}
const lighten=(h,f)=>mix(h,'#ffffff',f),darken=(h,f)=>mix(h,'#000000',f);
function mk(w,h,res){res=res||RES;const c=document.createElement('canvas');c.width=Math.max(1,Math.ceil(w*res));c.height=Math.max(1,Math.ceil(h*res));const g=c.getContext('2d');g.scale(res,res);return[c,g];}
function rrp(g,x,y,w,h,r){r=Math.min(r,w/2,h/2);g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
function glowDot(g,x,y,r,col,a){const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,rgba(col,a));gr.addColorStop(.35,rgba(col,a*.45));gr.addColorStop(1,rgba(col,0));g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}
function hashN(n){n=Math.round(n)|0;n=Math.imul(n^n>>>16,0x45d9f3b);n=Math.imul(n^n>>>16,0x45d9f3b);return(n^n>>>16)>>>0;}
const cache=new Map();
function cached(key,fn){let v=cache.get(key);if(!v){v=fn();cache.set(key,v);}return v;}

// ---------- casco (textura) ----------
const TILE=240;
function rivets(g,x,y,w,h,col){g.fillStyle=col;for(const [a,b] of [[x+4,y+4],[x+w-4,y+4],[x+4,y+h-4],[x+w-4,y+h-4]]){g.beginPath();g.arc(a,b,1.6,0,6.283);g.fill();}}
function greeble(g,r,p,x,y,w,h,kind){
  if(w<14||h<14)return;
  const t=r();
  if(t<.28){ // rejillas de ventilación
    const n=Math.max(2,Math.floor((h-12)/9)),vw=Math.min(w-10,48),vx=x+(w-vw)/2;
    g.fillStyle=darken(p.hull,.35);rrp(g,vx-3,y+5,vw+6,n*9+4,3);g.fill();
    for(let i=0;i<n;i++){g.fillStyle=darken(p.dark,.3);g.fillRect(vx,y+8+i*9,vw,4);g.fillStyle=rgba(p.light,.35);g.fillRect(vx,y+12+i*9,vw,1);}
  }else if(t<.52){ // placa remachada en relieve
    const ix=x+5,iy=y+5,iw=w-10,ih=h-10;
    g.fillStyle=lighten(p.hull,.07);g.fillRect(ix,iy,iw,ih);
    g.fillStyle=rgba(p.light,.45);g.fillRect(ix,iy,iw,1.5);g.fillRect(ix,iy,1.5,ih);
    g.fillStyle=rgba('#000000',.4);g.fillRect(ix,iy+ih-1.5,iw,1.5);g.fillRect(ix+iw-1.5,iy,1.5,ih);
    rivets(g,ix,iy,iw,ih,rgba(p.dark,.9));
    if(r()<.5&&iw>26){g.fillStyle=rgba(p.dark,.55);g.fillRect(ix+iw*.25,iy+ih*.45,iw*.5,3);}
  }else if(t<.7){ // tubería / conducto vertical
    const pw=Math.min(12,w*.22),px=r()<.5?x+5:x+w-5-pw;
    const gr=g.createLinearGradient(px,0,px+pw,0);gr.addColorStop(0,darken(p.hull,.45));gr.addColorStop(.4,lighten(p.light,.2));gr.addColorStop(1,darken(p.hull,.5));
    g.fillStyle=gr;g.fillRect(px,y+2,pw,h-4);
    g.fillStyle=rgba(p.dark,.8);for(let yy=y+10;yy<y+h-6;yy+=26)g.fillRect(px-1.5,yy,pw+3,4);
  }else if(t<.84){ // luces de estado
    const n=2+Math.floor(r()*3),lx=x+w/2-(n-1)*5;
    g.fillStyle=darken(p.dark,.2);rrp(g,lx-7,y+h/2-7,(n-1)*10+14,14,4);g.fill();
    for(let i=0;i<n;i++){const col=r()<.75?p.acc:p.trim;glowDot(g,lx+i*10,y+h/2,7,col,.8);g.fillStyle=lighten(col,.6);g.beginPath();g.arc(lx+i*10,y+h/2,2,0,6.283);g.fill();}
  }else{ // franja de peligro
    const sh=10,sy=y+h/2-sh/2;g.save();g.beginPath();g.rect(x+4,sy,w-8,sh);g.clip();g.fillStyle=darken(p.dark,.2);g.fillRect(x,sy,w,sh);
    g.fillStyle=p.trim;for(let xx=x-sh;xx<x+w+sh;xx+=12){g.beginPath();g.moveTo(xx,sy+sh);g.lineTo(xx+6,sy);g.lineTo(xx+12,sy);g.lineTo(xx+6,sy+sh);g.fill();}g.restore();
  }
}
function hullTile(theme,kind,w,variant){
  const p=P(theme),r=rng(hashN(w*31+variant*977+theme.length*7+(kind==='move'?5000:0)));
  const W=kind==='big'?TILE:w,[c,g]=mk(W,TILE);
  // volumen cilíndrico (bisel horizontal)
  const gr=g.createLinearGradient(0,0,W,0);
  if(kind==='big'){gr.addColorStop(0,p.hull);gr.addColorStop(1,p.hull);}
  else{gr.addColorStop(0,darken(p.hull,.5));gr.addColorStop(.12,p.hull);gr.addColorStop(.38,lighten(p.hull,.2));gr.addColorStop(.62,p.hull);gr.addColorStop(.88,darken(p.hull,.25));gr.addColorStop(1,darken(p.hull,.6));}
  g.fillStyle=gr;g.fillRect(0,0,W,TILE);
  // ruido de superficie
  for(let i=0;i<W*TILE/90;i++){g.fillStyle=r()<.5?rgba('#ffffff',.035):rgba('#000000',.06);g.fillRect(r()*W,r()*TILE,1+r()*3,1);}
  const rows=kind==='big'?3:4,ph=TILE/rows,cols=kind==='big'?2:1,pw=W/cols;
  for(let i=0;i<rows;i++){
    const y=i*ph;
    g.fillStyle=rgba('#000000',.55);g.fillRect(0,y,W,2);g.fillStyle=rgba(p.light,.25);g.fillRect(0,y+2,W,1.2);
    for(let j=0;j<cols;j++){
      const x=j*pw;
      if(cols>1){g.fillStyle=rgba('#000000',.5);g.fillRect(x,y,2,ph);g.fillStyle=rgba(p.light,.2);g.fillRect(x+2,y,1.2,ph);}
      if(kind==='move'){continue;}
      greeble(g,r,p,x+(kind==='big'?4:8),y+4,pw-(kind==='big'?8:16),ph-8,kind);
      if(kind==='big'&&r()<.6)greeble(g,r,p,x+8,y+ph*.5,pw*.45,ph*.45,kind);
    }
  }
  if(kind==='move'){ // pistón hidráulico cromado + franjas laterales
    const rw=Math.max(10,w*.3),rx=w/2-rw/2;
    const cg=g.createLinearGradient(rx,0,rx+rw,0);cg.addColorStop(0,'#5a5f68');cg.addColorStop(.35,'#f4f7fb');cg.addColorStop(.55,'#b8c0cc');cg.addColorStop(1,'#3a3e46');
    g.fillStyle=cg;g.fillRect(rx,0,rw,TILE);
    for(let i=0;i<rows;i++){const y=i*ph;g.fillStyle=darken(p.dark,.1);g.fillRect(rx-5,y+ph-16,rw+10,12);g.fillStyle=rgba(p.light,.4);g.fillRect(rx-5,y+ph-16,rw+10,1.5);}
    for(const sx of [0,w-9]){g.save();g.beginPath();g.rect(sx,0,9,TILE);g.clip();g.fillStyle='#16161a';g.fillRect(sx,0,9,TILE);g.fillStyle='#ffc21a';for(let yy=-12;yy<TILE+12;yy+=16){g.beginPath();g.moveTo(sx,yy);g.lineTo(sx+9,yy-9);g.lineTo(sx+9,yy-1);g.lineTo(sx,yy+8);g.fill();}g.restore();}
  }
  // bordes reforzados
  if(kind!=='move'){g.fillStyle=darken(p.dark,.2);g.fillRect(0,0,3,TILE);g.fillRect(W-3,0,3,TILE);g.fillStyle=rgba(p.light,.35);g.fillRect(3,0,1.2,TILE);}
  return c;
}
function getTile(theme,kind,w,variant){return cached(`t|${theme}|${kind}|${Math.round(w)}|${variant}`,()=>hullTile(theme,kind,Math.round(w),variant));}
// ---------- remate del muro (extremo peligroso) ----------
const CAP=34;
function capSprite(theme,kind,w){ // dibujado con el borde peligroso arriba (y=0); se voltea para muros superiores
  const p=P(theme),[c,g]=mk(w,CAP);
  const gr=g.createLinearGradient(0,0,0,CAP);gr.addColorStop(0,lighten(p.dark,.25));gr.addColorStop(.25,darken(p.hull,.15));gr.addColorStop(1,darken(p.hull,.35));
  g.fillStyle=gr;g.fillRect(0,0,w,CAP);
  // bisel de blindaje
  g.fillStyle=rgba(p.light,.45);g.fillRect(0,7,w,1.5);g.fillStyle=rgba('#000000',.55);g.fillRect(0,CAP-2,w,2);
  // galones
  const cy=13,chh=12,col=kind==='move'?'#ffc21a':p.trim;
  g.save();g.beginPath();g.rect(3,cy,w-6,chh);g.clip();g.fillStyle='#121216';g.fillRect(0,cy,w,chh);g.fillStyle=col;
  for(let x=-10;x<w+12;x+=14){g.beginPath();g.moveTo(x,cy+chh);g.lineTo(x+7,cy);g.lineTo(x+14,cy);g.lineTo(x+7,cy+chh);g.fill();}g.restore();
  g.fillStyle=rgba('#000000',.5);g.fillRect(3,cy+chh,w-6,1.5);
  // tira emisora de energía en el borde
  g.fillStyle=darken(p.dark,.3);g.fillRect(0,0,w,6);
  const eg=g.createLinearGradient(0,0,0,6);eg.addColorStop(0,'#ffffff');eg.addColorStop(.35,p.acc);eg.addColorStop(1,rgba(p.acc,.2));
  g.fillStyle=eg;g.fillRect(2,0,w-4,5);
  // carcasas de luces
  for(const lx of [6,w-6]){g.fillStyle='#0c0c10';g.beginPath();g.arc(lx,CAP-9,3.6,0,6.283);g.fill();}
  return c;
}
function getCap(theme,kind,w){return cached(`c|${theme}|${kind}|${Math.round(w)}`,()=>capSprite(theme,kind,Math.round(w)));}
// ---------- rótulo ----------
function labelV(theme,w,kind){
  const p=P(theme),fs=Math.min(24,w*.36),step=fs*1.12,pw=Math.min(w-12,fs*1.55),ph=7*step+fs*.55;
  const [c,g]=mk(pw+8,ph+8);const ox=4,oy=4;
  rrp(g,ox,oy,pw,ph,5);g.fillStyle=rgba('#05060a',.82);g.fill();g.lineWidth=1.5;g.strokeStyle=rgba(p.acc,.75);g.stroke();
  g.fillStyle=rgba(p.light,.18);g.fillRect(ox+3,oy+3,pw-6,1);
  g.font=`900 ${fs}px ${FONT}`;g.textAlign='center';g.textBaseline='middle';
  for(let i=0;i<7;i++){const ty=oy+fs*.55+i*step+step*.36;const ch='MATHSF'[i];
    g.fillStyle=rgba(p.acc,.35);g.fillText(ch,ox+pw/2,ty+1.5);g.fillText(ch,ox+pw/2+1,ty);g.fillText(ch,ox+pw/2-1,ty);
    g.fillStyle=kind==='move'?'#ffe9a0':p.label;g.fillText(ch,ox+pw/2,ty);}
  return c;
}
function labelH(theme,w){
  const p=P(theme),pw=Math.min(w-28,380),fs=Math.min(50,pw/5.6),ph=fs*1.75;
  const [c,g]=mk(pw+8,ph+8);const ox=4,oy=4;
  rrp(g,ox,oy,pw,ph,8);g.fillStyle=rgba('#05060a',.82);g.fill();g.lineWidth=2;g.strokeStyle=rgba(p.acc,.8);g.stroke();
  g.fillStyle=rgba(p.acc,.9);g.fillRect(ox+10,oy+4,pw-20,2);g.fillRect(ox+10,oy+ph-6,pw-20,2);
  g.font=`900 ${fs}px ${FONT}`;g.textAlign='center';g.textBaseline='middle';
  const ty=oy+ph*.43;g.fillStyle=rgba(p.acc,.4);for(const [dx,dy] of [[2,0],[-2,0],[0,2],[0,-2]])g.fillText('MATHSF',ox+pw/2+dx,ty+dy);
  g.fillStyle=p.label;g.fillText('MATHSF',ox+pw/2,ty);
  g.font=`800 ${fs*.3}px ${FONT}`;g.fillStyle=p.acc;g.fillText('★ PILOTO ESTELAR ★',ox+pw/2,oy+ph*.8);
  return c;
}
function getLabel(theme,kind,w){return cached(`l|${theme}|${kind}|${Math.round(w)}`,()=>kind==='big'?labelH(theme,w):labelV(theme,w,kind));}

const ART={};
ART.init=function(){};
ART.clear=function(){cache.clear();};
try{if(document.fonts&&document.fonts.addEventListener)document.fonts.addEventListener('loadingdone',()=>{for(const k of [...cache.keys()])if(k[0]==='l')cache.delete(k);});}catch(e){}

ART.wall=function(ctx,theme,x,y,w,h,isTop,kind,t){
  const top=Math.max(y,-20),bot=Math.min(y+h,740);if(bot<=top||w<=0)return;
  const p=P(theme),edge=isTop?y+h:y,variant=kind==='move'?0:hashN(edge*7+w)%3;
  const tile=getTile(theme,kind,w,variant),tw=kind==='big'?TILE:w;
  ctx.save();ctx.beginPath();ctx.rect(x,top,w,bot-top);ctx.clip();
  if(isTop){for(let ty=edge-TILE;ty+TILE>top;ty-=TILE)for(let tx=x;tx<x+w;tx+=tw)ctx.drawImage(tile,tx,ty,tw,TILE);}
  else{for(let ty=edge;ty<bot;ty+=TILE)for(let tx=x;tx<x+w;tx+=tw)ctx.drawImage(tile,tx,ty,tw,TILE);}
  if(kind==='big'){ // sombreado de volumen para muros anchos
    ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(x,top,6,bot-top);ctx.fillRect(x+w-8,top,8,bot-top);
    ctx.fillStyle=rgba(p.light,.25);ctx.fillRect(x+6,top,1.5,bot-top);}
  // rótulo
  // (sin rótulo de texto en los obstáculos)
  // remate
  const cap=getCap(theme,kind,w);
  if(isTop){ctx.save();ctx.translate(0,edge);ctx.scale(1,-1);ctx.drawImage(cap,x,0,w,CAP);ctx.restore();}
  else ctx.drawImage(cap,x,edge,w,CAP);
  ctx.restore();
  // contorno nítido = hitbox
  ctx.strokeStyle=rgba(p.acc,.85);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x+.75,top);ctx.lineTo(x+.75,bot);ctx.moveTo(x+w-.75,top);ctx.lineTo(x+w-.75,bot);ctx.stroke();
  // luces parpadeantes del remate
  const on=Math.sin(t*6+x*.013+edge*.01)>0,ly2=isTop?edge-CAP+9:edge+CAP-9;
  for(const lx2 of [x+6,x+w-6]){ctx.fillStyle=on?(kind==='move'?'#ffc21a':p.trim):darken(p.trim,.65);ctx.beginPath();ctx.arc(lx2,ly2,2.4,0,6.283);ctx.fill();}
  if(on){ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle=rgba(kind==='move'?'#ffc21a':p.trim,.35);for(const lx2 of [x+6,x+w-6]){ctx.beginPath();ctx.arc(lx2,ly2,5.5,0,6.283);ctx.fill();}ctx.restore();}
  // brillo del emisor (pulso)
  const pa=.25+.2*Math.sin(t*5+x*.02);ctx.fillStyle=rgba('#ffffff',pa);ctx.fillRect(x+2,isTop?edge-2.5:edge+.5,w-4,2);
};

// ---------- láser ----------
function emitterSprite(){return cached('emit',()=>{const [c,g]=mk(18,26);
  const gr=g.createLinearGradient(0,0,18,0);gr.addColorStop(0,'#2a2e36');gr.addColorStop(.45,'#9aa3b2');gr.addColorStop(1,'#20242a');g.fillStyle=gr;g.fillRect(0,0,18,26);
  g.fillStyle='#14161a';g.fillRect(0,9,18,3);g.fillRect(0,17,18,2);g.fillStyle='rgba(255,255,255,.35)';g.fillRect(0,12,18,1);
  g.fillStyle='#ff1e3c';g.fillRect(2,0,14,4);glowDot(g,9,2,9,'#ff3050',.9);return c;});}
ART.laser=function(ctx,theme,x,y,w,h,vertical,isTop,t){
  const fl=.78+.22*Math.sin(t*38+x*.07+y*.05);
  if(vertical){
    const top=Math.max(y,-20),bot=Math.min(y+h,740);if(bot<=top)return;
    const edge=isTop?y+h:y,bt=isTop?top:edge+26,bb=isTop?edge-26:bot;
    ctx.save();ctx.globalCompositeOperation='lighter';
    ctx.fillStyle=`rgba(255,30,60,${.16*fl})`;ctx.fillRect(x-5,bt,w+10,bb-bt);
    ctx.fillStyle=`rgba(255,50,80,${.55*fl})`;ctx.fillRect(x+2,bt,w-4,bb-bt);
    ctx.fillStyle=`rgba(255,215,225,${.95*fl})`;ctx.fillRect(x+w/2-2,bt,4,bb-bt);
    ctx.fillStyle='rgba(255,255,255,.55)';
    for(let k=0;k<4;k++){const ph=((t*520+k*140+x)%560)/560;const yy=isTop?bb-ph*(bb-bt):bt+ph*(bb-bt);ctx.fillRect(x+w/2-3,yy-10,6,20);}
    ctx.restore();
    const em=emitterSprite();
    if(isTop){ctx.save();ctx.translate(0,edge);ctx.scale(1,-1);ctx.drawImage(em,x,0,18,26);ctx.restore();}else ctx.drawImage(em,x,edge,18,26);
    // chispas en el emisor
    ctx.fillStyle='rgba(255,220,180,.9)';const sy=isTop?edge-2:edge+2;
    for(let k=0;k<3;k++){const a=t*13+k*2.1+x;ctx.fillRect(x+9+Math.cos(a)*10,sy+(isTop?-1:1)*Math.abs(Math.sin(a*1.7))*8,2,2);}
  }else{
    const left=Math.max(x,-20),right=Math.min(x+w,4000);if(right<=left)return;
    ctx.save();ctx.globalCompositeOperation='lighter';
    ctx.fillStyle=`rgba(255,30,60,${.18*fl})`;ctx.fillRect(left,y-4,right-left,h+8);
    ctx.fillStyle=`rgba(255,50,80,${.6*fl})`;ctx.fillRect(left,y+1.5,right-left,h-3);
    ctx.fillStyle=`rgba(255,220,230,${fl})`;ctx.fillRect(left,y+h/2-1.5,right-left,3);
    ctx.fillStyle='rgba(255,255,255,.5)';for(let k=0;k<5;k++){const ph=((t*700+k*170)%(w+40))-20;ctx.fillRect(x+ph,y+h/2-2.5,24,5);}
    ctx.restore();
  }
};

// ---------- asteroides ----------
function astSprite(theme,v){
  const p=P(theme),R=60,S=R*2.4,[c,g]=mk(S,S),r=rng(theme.length*131+v*7919+11),cx=S/2,cy=S/2;
  const n=16,pts=[];for(let i=0;i<n;i++){const a=i/n*6.283,rad=R*(.8+r()*.2)*(i%2?1:.97);pts.push([cx+Math.cos(a)*rad,cy+Math.sin(a)*rad]);}
  const path=()=>{g.beginPath();g.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<=n;i++){const a=pts[i%n],b=pts[(i+1)%n];g.quadraticCurveTo(a[0],a[1],(a[0]+b[0])/2,(a[1]+b[1])/2);}g.closePath();};
  const [L,M,D]=p.rock;
  // fragmentos de cristal detrás
  if(theme==='storm'||theme==='dark'||theme==='space'){const cc=theme==='dark'?'#ff3a5a':theme==='storm'?'#8ff6ff':'#c48cff';
    for(let k=0;k<3;k++){const a=-2.2+k*1.2+r()*.4,l=R*(1.05+r()*.18);g.save();g.translate(cx,cy);g.rotate(a);
      const cg=g.createLinearGradient(R*.5,0,l,0);cg.addColorStop(0,darken(cc,.4));cg.addColorStop(1,lighten(cc,.5));g.fillStyle=cg;g.beginPath();g.moveTo(R*.55,-9);g.lineTo(l,0);g.lineTo(R*.55,9);g.closePath();g.fill();g.restore();}}
  path();g.save();g.clip();
  const gr=g.createRadialGradient(cx-R*.4,cy-R*.45,R*.1,cx,cy,R*1.15);gr.addColorStop(0,L);gr.addColorStop(.55,M);gr.addColorStop(1,D);g.fillStyle=gr;g.fillRect(0,0,S,S);
  for(let i=0;i<260;i++){g.fillStyle=r()<.5?rgba('#ffffff',.06):rgba('#000000',.1);g.fillRect(cx-R+r()*R*2,cy-R+r()*R*2,1+r()*2.5,1+r()*2);}
  if(theme==='forest'){for(let i=0;i<7;i++){g.fillStyle=rgba('#6fa83a',.35+r()*.25);g.beginPath();g.ellipse(cx-R*.6+r()*R*1.2,cy-R*.7+r()*R*.8,6+r()*14,4+r()*8,r()*3,0,6.283);g.fill();}}
  // cráteres
  const nc=6+Math.floor(r()*4);
  for(let i=0;i<nc;i++){const a=r()*6.283,d=r()*R*.7,x=cx+Math.cos(a)*d,y=cy+Math.sin(a)*d,cr=4+r()*R*.22;
    g.fillStyle=rgba(darken(D,.3),.5);g.beginPath();g.ellipse(x,y,cr,cr*.85,0,0,6.283);g.fill();
    g.strokeStyle=rgba(L,.55);g.lineWidth=1.6;g.beginPath();g.arc(x,y,cr,.2,1.9);g.stroke();
    g.strokeStyle=rgba('#000000',.35);g.beginPath();g.arc(x,y,cr*.9,3.4,5);g.stroke();}
  if(theme==='ice'){for(let k=0;k<6;k++){g.fillStyle=rgba('#ffffff',.18+r()*.25);g.beginPath();const fx=cx-R*.7+r()*R*1.2,fy=cy-R*.7+r()*R*1.2;g.moveTo(fx,fy);g.lineTo(fx+10+r()*20,fy+r()*10);g.lineTo(fx+r()*12,fy+12+r()*16);g.closePath();g.fill();}}
  // terminador (sombra inferior-derecha)
  const sh=g.createRadialGradient(cx-R*.5,cy-R*.5,R*.6,cx-R*.2,cy-R*.2,R*1.6);sh.addColorStop(0,'rgba(0,0,0,0)');sh.addColorStop(1,'rgba(0,0,0,.55)');g.fillStyle=sh;g.fillRect(0,0,S,S);
  if(theme==='lava'){g.lineCap='round';for(let k=0;k<4;k++){let x=cx-R*.6+r()*R*1.2,y=cy-R*.6+r()*R*1.2;g.beginPath();g.moveTo(x,y);for(let s=0;s<5;s++){x+=(r()-.5)*26;y+=(r()-.5)*26;g.lineTo(x,y);}
      g.strokeStyle='rgba(255,80,10,.55)';g.lineWidth=6;g.stroke();g.strokeStyle='#ffc040';g.lineWidth=2;g.stroke();}}
  g.restore();
  path();const rim=g.createLinearGradient(cx-R,cy-R,cx+R,cy+R);rim.addColorStop(0,rgba(lighten(L,.4),.9));rim.addColorStop(.5,rgba(L,.1));rim.addColorStop(1,'rgba(0,0,0,0)');
  g.lineWidth=2.5;g.strokeStyle=rim;g.stroke();g.lineWidth=1.2;g.strokeStyle=rgba('#000000',.6);g.stroke();
  return c;
}
ART.asteroid=function(ctx,theme,x,y,r,seed,t){
  const v=hashN(seed*1000|0)%5,spr=cached(`a|${theme}|${v}`,()=>astSprite(theme,v));
  const S=r/60*144,rot=(hashN(seed*77|0)%628)/100+t*(((hashN(seed*13|0)%200)/100)-1)*.8;
  ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.drawImage(spr,-S/2,-S/2,S,S);ctx.restore();
  if(theme==='lava'){ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle=`rgba(255,90,20,${.06+.04*Math.sin(t*3+seed)})`;ctx.beginPath();ctx.arc(x,y,r*1.15,0,6.283);ctx.fill();ctx.restore();}
};

// ---------- dron enemigo (diseño original "Aguijón") ----------
function droneSprite(theme){
  const p=P(theme),[c,g]=mk(110,90,RES*1.5),cx=55,cy=45;
  const hullA=mix('#3a3f4c',p.hull,.25),hullB=darken(hullA,.55),red='#ff2440';
  g.translate(cx,cy);
  // aletas en flecha hacia atrás
  for(const s of [-1,1]){
    g.beginPath();g.moveTo(-6,8*s);g.lineTo(18,34*s);g.lineTo(30,36*s);g.lineTo(24,22*s);g.lineTo(16,9*s);g.closePath();
    const fg=g.createLinearGradient(0,0,0,36*s);fg.addColorStop(0,lighten(hullA,.25));fg.addColorStop(1,hullB);g.fillStyle=fg;g.fill();
    g.strokeStyle=rgba('#000000',.6);g.lineWidth=1.2;g.stroke();
    g.strokeStyle=red;g.lineWidth=2;g.beginPath();g.moveTo(19,33*s);g.lineTo(29,35*s);g.stroke();
    // cañones
    g.fillStyle='#1a1c22';g.fillRect(-40,12*s-2,30,4);g.fillStyle='#8a90a0';g.fillRect(-40,12*s-2,30,1.2);g.fillStyle=red;g.fillRect(-42,12*s-2.5,3,5);
  }
  // fuselaje en punta de lanza
  g.beginPath();g.moveTo(-38,0);g.lineTo(-14,-14);g.lineTo(16,-13);g.lineTo(28,-6);g.lineTo(28,6);g.lineTo(16,13);g.lineTo(-14,14);g.closePath();
  const bg=g.createLinearGradient(0,-14,0,14);bg.addColorStop(0,lighten(hullA,.35));bg.addColorStop(.45,hullA);bg.addColorStop(1,hullB);g.fillStyle=bg;g.fill();
  g.strokeStyle=rgba('#000000',.7);g.lineWidth=1.3;g.stroke();
  g.strokeStyle=rgba('#ffffff',.18);g.beginPath();g.moveTo(-12,-6);g.lineTo(20,-6);g.moveTo(2,-13);g.lineTo(2,13);g.stroke();
  g.fillStyle=rgba(red,.85);g.fillRect(6,-11,12,2);g.fillRect(6,9,12,2);
  // ojo-sensor
  g.fillStyle='#0b0b0f';g.beginPath();g.arc(-16,0,8,0,6.283);g.fill();glowDot(g,-16,0,14,red,.9);g.fillStyle='#ff8090';g.beginPath();g.arc(-16,0,3.2,0,6.283);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(-17.5,-1.5,1.2,0,6.283);g.fill();
  // tobera
  g.fillStyle='#16181e';g.fillRect(26,-7,6,14);g.fillStyle='#ff7a30';g.fillRect(31,-5,2,10);
  return c;
}
ART.drone=function(ctx,theme,x,y,r,seed,t){
  const spr=cached('d|'+theme,()=>droneSprite(theme)),s=r/24;
  ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(t*3+seed)*.08);ctx.scale(s,s);
  // escape
  ctx.globalCompositeOperation='lighter';const f=.6+.4*Math.sin(t*40+seed);
  ctx.fillStyle=`rgba(255,120,40,${.5*f})`;ctx.beginPath();ctx.moveTo(32,-5);ctx.lineTo(46+f*12,0);ctx.lineTo(32,5);ctx.fill();
  ctx.fillStyle=`rgba(255,40,70,${.12+.08*Math.sin(t*6+seed)})`;ctx.beginPath();ctx.arc(0,0,34,0,6.283);ctx.fill();
  ctx.globalCompositeOperation='source-over';
  ctx.drawImage(spr,-55,-45,110,90);
  ctx.restore();
};

// ---------- disparo enemigo ----------
function boltSprite(){return cached('bolt',()=>{const [c,g]=mk(120,24);
  g.globalCompositeOperation='lighter';
  const og=g.createLinearGradient(0,0,0,24);og.addColorStop(0,'rgba(255,30,60,0)');og.addColorStop(.5,'rgba(255,30,60,.55)');og.addColorStop(1,'rgba(255,30,60,0)');
  g.fillStyle=og;rrp(g,2,2,116,20,10);g.fill();
  g.fillStyle='rgba(255,70,90,.9)';rrp(g,6,7,108,10,5);g.fill();
  const cg=g.createLinearGradient(0,0,120,0);cg.addColorStop(0,'rgba(255,255,255,1)');cg.addColorStop(.7,'rgba(255,220,230,.9)');cg.addColorStop(1,'rgba(255,120,140,0)');
  g.fillStyle=cg;rrp(g,8,10,104,4,2);g.fill();return c;});}
ART.bolt=function(ctx,x,y,len,t){const s=boltSprite();ctx.drawImage(s,x-len/2,y-12,len,24);};

// ---------- torreta decorativa ----------
function turretSprite(theme){const p=P(theme),[c,g]=mk(48,40);
  g.fillStyle=darken(p.hull,.3);g.fillRect(6,0,36,8);g.fillStyle=rgba(p.light,.5);g.fillRect(6,7,36,1.2);
  const dg=g.createRadialGradient(20,10,2,24,12,18);dg.addColorStop(0,lighten(p.light,.3));dg.addColorStop(1,darken(p.hull,.4));g.fillStyle=dg;
  g.beginPath();g.arc(24,8,14,0,Math.PI);g.fill();g.strokeStyle=rgba('#000000',.6);g.lineWidth=1.2;g.stroke();
  g.fillStyle='#22252c';g.fillRect(0,14,22,6);g.fillStyle='#8a92a2';g.fillRect(0,14,22,1.4);g.fillStyle='#ff2a40';g.fillRect(0,13.5,3,7);
  g.fillStyle=p.acc;g.fillRect(26,14,6,3);return c;}
ART.turret=function(ctx,theme,x,y,isTop,t){const s=cached('tu|'+theme,()=>turretSprite(theme));
  ctx.save();ctx.translate(x,y);if(!isTop)ctx.scale(1,-1);ctx.drawImage(s,-24,0,48,40);
  const ph=(t*1.3+x*.003)%1;if(ph<.12){ctx.globalCompositeOperation='lighter';ctx.fillStyle=`rgba(255,80,90,${1-ph/.12})`;ctx.beginPath();ctx.arc(-25,17,8,0,6.283);ctx.fill();}
  ctx.restore();};

// ---------- portal de gravedad ----------
ART.portal=function(ctx,x,used,t){
  const a=used?.28:1;ctx.save();ctx.globalCompositeOperation='lighter';
  const bg=ctx.createLinearGradient(x-40,0,x+40,0);bg.addColorStop(0,'rgba(255,220,60,0)');bg.addColorStop(.5,`rgba(255,220,60,${.18*a})`);bg.addColorStop(1,'rgba(160,80,255,0)');ctx.fillStyle=bg;ctx.fillRect(x-40,0,80,720);
  for(let i=0;i<3;i++){const ry=200-i*28,rx=22+8*Math.sin(t*3+i*2);ctx.strokeStyle=i===1?`rgba(190,90,255,${.8*a})`:`rgba(255,220,70,${.85*a})`;ctx.lineWidth=5-i;ctx.beginPath();ctx.ellipse(x,360,rx,ry,0,0,6.283);ctx.stroke();}
  ctx.fillStyle=`rgba(255,240,180,${.9*a})`;for(let k=0;k<18;k++){const ang=t*2.2+k*.35;ctx.fillRect(x+Math.cos(ang)*24-1.5,360+Math.sin(ang)*200-1.5,3,3);}
  ctx.globalCompositeOperation='source-over';
  if(!used){ctx.font=`900 46px ${FONT}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=6;ctx.strokeStyle='#2a0838';ctx.strokeText('⇅',x,360);ctx.fillStyle='#ffe94a';ctx.fillText('⇅',x,360);
    ctx.font=`800 15px ${FONT}`;ctx.lineWidth=4;ctx.strokeStyle='#000';ctx.strokeText('GRAVEDAD',x,590);ctx.fillStyle='#ffe94a';ctx.fillText('GRAVEDAD',x,590);}
  ctx.restore();
};
// ---------- recogibles ----------
function gemSprite(){return cached('gem',()=>{const [c,g]=mk(48,48);glowDot(g,24,24,22,'#40f0ff',.45);
  const pts=[[24,8],[34,20],[24,40],[14,20]];g.beginPath();pts.forEach((q,i)=>i?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]));g.closePath();
  const gg=g.createLinearGradient(14,8,34,40);gg.addColorStop(0,'#e8ffff');gg.addColorStop(.5,'#40e0ff');gg.addColorStop(1,'#1060b0');g.fillStyle=gg;g.fill();
  g.fillStyle='rgba(255,255,255,.55)';g.beginPath();g.moveTo(24,8);g.lineTo(34,20);g.lineTo(24,20);g.closePath();g.fill();
  g.fillStyle='rgba(0,40,90,.35)';g.beginPath();g.moveTo(24,20);g.lineTo(34,20);g.lineTo(24,40);g.closePath();g.fill();
  g.strokeStyle='#ffffff';g.lineWidth=1.4;g.beginPath();pts.forEach((q,i)=>i?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]));g.closePath();g.stroke();return c;});}
ART.gem=function(ctx,x,y,t){const s=gemSprite(),k=1+Math.sin(t*5+x*.05)*.1,sx=Math.cos(t*3+x*.01)*.35+.65;
  ctx.save();ctx.translate(x,y+Math.sin(t*4+x)*2);ctx.scale(sx*k,k);ctx.drawImage(s,-24,-24,48,48);ctx.restore();
  const tw=(t*2+x*.003)%1;if(tw<.15){ctx.fillStyle=`rgba(255,255,255,${1-tw/.15})`;ctx.fillRect(x+6,y-12,2,8);ctx.fillRect(x+3,y-9,8,2);}};
function starSprite(blue){return cached('star'+(blue?'b':''),()=>{const [c,g]=mk(72,72);const col=blue?'#7fb2ff':'#ffd23f';glowDot(g,36,36,34,col,.6);
  const sp=(R,r)=>{g.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rad=i%2?r:R;g.lineTo(36+Math.cos(a)*rad,36+Math.sin(a)*rad);}g.closePath();};
  sp(22,10);const gg=g.createLinearGradient(20,14,52,58);gg.addColorStop(0,blue?'#e6f0ff':'#fff6c0');gg.addColorStop(.5,col);gg.addColorStop(1,blue?'#2a4aa0':'#c06a00');g.fillStyle=gg;g.fill();
  g.lineWidth=2.4;g.strokeStyle='#ffffff';g.stroke();
  g.save();sp(22,10);g.clip();g.fillStyle='rgba(255,255,255,.35)';g.beginPath();g.moveTo(36,14);g.lineTo(58,36);g.lineTo(36,36);g.closePath();g.fill();g.fillStyle='rgba(0,0,0,.18)';g.beginPath();g.moveTo(36,36);g.lineTo(36,60);g.lineTo(14,36);g.closePath();g.fill();g.restore();return c;});}
ART.star=function(ctx,x,y,t,before){const s=starSprite(before),k=1+Math.sin(t*4)*.08;ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(t*2)*.18);ctx.scale(k,k);ctx.drawImage(s,-36,-36,72,72);ctx.restore();
  ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle=before?'rgba(120,170,255,.35)':'rgba(255,220,80,.35)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,30+6*Math.sin(t*3),0,6.283);ctx.stroke();ctx.restore();};
// ---------- meta ----------
function pylonSprite(){return cached('pylon',()=>{const [c,g]=mk(60,120);const gr=g.createLinearGradient(0,0,60,0);gr.addColorStop(0,'#1c2028');gr.addColorStop(.45,'#a8b2c4');gr.addColorStop(1,'#14171d');
  g.fillStyle=gr;g.beginPath();g.moveTo(8,0);g.lineTo(52,0);g.lineTo(44,110);g.lineTo(16,110);g.closePath();g.fill();
  g.fillStyle='#0c0e12';g.fillRect(14,20,32,6);g.fillRect(16,50,28,6);g.fillStyle='#3cff8a';g.fillRect(18,104,24,6);glowDot(g,30,110,22,'#3cff8a',.8);return c;});}
ART.finish=function(ctx,x,t){
  if(x<-120||x>4000)return;const py=pylonSprite();
  ctx.save();ctx.globalCompositeOperation='lighter';
  const cg=ctx.createLinearGradient(x-30,0,x+30,0);cg.addColorStop(0,'rgba(60,255,140,0)');cg.addColorStop(.5,'rgba(60,255,140,.35)');cg.addColorStop(1,'rgba(60,255,140,0)');ctx.fillStyle=cg;ctx.fillRect(x-30,0,60,720);
  ctx.fillStyle='rgba(200,255,220,.5)';for(let k=0;k<7;k++){const yy=((t*240+k*110)%720);ctx.fillRect(x-22,yy,44,2);}
  for(let i=0;i<24;i++){ctx.fillStyle=(i+Math.floor(t*4))%2?'rgba(255,255,255,.18)':'rgba(60,255,140,.12)';ctx.fillRect(x-8,i*30,16,30);}
  ctx.restore();
  ctx.drawImage(py,x-30,-6,60,120);ctx.save();ctx.translate(x,726);ctx.scale(1,-1);ctx.drawImage(py,-30,0,60,120);ctx.restore();
  ctx.font=`900 30px ${FONT}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=6;ctx.strokeStyle='#002a12';ctx.strokeText('META',x,150);ctx.fillStyle='#7dffb0';ctx.fillText('META',x,150);
};

// ---------- naves del jugador (diseños originales, alto detalle) ----------
const SHIP_FLAMES=[[[-30,0,6]],[[-27,-4,4],[-27,4,4]],[[-36,-20,6],[-36,20,6],[-29,0,4]],[[-29,0,6]],[[-31,-6,4],[-31,6,4]]];
const SHIP_FLAME_COL=[['#ffffff','#7fe8ff','#2a8cff'],['#ffffff','#e0a0ff','#8a3cff'],['#ffffff','#ffd27a','#ff7a1a'],['#ffffff','#ffe066','#ff3b1f'],['#eaffef','#39ff88','#00a050']];
function poly(g,pts){g.beginPath();pts.forEach((q,i)=>i?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]));g.closePath();}
function vgrad(g,y0,y1,stops){const gr=g.createLinearGradient(0,y0,0,y1);stops.forEach((c,i)=>gr.addColorStop(i/(stops.length-1),c));return gr;}
function piece(g,pts,fill,edge,lw){poly(g,pts);g.fillStyle=fill;g.fill();if(edge){g.lineWidth=lw||1.1;g.strokeStyle=edge;g.stroke();}}
function lines(g,col,w,segs){g.strokeStyle=col;g.lineWidth=w;g.beginPath();for(const s of segs){g.moveTo(s[0],s[1]);g.lineTo(s[2],s[3]);}g.stroke();}
function nozzle(g,x,y,rx,ry,glow){ // tobera vista de lado: anillo + interior incandescente
  g.fillStyle='#14161c';g.beginPath();g.ellipse(x,y,rx+1.5,ry+1.5,0,0,6.283);g.fill();
  const ng=g.createRadialGradient(x-rx*.3,y,0,x,y,ry);ng.addColorStop(0,'#ffffff');ng.addColorStop(.35,glow);ng.addColorStop(1,darken(glow,.6));g.fillStyle=ng;g.beginPath();g.ellipse(x,y,rx,ry,0,0,6.283);g.fill();
  g.strokeStyle='rgba(255,255,255,.35)';g.lineWidth=.7;g.beginPath();g.ellipse(x,y,rx+1.5,ry+1.5,0,-1.6,-.2);g.stroke();}
function cockpit(g,pts,c1,c2){poly(g,pts);const b=pts.reduce((a,p)=>[Math.min(a[0],p[1]),Math.max(a[1],p[1])],[1e9,-1e9]);g.fillStyle=vgrad(g,b[0],b[1],[c1,c2,darken(c2,.5)]);g.fill();
  g.lineWidth=1.3;g.strokeStyle='#0d1018';g.stroke();
  g.save();g.clip();g.fillStyle='rgba(255,255,255,.75)';const x0=pts[0][0];g.beginPath();g.moveTo(x0-3,b[0]+1);g.lineTo(x0-16,b[0]+1);g.lineTo(x0-18,b[0]+3.2);g.lineTo(x0-5,b[0]+3);g.fill();
  g.fillStyle='rgba(255,255,255,.25)';g.fillRect(x0-26,b[1]-2.2,14,1.2);g.restore();}
function shade(g,pts,cx,cy,r){g.save();poly(g,pts);g.clip();const sg=g.createRadialGradient(cx,cy,0,cx,cy,r);sg.addColorStop(0,'rgba(0,0,0,.35)');sg.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=sg;g.fillRect(cx-r,cy-r,r*2,r*2);g.restore();}
function rimTop(g,pts,col){g.save();poly(g,pts);g.clip();g.strokeStyle=col;g.lineWidth=2.2;poly(g,pts.map(p=>[p[0],p[1]+1.2]));g.stroke();g.restore();}
function drawShipBody(g,type){
  g.lineJoin='round';g.lineCap='round';
  if(type===0){ // COMETA — interceptor ligero, blanco/azul con franjas naranjas
    for(const s of [1,-1]){ // ala trasera (s=1 inferior, s=-1 superior)
      const W=[[4,7*s],[-12,27*s],[-25,30*s],[-28,27*s],[-19,7*s]];
      piece(g,W,vgrad(g,7*s,30*s,['#e4ebf5','#9aa8c0','#5a6680']),'#1c2436',1.1);
      shade(g,W,-8,7*s,14);
      piece(g,[[-13,26*s],[-25,30*s],[-28,27*s],[-17,24*s]],'#ff6a1a');
      lines(g,'rgba(28,36,54,.45)',.7,[[-6,12*s,-20,12*s],[-10,19*s,-22,19*s]]);
      // cañón de punta de ala
      g.fillStyle='#232834';g.fillRect(-16,26.5*s-1.3,30,2.6);g.fillStyle='#8a94a8';g.fillRect(-16,26.5*s-1.3,30,.8);g.fillStyle='#4fd8ff';g.fillRect(13,26.5*s-1.6,2.4,3.2);
    }
    const B=[[38,0],[22,-5],[10,-9.5],[-18,-9],[-26,-5.5],[-26,5.5],[-18,9],[10,9.5],[22,5]];
    piece(g,B,vgrad(g,-10,10,['#ffffff','#e8eef7','#b8c4d8','#6c7890']),'#1c2436',1.3);
    rimTop(g,B,'rgba(255,255,255,.9)');
    lines(g,'rgba(28,36,54,.5)',.75,[[-4,-9.2,-4,9.2],[-14,-9,-14,9],[22,-5,22,5],[-26,0,-14,0]]);
    piece(g,[[30,-1.2],[-18,-4.6],[-18,-2.6],[30,.2]],'#ff6a1a');
    piece(g,[[28,1.6],[-18,3.4],[-18,4.6],[28,2.6]],'#2a8cff');
    g.fillStyle='#1c2230';g.fillRect(-4,5,10,3);g.fillStyle='#4a5468';for(let i=0;i<4;i++)g.fillRect(-3+i*2.5,5.5,1.2,2);
    cockpit(g,[[20,-4],[14,-9],[0,-9.6],[-4,-6],[4,-3.5]],'#d8fdff','#1890c8');
    nozzle(g,-27,0,2.6,5.5,'#7fe8ff');
    g.fillStyle='#ff3b3b';g.beginPath();g.arc(-27,-29,1.4,0,6.283);g.fill();g.fillStyle='#3bff7a';g.beginPath();g.arc(-27,29,1.4,0,6.283);g.fill();
  }else if(type===1){ // MANTARRAYA — ala volante orgánica
    const Wg=[[36,0],[18,-6],[4,-16],[-6,-33],[-13,-34],[-14,-24],[-22,-12],[-30,-6],[-24,0],[-30,6],[-22,12],[-14,24],[-13,34],[-6,33],[4,16],[18,6]];
    piece(g,Wg,vgrad(g,-34,34,['#dcc4ff','#8a54e0','#4a2296','#2a0e5c','#4a2296','#8a54e0','#dcc4ff']),'#160830',1.4);
    shade(g,Wg,-18,0,20);
    // venas bioluminiscentes
    g.strokeStyle='rgba(127,246,255,.9)';g.lineWidth=1.3;for(const s of [-1,1]){g.beginPath();g.moveTo(24,2*s);g.bezierCurveTo(8,6*s,0,14*s,-8,30*s);g.stroke();g.beginPath();g.moveTo(12,4*s);g.bezierCurveTo(0,8*s,-10,12*s,-20,11*s);g.stroke();}
    g.strokeStyle='rgba(127,246,255,.35)';g.lineWidth=3;for(const s of [-1,1]){g.beginPath();g.moveTo(24,2*s);g.bezierCurveTo(8,6*s,0,14*s,-8,30*s);g.stroke();}
    // lomo central
    const S=[[34,0],[16,-4.5],[-20,-3.5],[-26,0],[-20,3.5],[16,4.5]];piece(g,S,vgrad(g,-5,5,['#f0e4ff','#a07ae0','#4a2a8a']),'#160830',1);
    rimTop(g,Wg,'rgba(255,240,255,.55)');
    for(const s of [-1,1]){glowDot(g,-10,32*s,6,'#7ff6ff',.95);g.fillStyle='#ffffff';g.beginPath();g.arc(-10,32*s,1.3,0,6.283);g.fill();}
    // aguijones de cola
    for(const s of [-1,1])piece(g,[[-24,3*s],[-34,7*s],[-25,5.5*s]],'#3a1a70','#160830',.8);
    cockpit(g,[[22,-1],[16,-4.8],[4,-5],[2,-1.5],[8,0]],'#ffe0ff','#c8209c');
    nozzle(g,-25,-4,1.8,2.6,'#e0a0ff');nozzle(g,-25,4,1.8,2.6,'#e0a0ff');
  }else if(type===2){ // TORTUGA BLINDADA — carguero pesado, casco cuadrado y góndolas laterales
    for(const s of [-1,1]){
      const py=s<0?-27:17,pod=[[6,py],[-30,py],[-34,py+3],[-34,py+7],[-30,py+10],[6,py+10],[9,py+5]];
      // soporte
      piece(g,[[-6,s<0?-17:11],[-16,s<0?-17:11],[-18,s<0?-14:14],[-4,s<0?-14:14]].map(p=>p),'#3a4232','#141a10',.8);
      g.fillStyle='#262c20';g.fillRect(-15,s<0?-18:13,10,5);
      piece(g,pod,vgrad(g,py,py+10,['#c8d2b6','#8e9a74','#4a543c']),'#141a10',1.1);
      lines(g,'rgba(20,26,16,.55)',.7,[[-8,py,-8,py+10],[-20,py,-20,py+10]]);
      // contenedor de carga
      g.fillStyle='#b8541c';g.fillRect(-19,py+2,10,6);g.fillStyle='rgba(255,255,255,.3)';g.fillRect(-19,py+2,10,1);g.fillStyle='rgba(0,0,0,.35)';g.fillRect(-16,py+2,.8,6);g.fillRect(-12.5,py+2,.8,6);
      g.fillStyle='#ffb000';g.fillRect(1,py+3.5,5,3);
      nozzle(g,-34.5,py+5,2.6,4.6,'#ffd27a');
    }
    const Hl=[[30,-9],[26,-15],[-22,-15],[-28,-10],[-28,10],[-22,15],[26,15],[30,9]];
    piece(g,Hl,vgrad(g,-15,15,['#d6dfc4','#a4b088','#7a865e','#454e36']),'#141a10',1.5);
    rimTop(g,Hl,'rgba(255,255,240,.7)');
    // placas de blindaje superpuestas
    for(const [x0,x1] of [[-22,-9],[-7,8],[10,24]]){g.fillStyle='rgba(255,255,240,.08)';g.fillRect(x0,-13,x1-x0,11);g.strokeStyle='rgba(20,26,16,.6)';g.lineWidth=.8;g.strokeRect(x0,-13,x1-x0,11);
      g.fillStyle='rgba(20,26,16,.75)';for(const xx of [x0+2,x1-2])for(const yy of [-11,-4]){g.beginPath();g.arc(xx,yy,.9,0,6.283);g.fill();}}
    g.save();poly(g,Hl);g.clip();g.fillStyle='#16160f';g.fillRect(-28,1,58,5);g.fillStyle='#ffb000';for(let xx=-30;xx<32;xx+=7){g.beginPath();g.moveTo(xx,6);g.lineTo(xx+3.5,1);g.lineTo(xx+7,1);g.lineTo(xx+3.5,6);g.fill();}
    g.fillStyle='rgba(0,0,0,.25)';g.fillRect(-28,8,58,7);g.restore();
    // rejillas
    g.fillStyle='#1a1e16';for(let i=0;i<5;i++)g.fillRect(-20+i*4,9.5,2.2,4);
    // ariete frontal + faros
    piece(g,[[34,-7],[30,-10],[30,10],[34,7]],'#2b2f28','#0c0e0a',.8);
    glowDot(g,34,-4,6,'#fff2b0',.95);glowDot(g,34,4,6,'#fff2b0',.95);
    cockpit(g,[[27,-9],[24,-14],[12,-14],[11,-9]],'#e0fcff','#1a7aa8');
    // antena-radar
    g.strokeStyle='#d0dac0';g.lineWidth=1.1;g.beginPath();g.moveTo(-12,-15);g.lineTo(-15,-22);g.stroke();
    g.fillStyle='#c8d2b6';g.beginPath();g.ellipse(-15,-23,4,1.6,-.4,0,6.283);g.fill();g.fillStyle='#ff3b3b';g.beginPath();g.arc(-15,-23,1,0,6.283);g.fill();
    nozzle(g,-29,0,2,4,'#ffd27a');
  }else if(type===3){ // FÉNIX — alas de plumas en tres capas
    for(const s of [1,-1]){
      const tiers=[[[2,7],[-10,32],[-15,24],[-20,35],[-24,22],[-31,28],[-24,8]],[[0,7],[-8,24],[-13,18],[-18,27],[-21,16],[-26,19],[-21,7]],[[-2,6],[-7,16],[-11,12],[-15,18],[-18,10],[-20,6]]];
      const cols=[['#ffe066','#ff8a1a','#c42a0c'],['#fff0a0','#ffb020','#e0400c'],['#ffffff','#ffd060','#ff7a1a']];
      tiers.forEach((tp,i)=>{const pts=tp.map(p=>[p[0],p[1]*s]);piece(g,pts,vgrad(g,6*s,34*s,cols[i]),'#5a1006',.9);});
      lines(g,'rgba(255,250,200,.7)',.7,[[-2,9*s,-12,24*s],[-8,8*s,-20,22*s],[-14,8*s,-27,22*s]]);
    }
    // plumas de cola
    for(const dy of [-5,0,5])piece(g,[[-20,dy*.6],[-34,dy*1.6],[-30,dy*1.6+(dy>=0?2:-2)]],'#ff6a1a','#5a1006',.7);
    const B=[[38,0],[24,-4],[8,-8.5],[-20,-6.5],[-26,0],[-20,6.5],[8,8.5],[24,4]];
    piece(g,B,vgrad(g,-9,9,['#fffbd0','#ffc030','#e05a14','#7a1a06']),'#4a0c04',1.3);rimTop(g,B,'rgba(255,255,230,.9)');
    piece(g,[[36,0],[26,-2],[26,2]],'#7a1a06');
    // núcleo de fuego
    glowDot(g,-6,0,9,'#ffe066',.9);g.fillStyle='#fff7d0';g.beginPath();g.arc(-6,0,2.2,0,6.283);g.fill();
    lines(g,'rgba(90,16,6,.45)',.7,[[2,-8,2,8],[-14,-7,-14,7]]);
    cockpit(g,[[22,-2],[17,-6.5],[5,-7],[3,-3],[10,-1.5]],'#fffbe0','#e08a10');
    nozzle(g,-27,0,2.6,5,'#ffe066');
  }else{ // SOMBRA — sigiloso facetado con filos de neón
    const B=[[40,0],[2,-11],[-20,-28],[-24,-27],[-16,-9],[-30,-6],[-30,6],[-16,9],[-24,27],[-20,28],[2,11]];
    poly(g,B);g.fillStyle='#14161c';g.fill();
    // facetas (tonos planos)
    piece(g,[[40,0],[2,-11],[6,0]],'#3a3f4c');piece(g,[[40,0],[6,0],[2,11]],'#1a1c24');
    piece(g,[[2,-11],[-20,-28],[-24,-27],[-16,-9]],'#2c303a');piece(g,[[2,-11],[-16,-9],[-6,-2],[6,0]],'#242832');
    piece(g,[[2,11],[-20,28],[-24,27],[-16,9]],'#101218');piece(g,[[2,11],[-16,9],[-6,2],[6,0]],'#181a22');
    piece(g,[[-6,-2],[-16,-9],[-30,-6],[-30,0]],'#20232c');piece(g,[[-6,2],[-16,9],[-30,6],[-30,0]],'#121419');
    poly(g,B);g.strokeStyle='#39ff88';g.lineWidth=1.5;g.stroke();
    g.strokeStyle='rgba(57,255,136,.3)';g.lineWidth=3.5;g.stroke();
    lines(g,'rgba(57,255,136,.55)',.8,[[30,0,-28,0],[2,-11,-6,-2],[2,11,-6,2]]);
    // visor
    piece(g,[[22,-1.5],[8,-3.6],[6,-1.2],[20,0]],'#ff2050');glowDot(g,14,-1.8,9,'#ff2050',.55);
    g.fillStyle='#ff2050';g.fillRect(-22,-26,2,2);g.fillRect(-22,24,2,2);
    nozzle(g,-30,-3.5,1.6,2.6,'#39ff88');nozzle(g,-30,3.5,1.6,2.6,'#39ff88');
  }
}
function shipSprite(type,res){const [c,g]=mk(100,80,res);g.translate(50,40);
  g.save();g.translate(1.6,2.6);drawShipBody(g,type);g.restore();
  g.globalCompositeOperation='source-in';g.fillStyle='rgba(0,0,0,.4)';g.fillRect(-50,-40,100,80);
  g.globalCompositeOperation='source-over';drawShipBody(g,type);return c;}
ART.ship=function(ctx,type,x,y,rot,gdir,thrust,scale,t){
  type=Math.max(0,Math.min(4,type|0));scale=scale||1;
  const res=scale>2.2?9:scale>1.3?5:3,spr=cached(`s|${type}|${res}`,()=>shipSprite(type,res));
  ctx.save();ctx.translate(x,y);ctx.rotate(rot||0);ctx.scale(scale,scale*(gdir<0?-1:1));
  const cols=SHIP_FLAME_COL[type];
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(const [fx,fy,fw] of SHIP_FLAMES[type]){
    const L=(thrust?24+Math.sin(t*60+fy)*5+((t*97+fy)%1)*8:8+Math.sin(t*30+fy)*2)*(fw/6+.4);
    const fg=ctx.createLinearGradient(fx,0,fx-L,0);fg.addColorStop(0,cols[0]);fg.addColorStop(.22,cols[1]);fg.addColorStop(.6,rgba(cols[2],.6));fg.addColorStop(1,rgba(cols[2],0));
    ctx.fillStyle=fg;ctx.beginPath();ctx.moveTo(fx+1,fy-fw);ctx.quadraticCurveTo(fx-L*.45,fy-fw*.55,fx-L,fy);ctx.quadraticCurveTo(fx-L*.45,fy+fw*.55,fx+1,fy+fw);ctx.fill();
    ctx.fillStyle=rgba(cols[1],thrust?.32:.16);ctx.beginPath();ctx.arc(fx,fy,fw*(thrust?1.5:1.1),0,6.283);ctx.fill();
  }
  ctx.restore();
  ctx.drawImage(spr,-50,-40,100,80);
  ctx.restore();
};
// ---------- naves de fondo para batallas ambientales ----------
function npcSprite(kind){
  if(kind==='cruiser'){ // crucero capital alargado (perfil lateral), escalonado, NO en cuña
    const [c,g]=mk(620,170,2);g.translate(10,85);g.lineJoin='round';
    const hull=[[600,-6],[588,-18],[520,-22],[470,-30],[300,-30],[270,-44],[150,-44],[130,-30],[40,-30],[20,-22],[0,-20],[0,22],[20,26],[60,34],[420,34],[520,24],[590,14],[600,6]];
    piece(g,hull,vgrad(g,-44,34,['#9aa4b8','#6a7488','#3e4656','#1e232c']),'#0c0e14',2);
    // puente/torre
    piece(g,[[250,-44],[240,-64],[200,-68],[178,-60],[170,-44]],vgrad(g,-68,-44,['#b0bacb','#5a6476']),'#0c0e14',1.5);
    piece(g,[[226,-66],[222,-82],[212,-82],[208,-66]],'#4a5262','#0c0e14',1);
    g.strokeStyle='#8a94a8';g.lineWidth=1.5;g.beginPath();g.moveTo(216,-82);g.lineTo(216,-96);g.moveTo(200,-68);g.lineTo(196,-88);g.stroke();
    g.fillStyle='#ff3b3b';g.fillRect(214.5,-98,3,3);
    // espina y anillos
    for(let x=60;x<480;x+=36){g.fillStyle='rgba(0,0,0,.35)';g.fillRect(x,-30,3,64);g.fillStyle='rgba(255,255,255,.12)';g.fillRect(x+3,-30,1.5,64);}
    g.fillStyle='rgba(255,255,255,.18)';g.fillRect(20,-27,560,2);
    // hangar
    g.fillStyle='#0a0c12';g.fillRect(300,6,90,18);glowDot(g,345,15,40,'#6fd0ff',.35);g.fillStyle='rgba(120,210,255,.6)';g.fillRect(302,22,86,2);
    // ventanas
    g.fillStyle='rgba(255,230,160,.85)';const r=rng(99);for(let i=0;i<140;i++){const x=40+r()*520,y=-24+r()*50;if(x>300&&x<390&&y>4)continue;g.fillRect(x,y,2.4,1.4);}
    // torretas
    for(const tx of [90,140,420,480]){g.fillStyle='#525a6a';g.beginPath();g.arc(tx,-30,7,Math.PI,0);g.fill();g.fillStyle='#2a2f38';g.fillRect(tx-14,-35,14,2.5);}
    // banco de motores (a la izquierda)
    for(const ey of [-16,0,16]){nozzle(g,-1,ey,4,6,'#6fc8ff');}
    // franja de color
    g.fillStyle='#c0303a';g.fillRect(470,-10,120,5);g.fillRect(40,10,60,4);
    return c;}
  const [c,g]=mk(80,60,4);g.translate(40,30);g.lineJoin='round';
  if(kind==='fighter'){ // caza de doble viga, mira a la derecha
    for(const s of [-1,1]){piece(g,[[18,9*s],[-14,9*s],[-20,13*s],[-20,17*s],[16,15*s]],vgrad(g,9*s,17*s,['#a8b0c0','#4a5262']),'#0c0e14',.8);g.fillStyle='#d8343a';g.fillRect(-6,12*s-1,14,2);}
    piece(g,[[22,0],[10,-6],[-12,-5],[-16,0],[-12,5],[10,6]],vgrad(g,-6,6,['#d0d6e2','#7a8496','#3a4250']),'#0c0e14',1);
    cockpit(g,[[14,-1],[9,-5],[1,-5],[0,-1.5]],'#d0f4ff','#2878a8');
    nozzle(g,-21,-15,1.4,2.2,'#ffb050');nozzle(g,-21,15,1.4,2.2,'#ffb050');
  }else{ // interceptor esbelto
    piece(g,[[30,0],[6,-5],[-18,-4],[-22,0],[-18,4],[6,5]],vgrad(g,-5,5,['#cfe4ff','#5a7ab0','#243a60']),'#0a1222',1);
    for(const s of [-1,1])piece(g,[[2,4*s],[-14,18*s],[-20,18*s],[-14,4*s]],vgrad(g,4*s,18*s,['#8ab0e0','#2a4a7a']),'#0a1222',.8);
    g.fillStyle='#ffd23f';g.fillRect(-4,-1,20,2);
    cockpit(g,[[18,-1],[12,-4.5],[4,-4.5],[3,-1]],'#e8fbff','#1a6aa8');
    nozzle(g,-22,0,1.6,3,'#7fe8ff');
  }
  return c;
}
ART.npcShip=function(ctx,kind,x,y,scale,t){ // scale<0 => mira a la izquierda
  const spr=cached('n|'+kind,()=>npcSprite(kind)),big=kind==='cruiser',w=big?620:80,h=big?170:60,ox=big?10:40,oy=big?85:30;
  ctx.save();ctx.translate(x,y);ctx.scale(scale,Math.abs(scale));
  ctx.save();ctx.globalCompositeOperation='lighter';
  if(big){for(const ey of [-16,0,16]){const L=40+Math.sin(t*20+ey)*6;const fg=ctx.createLinearGradient(-ox,0,-ox-L,0);fg.addColorStop(0,'rgba(180,230,255,.9)');fg.addColorStop(1,'rgba(60,140,255,0)');ctx.fillStyle=fg;ctx.beginPath();ctx.moveTo(-ox+2,ey-6);ctx.lineTo(-ox-L,ey);ctx.lineTo(-ox+2,ey+6);ctx.fill();}}
  else{const ex=kind==='fighter'?[[-21,-15],[-21,15]]:[[-22,0]],col=kind==='fighter'?'255,170,80':'127,232,255';for(const [fx,fy] of ex){const L=10+Math.sin(t*50+fy)*3;ctx.fillStyle=`rgba(${col},.8)`;ctx.beginPath();ctx.moveTo(fx,fy-2);ctx.lineTo(fx-L,fy);ctx.lineTo(fx,fy+2);ctx.fill();}}
  ctx.restore();
  ctx.drawImage(spr,-ox,-oy,w,h);
  if(big){const on=Math.sin(t*4)>0;if(on){ctx.fillStyle='#ff4040';ctx.fillRect(-ox+214,-oy+85-98,3,3);}}
  ctx.restore();
};

// ---------- explosión ----------
ART.explosion=function(ctx,x,y,age,seed){
  if(age<0||age>1)return;const r=rng((seed|0)+7);
  ctx.save();
  // humo
  if(age>.2){for(let i=0;i<7;i++){const a=r()*6.283,d=(20+r()*50)*age;ctx.fillStyle=`rgba(40,36,44,${.35*(1-age)})`;ctx.beginPath();ctx.arc(x+Math.cos(a)*d,y+Math.sin(a)*d-age*20,10+age*30*r(),0,6.283);ctx.fill();}}
  ctx.globalCompositeOperation='lighter';
  if(age<.18){const fa=1-age/.18;ctx.fillStyle=`rgba(255,255,240,${fa})`;ctx.beginPath();ctx.arc(x,y,30+age*260,0,6.283);ctx.fill();}
  const fr=18+Math.sqrt(age)*70,fb=ctx.createRadialGradient(x,y,0,x,y,fr);
  fb.addColorStop(0,`rgba(255,255,220,${1-age})`);fb.addColorStop(.3,`rgba(255,200,60,${(1-age)*.9})`);fb.addColorStop(.65,`rgba(255,80,20,${(1-age)*.6})`);fb.addColorStop(1,'rgba(120,20,10,0)');
  ctx.fillStyle=fb;ctx.beginPath();ctx.arc(x,y,fr,0,6.283);ctx.fill();
  ctx.strokeStyle=`rgba(170,220,255,${(1-age)*.85})`;ctx.lineWidth=Math.max(.5,7*(1-age));ctx.beginPath();ctx.arc(x,y,24+age*230,0,6.283);ctx.stroke();
  ctx.globalCompositeOperation='source-over';
  for(let i=0;i<16;i++){const a=r()*6.283,sp=120+r()*260,d=sp*age,rot=r()*6+age*10*(r()-.5);
    ctx.save();ctx.translate(x+Math.cos(a)*d,y+Math.sin(a)*d+age*age*60);ctx.rotate(rot);ctx.globalAlpha=1-age;
    ctx.fillStyle=i%3?'#9aa3b4':'#ffb040';ctx.fillRect(-3-r()*3,-1.5,6+r()*6,3);ctx.restore();}
  ctx.globalAlpha=1;
  ctx.globalCompositeOperation='lighter';for(let i=0;i<14;i++){const a=r()*6.283,d=(60+r()*200)*age;ctx.fillStyle=`rgba(255,${150+r()*100|0},60,${1-age})`;ctx.fillRect(x+Math.cos(a)*d,y+Math.sin(a)*d,2.5,2.5);}
  ctx.restore();
};
ART.SHIP_NAMES=['Cometa','Mantarraya','Tortuga Blindada','Fénix','Sombra'];
window.ART=ART;
})();
