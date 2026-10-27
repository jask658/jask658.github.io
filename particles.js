/* Original procedural point-cloud illustrations. No third-party models or project evidence. */
(() => {
 'use strict';
 const canvas=document.getElementById('particles');
 const ctx=canvas.getContext('2d');
 if(!ctx)return;
 const media=matchMedia('(prefers-reduced-motion: reduce)');
 let width=innerWidth,height=innerHeight,form=document.body.dataset.form||'butterfly',paused=media.matches,frame=0,start=0,morphing=false,raf=0,travel=false,origin={x:0,y:0},targetMean={x:0,y:0},travelDirection=1,travelDuration=1600;
 const count=innerWidth<761?1500:3000;
 let seed=2086;
 const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 let poseTime=0,lastPoseFrame=0;
 const masks={};
 // Articulated point surfaces: local longitudinal x, span r, signed near/far z.
 // Technique references: Yoichi Kobayashi butterfly.vs; Klevron butterflies vertex shader.
 function butterflyMask(){
  const off=document.createElement('canvas');off.width=600;off.height=400;
  const c=off.getContext('2d',{willReadFrequently:true});
  c.strokeStyle=c.fillStyle='#fff';c.lineCap='round';c.lineJoin='round';
  function path(d,fill=0,stroke=1.4){const q=new Path2D(d);if(fill){c.globalAlpha=fill;c.fill(q)}c.globalAlpha=.95;c.lineWidth=stroke;c.stroke(q)}
  function ellipse(x,y,rx,ry){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();c.stroke()}
  function sample(){const data=c.getImageData(0,0,600,400).data,list=[];for(let y=30;y<350;y+=2)for(let x=100;x<470;x+=2){const a=data[(y*600+x)*4+3]/255;if(a>.035&&random()<.16+.84*a)list.push({x,y,a,core:[[-6,0],[6,0],[0,-6],[0,6]].every(([dx,dy])=>data[((y+dy)*600+x+dx)*4+3]>12)})}return list}
  // One complete fore/hind-wing surface, sampled separately for each side.
  path('M340 270 C311 231 249 158 245 91 C242 51 265 42 292 59 C344 84 386 155 365 237 C360 260 350 269 340 270 Z',.18);
  path('M340 270 C299 276 240 255 218 224 C196 190 220 165 247 177 C294 185 329 218 340 270 Z',.15);
  ['M340 269 Q276 174 265 76','M340 269 Q305 168 291 64','M340 269 Q337 170 320 87','M340 269 Q368 179 346 123','M340 269 Q284 225 225 195','M340 269 Q277 256 229 227','M259 118 Q307 116 342 144','M269 155 Q323 162 360 183','M288 194 Q332 199 359 220','M233 204 Q275 209 305 237'].forEach(d=>path(d,0,.9));
  c.lineWidth=.8;[[271,75],[288,82],[308,96],[327,115],[343,139],[352,164],[357,191],[349,220],[229,196],[239,215],[257,235]].forEach(([x,y])=>{c.globalAlpha=.8;ellipse(x,y,2,3)});
  const wing=sample();c.clearRect(0,0,600,400);
  // Body and feet are an independent immutable plane; no wing membership heuristics.
  c.save();c.translate(300,300);c.scale(-1.28,.72);c.translate(-300,-300);
  c.globalAlpha=.9;c.lineWidth=.8;c.save();c.translate(329,273);c.rotate(-.12);ellipse(-18,0,47,5);ellipse(26,-1,15,8);ellipse(48,-3,7,7);c.restore();
  path('M376 262 Q385 241 408 233 M375 264 Q396 246 417 249',0,1);
  c.globalAlpha=.42;c.lineWidth=.7;
  ['M339 277 L331 289 L324 300 L320 300','M350 275 L355 287 L359 300 L363 300','M364 274 L375 287 L383 300 L387 300'].forEach(d=>c.stroke(new Path2D(d)));
  c.restore();const anatomy=sample(),feet=anatomy.filter(q=>q.y>286),body=anatomy.filter(q=>q.y<=286),out=[];
  const bodyCount=Math.floor(count*.09),wingCount=count-bodyCount;
  for(let i=0;i<count;i++){
   if(i<bodyCount){const group=i<Math.floor(count*.01)?feet:body;const q=group[Math.floor(random()*group.length)];out.push({x:(q.x-300)/600,y:(q.y-200)/600,a:.24+q.a*.76,z:0,part:q.y>286?'foot':'body'});continue}
   const side=(i-bodyCount)<wingCount/2?-1:1,q=wing[Math.floor(random()*wing.length)];
   const u=(340-q.x)*1.28/600,r=Math.max(0,(270-q.y)*.85/600);
   const interior=q.core&&q.a<.8?smooth(.025,.09,r)*(1-smooth(.23,.32,r)):0;
   out.push({x:-.085+u,y:.125-r,a:.32+q.a*.68,z:0,part:side<0?'far-wing':'near-wing',side,u,r,color:interior});
  }
  return out;
 }
 function mask(name){
  if(masks[name])return masks[name];
  if(name==='butterfly')return masks[name]=butterflyMask();
  if(name==='tori'){
   const raw=atob(window.TORI_POINT_MASK||''),bytes=Uint8Array.from(raw,ch=>ch.charCodeAt(0)),total=bytes.length/4,out=[];
   if(!total)throw Error('Missing Tori point mask');
   for(let i=0;i<count;i++){
    const j=Math.floor(i*total/count)*4;
    out.push({x:(bytes[j]/255-.5)*.348,y:(bytes[j+1]/255-.5)*.486,a:.24+bytes[j+2]/255*.76,z:(random()-.5)*.08,color:bytes[j+3],part:'tori'});
   }
   return masks[name]=out;
  }
  const off=document.createElement('canvas');off.width=600;off.height=400;
  const c=off.getContext('2d',{willReadFrequently:true});c.strokeStyle='#fff';c.fillStyle='#fff';c.lineWidth=3;c.lineJoin='round';c.lineCap='round';
  function line(points,thick=3){c.lineWidth=thick;c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.stroke()}
  function box(x,y,w,h,fill=.14){c.globalAlpha=fill;c.fillRect(x,y,w,h);c.globalAlpha=1;c.strokeRect(x,y,w,h)}
  function ellipse(x,y,rx,ry,fill=.1){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.globalAlpha=fill;c.fill();c.globalAlpha=1;c.stroke()}
  if(name==='dolphin'){
   // Bottlenose profile with a curved back, beak, dorsal fin and forked flukes.
   const body=new Path2D('M118 224 C142 216 144 199 162 183 C188 157 231 145 275 150 C286 128 307 102 325 100 C313 122 314 145 329 163 C371 177 394 201 432 211 C453 195 475 183 500 185 C487 199 477 211 464 221 C483 225 499 240 506 254 C480 250 455 241 435 229 C404 232 376 227 349 220 C333 215 318 211 303 212 C298 236 276 256 253 261 C262 240 265 220 258 211 C218 213 192 232 163 232 C149 232 141 229 132 232 C114 235 96 235 92 230 C91 226 108 224 118 224 Z');
   c.globalAlpha=.17;c.fill(body);c.globalAlpha=.95;c.lineWidth=2;c.stroke(body);
   c.globalAlpha=.58;c.lineWidth=1.2;c.stroke(new Path2D('M116 230 Q147 225 165 216 M154 204 Q171 197 185 199 M176 221 Q212 195 258 194 C307 187 361 216 433 220 M277 153 Q293 170 306 188 M273 218 Q273 239 258 254'));
   c.globalAlpha=1;ellipse(167,198,3.2,3.2,1);
   // Curved cross sections provide volume without turning the animal into a wire cage.
   c.globalAlpha=.26;c.lineWidth=.8;
   for(let i=0;i<7;i++){const x=197+i*26;c.beginPath();c.moveTo(x,157+Math.max(0,i-2)*7);c.quadraticCurveTo(x-18,186,x+4,214);c.stroke()}
   c.globalAlpha=1;
  }else if(name==='football'){
   ellipse(265,250,92,33,.17);box(173,166,184,84,.16);ellipse(265,166,92,32,.2);
   box(192,242,32,53,.6);box(307,242,32,53,.6);ellipse(265,143,22,15,.3);line([[265,143],[265,99]],5);ellipse(265,93,19,10,.8);
   box(220,181,88,43,.13);line([[232,221],[249,195],[267,221],[287,195]],3);
   ellipse(418,279,35,35,.16);line([[418,261],[436,274],[429,295],[407,295],[400,274],[418,261]],3);
   line([[185,307],[351,307]],2);c.globalAlpha=.3;c.setLineDash([4,10]);c.beginPath();c.moveTo(365,275);c.quadraticCurveTo(399,209,470,196);c.stroke();c.setLineDash([]);
  }else if(name==='tetris'){
   [[185,280],[233,280],[281,280],[329,280],[185,232],[185,184],[233,232],[281,232],[305,85],[353,85],[353,133],[401,133]].forEach(([x,y])=>box(x,y,43,43,.3));
   line([[155,80],[155,345],[466,345],[466,80]],3);
   c.globalAlpha=.4;c.setLineDash([3,9]);line([[374,192],[374,256]],3);c.setLineDash([]);line([[365,244],[374,257],[384,244]],3);
  }else{
   line([[150,199],[308,150],[453,192],[298,245],[150,199],[150,251],[298,303],[453,247],[453,192]],4);line([[298,245],[298,303]],4);
   c.beginPath();c.moveTo(150,199);c.lineTo(308,150);c.lineTo(453,192);c.lineTo(298,245);c.closePath();c.globalAlpha=.18;c.fill();c.globalAlpha=1;
   const wheels=[[180,270],[260,296],[338,289],[422,260]];
   c.globalAlpha=.55;line([[165,244],[180,270],[222,258],[260,296],[298,270],[338,289],[382,248],[422,260]],3);c.globalAlpha=1;
   wheels.forEach(([x,y])=>{
    c.save();c.translate(x,y);c.beginPath();
    for(let k=0;k<24;k++){const a=k*Math.PI/12,notch=k%2?.82:1,px=Math.cos(a)*28*notch,py=Math.sin(a)*40*notch;k?c.lineTo(px,py):c.moveTo(px,py)}
    c.closePath();c.globalAlpha=.3;c.fill();c.globalAlpha=.95;c.lineWidth=2.2;c.stroke();
    ellipse(0,0,15,25,.06);ellipse(0,0,6,10,.62);c.fillStyle='#fff';
    for(let k=0;k<12;k++){const a=k*Math.PI/6;c.save();c.translate(Math.cos(a)*27,Math.sin(a)*39);c.rotate(a);c.globalAlpha=.9;c.fillRect(-6,-3,12,6);c.restore()}
    c.restore();c.globalAlpha=.62;line([[x-13,y],[x+13,y]],2);c.globalAlpha=1;
   });
   line([[232,174],[232,124],[308,99],[365,118],[365,169]],4);line([[308,99],[308,151]],3);line([[327,102],[327,69]],4);ellipse(327,66,20,7,.5);
   c.globalAlpha=.3;line([[90,326],[183,309],[254,337],[378,302],[510,285]],2);
  }
  const pix=c.getImageData(0,0,600,400).data,candidates=[];
  for(let y=25;y<375;y+=2)for(let x=70;x<530;x+=2){const a=pix[(y*600+x)*4+3]/255;if(a>.04&&random()<.14+a*.86)candidates.push({x:(x-300)/600,y:(y-200)/600,a})}
  if(!candidates.length)throw Error('Empty particle form: '+name);
  const out=[];for(let i=0;i<count;i++){const p=candidates[Math.floor(random()*candidates.length)];out.push({x:p.x+(random()-.5)*.004,y:p.y+(random()-.5)*.004,a:.18+p.a*.82,z:random()-.5})}
  out.sort((a,b)=>a.x-b.x);masks[name]=out;return out;
 }
 const particles=Array.from({length:count},(_,i)=>({x:width*.45,y:height*.4,fromX:0,fromY:0,alpha:0,r:.65+random()*.7,phase:random()*Math.PI*2,delay:random()*.23,depth:random()}));
 const paintOrder=Array.from({length:count},(_,i)=>i);
 let points=mask(form),anchor={x:width*.72,y:height*.42,scale:Math.min(width*.46,height*.64)};
 function layout(){
  width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
  const side=document.body.dataset.side;
  if(width<761){const r=document.querySelector('.scene-copy').getBoundingClientRect();anchor={x:width*.52,y:r.bottom+119,scale:Math.min(width*.9,410)*(form==='butterfly'?.82:1)}}
  else{const card=document.querySelector('.stage-card').getBoundingClientRect();const scale=Math.min(width*.47,height*.72)*(form==='butterfly'?.82:1);const x=card.left+card.width*.5;const el=document.querySelector('.stage-card');const angle=(side==='left'?2:-2)*Math.PI/180;const rim=card.top+card.height*.5-el.offsetHeight*.5/Math.cos(angle);anchor={x,y:form==='butterfly'?rim-scale/6:card.top-scale*.24-12,scale}}
  if(paused&&!morphing)render(performance.now());
 }
 function destination(p,i,time){
  const resting=form==='butterfly';
  let px=p.x,py=p.y;
  let viewDepth=0;
  if(resting&&p.side){
   // Body-axis hinge in 3D, with spanwise phase lag; NEVER scale a screen-space mask.
   const phase=poseTime*Math.PI*2/3400;
   const tipLag=.42*smooth(0,.31,p.r);
   const angle=.77+.46*Math.sin(phase-tipLag);
   const y=p.r*Math.sin(angle),z=p.side*p.r*Math.cos(angle);
   const yaw=.58,elevation=.38;
   const horizontal=p.u*Math.cos(yaw)+z*Math.sin(yaw);
   const cameraZ=z*Math.cos(yaw)-p.u*Math.sin(yaw);
   const vertical=-y*Math.cos(elevation)+cameraZ*Math.sin(elevation);
   viewDepth=cameraZ*Math.cos(elevation)+y*Math.sin(elevation);
   px=-.085+horizontal;py=.125+vertical;
  }
  if(form==='dolphin'){
   const swim=poseTime*Math.PI*2/5800;
   const tail=smooth(.06,.34,px);
   py+=Math.sin(swim*1.8-tail*1.1)*.026*tail*tail;
   const pitch=.035*Math.cos(swim),x=px,y=py;
   px=x*Math.cos(pitch)-y*Math.sin(pitch)+.012*Math.sin(swim*.65);
   py=x*Math.sin(pitch)+y*Math.cos(pitch)+.026*Math.sin(swim);
  }
  const drift=!paused&&!resting&&form!=='dolphin'?1.2:0;
  const footTilt=resting?px*anchor.scale*Math.tan(document.body.dataset.side==='left'?2*Math.PI/180:-2*Math.PI/180):0;
  return{x:anchor.x+px*anchor.scale+Math.sin(time*.0006+particles[i].phase)*drift,y:anchor.y+py*anchor.scale+footTilt+Math.cos(time*.0005+particles[i].phase)*drift,depth:viewDepth};
 }
 function smooth(a,b,v){const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t)}
 function morph(next,animate=true,options={}){
  travel=!!options.travel;travelDirection=options.direction||1;
  origin=particles.reduce((a,p)=>({x:a.x+p.x/count,y:a.y+p.y/count}),{x:0,y:0});
  form=next;points=mask(form);layout();start=options.clock?.start??performance.now();travelDuration=options.clock?.duration||1600;morphing=animate&&!media.matches&&!paused;
  particles.forEach(p=>{p.fromX=p.x;p.fromY=p.y;p.fromAlpha=p.alpha});
  targetMean=points.reduce((a,p)=>({x:a.x+p.x/count,y:a.y+p.y/count}),{x:0,y:0});
  if(!morphing){particles.forEach((p,i)=>{const d=destination(points[i],i,start);p.x=d.x;p.y=d.y;p.alpha=points[i].a});render(start)}
  schedule();
 }
 function render(now){
  if(!paused&&lastPoseFrame)poseTime+=Math.min(now-lastPoseFrame,60);lastPoseFrame=now;
  ctx.clearRect(0,0,width,height);
  let done=true;
  const elapsed=(now-start)/(travel?travelDuration:1000);
  particles.forEach((p,i)=>{
   const point=points[i],to=destination(point,i,now);
   if(morphing){
    const lag=travel?p.delay/.23*.34:p.delay;
    const t=Math.max(0,Math.min(1,(elapsed-lag)/(1-lag)));if(t<1)done=false;
    const e=t*t*(3-2*t),arc=Math.sin(Math.PI*e);
    const dx=to.x-p.fromX,dy=to.y-p.fromY,dist=Math.hypot(dx,dy);
    const normal=dist?{x:-dy/dist,y:dx/dist}:{x:0,y:1};
    const ribbon=(p.phase/Math.PI-1)*22+Math.sin(p.phase)*18;
    if(travel){
     // One current, not independently interpolated silhouettes: gather -> stream -> bloom.
     const target={x:anchor.x+targetMean.x*anchor.scale,y:anchor.y+targetMean.y*anchor.scale};
     const gather=smooth(0,.28,t),bloom=smooth(.70,1,t);
     const flow=smooth(.10,.90,t),q=1-flow;
     // Continuous in-view transport: the curve joins the actual two anchors.
     // Direction bows the stream, never teleports it across a viewport edge.
     const endY=target.y;
     const vx=target.x-origin.x,vy=endY-origin.y;
     const bend=Math.min(width*.16,height*.20,160);
     const inset=Math.min(64,width*.12),top=Math.min(height*.32,150);
     const bounded=(x,y)=>({x:Math.max(inset,Math.min(width-inset,x)),y:Math.max(top,Math.min(height-64,y))});
     const sameSide=Math.abs(vx)<width*.20;
     const inward=(origin.x+target.x>width?-1:1)*bend*(sameSide?1.5:.25);
     const bow=travelDirection*bend;
     const c1=bounded(origin.x+vx*.28+inward,origin.y+vy*.28+bow);
     const c2=bounded(origin.x+vx*.72+inward,target.y-vy*.28+bow);
     const cx=q*q*q*origin.x+3*q*q*flow*c1.x+3*q*flow*flow*c2.x+flow*flow*flow*target.x;
     const cy=q*q*q*origin.y+3*q*q*flow*c1.y+3*q*flow*flow*c2.y+flow*flow*flow*endY;
     const tx=3*q*q*(c1.x-origin.x)+6*q*flow*(c2.x-c1.x)+3*flow*flow*(target.x-c2.x);
     const ty=3*q*q*(c1.y-origin.y)+6*q*flow*(c2.y-c1.y)+3*flow*flow*(endY-c2.y);
     const tangent=Math.hypot(tx,ty)||1,normalX=-ty/tangent,normalY=tx/tangent;
     const envelope=gather*(1-bloom);
     const coil=p.phase+flow*Math.PI*3.5;
     const taper=Math.pow(Math.max(0,Math.sin(Math.PI*p.delay/.23)),.65);
     const radius=(1.5+p.depth*9)*taper*envelope;
     const release=Math.sin(Math.PI*bloom)*24;
     p.x=cx+(p.fromX-origin.x)*(1-gather)+(to.x-target.x)*bloom+normalX*Math.sin(coil)*radius+Math.cos(p.phase)*release;
     p.y=cy+(p.fromY-origin.y)*(1-gather)+(to.y-target.y)*bloom+normalY*Math.sin(coil)*radius+Math.sin(p.phase)*release;
    }else{
     p.x=p.fromX+dx*e+normal.x*arc*(ribbon-65);
     p.y=p.fromY+dy*e+normal.y*arc*(ribbon-65);
    }
    p.alpha=p.fromAlpha+(point.a-p.fromAlpha)*e;
   }else{p.x=to.x;p.y=to.y;p.alpha=point.a}
   p.viewDepth=to.depth||0;
  });
  if(form==='butterfly')paintOrder.sort((a,b)=>particles[a].viewDepth-particles[b].viewDepth);
  paintOrder.forEach(i=>{
   const p=particles[i],point=points[i];
   if(p.x<-5||p.x>width+5||p.y<-5||p.y>height+5)return;
   ctx.fillStyle=i%7===0?`rgba(167,140,96,${p.alpha*.9})`:`rgba(75,68,56,${p.alpha*(.48+p.depth*.4)})`;
   if(form==='butterfly'&&point.color>.03){
    const hue=(poseTime*.012+point.u*390+point.r*610+190)%360;
    const depthShade=point.side<0?.68:.92;
    ctx.fillStyle=`hsla(${hue},68%,${49+point.color*8}%,${p.alpha*depthShade})`;
   }
   if(form==='tori'){
    const palette=[[37,16,57],[67,35,101],[99,55,145],[135,82,184],[174,126,216]][point.color]||[99,55,145];
    ctx.fillStyle=`rgba(${palette[0]},${palette[1]},${palette[2]},${p.alpha*.9})`;
   }
   ctx.beginPath();ctx.arc(p.x,p.y,p.r*(width<761?.85:1),0,Math.PI*2);ctx.fill();
  });
  if(morphing&&done)morphing=false;
 }
 function loop(now){raf=0;render(now);if(!document.hidden&&(!paused||morphing))schedule()}
 function schedule(){if(!raf&&!document.hidden)raf=requestAnimationFrame(loop)}
 layout();particles.forEach((p,i)=>{p.x=width*.86+i/count*width*.12;p.y=height*.22+Math.sin(i/count*8)*14;p.fromX=p.x;p.fromY=p.y});morph(form,true);
 window.ParticleGuide={morph,layout,snapshot(){return {form,morphing,poseTime,particles:particles.map((p,i)=>({x:p.x,y:p.y,alpha:p.alpha,depth:p.viewDepth||0,part:points[i].part||form}))}},setPaused(value){paused=value;if(paused)morph(form,false);else schedule();document.dispatchEvent(new Event('motionchange'))},get paused(){return paused},forms:['butterfly','dolphin','football','tetris','rover','tori']};
 addEventListener('resize',layout);addEventListener('scroll',()=>{if(width<761){layout();if(paused)render(performance.now())}},{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0}else schedule()});
 media.addEventListener('change',()=>{paused=media.matches;document.body.classList.toggle('motion-paused',paused);morph(form,!paused);document.dispatchEvent(new Event('motionchange'))});
})();
