(() => {
 'use strict';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let navigating=false,lastFocus=null,swipe=null,pending=null;
 const about={
  profile:'<p class="intro">A Robotics Engineering graduate from the University of Shanghai for Science and Technology, now studying at the University of Manchester.</p><p class="about-secondary">Interested in industry opportunities across perception, sensor fusion, motion planning, decision-making and systems integration.</p>',
  toolkit:'<div class="toolkit-line"><b>Software</b><span>Python · NumPy · Git · Linux</span></div><div class="toolkit-line"><b>Robotics & vision</b><span>ROS 2 · OpenCV</span></div><div class="toolkit-line"><b>Design</b><span>SolidWorks · Siemens NX</span></div>'
  };
  function setAboutMode(mode,push=false){
   if(currentRoute!=='about.html')return false;
   const contact=mode==='contact',panel=document.getElementById('contact');
   document.body.classList.toggle('contact-mode',contact);
   panel?.setAttribute('aria-hidden',String(!contact));
   document.querySelectorAll('nav a').forEach(a=>a.removeAttribute('aria-current'));
   document.querySelector(`nav a[href$="about.html#${contact?'contact':'skills'}"]`)?.setAttribute('aria-current','page');
   if(push){const url=new URL(location.href);url.hash=contact?'contact':'skills';history.pushState({},'',url.href)}
   window.ParticleGuide?.layout();return true;
  }
 function syncMotion(){const p=window.ParticleGuide?.paused||false;document.body.classList.toggle('motion-paused',p);const b=document.getElementById('motion-toggle');b.setAttribute('aria-pressed',String(p));b.innerHTML=p?'Resume motion <span>▷</span>':'Pause motion <span>Ⅱ</span>'}
 function init(){
  const dialog=document.getElementById('case-dialog');
  document.querySelector('[data-open-case]')?.addEventListener('click',e=>{lastFocus=e.currentTarget;dialog.showModal()});
  document.querySelector('.close-dialog')?.addEventListener('click',()=>dialog.close());
  dialog?.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
  dialog?.addEventListener('close',()=>lastFocus?.focus());
  const tabs=[...document.querySelectorAll('[data-about]')];
  tabs.forEach((b,i)=>{
   b.addEventListener('click',()=>{tabs.forEach(t=>{t.setAttribute('aria-selected',String(t===b));t.tabIndex=t===b?0:-1});const p=document.getElementById('about-panel');p.setAttribute('aria-labelledby',b.id);p.innerHTML=about[b.dataset.about];window.ParticleGuide?.layout()});
   b.addEventListener('keydown',e=>{let n;if(e.key==='ArrowRight')n=(i+1)%tabs.length;if(e.key==='ArrowLeft')n=(i+tabs.length-1)%tabs.length;if(e.key==='Home')n=0;if(e.key==='End')n=tabs.length-1;if(n!==undefined){e.preventDefault();e.stopPropagation();tabs[n].focus();tabs[n].click()}});
  });
  if(currentRoute==='about.html'){
   document.querySelector('[data-about="toolkit"]')?.click();
   setAboutMode(location.hash==='#contact'?'contact':'skills');
  }
  document.getElementById('contact-form')?.addEventListener('submit',async e=>{
   e.preventDefault();const form=e.currentTarget,button=form.querySelector('button[type="submit"]'),status=document.getElementById('contact-status');
   if(!form.reportValidity()||button.disabled)return;
   button.disabled=true;button.textContent='Sending…';status.className='contact-status is-pending';status.textContent='Sending your message…';
   try{
    const response=await fetch(form.action,{method:'POST',body:new FormData(form),headers:{Accept:'application/json'}});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw Error(data.errors?.map(error=>error.message).join(' ')||'The message could not be sent.');
    form.reset();status.className='contact-status is-success';status.textContent='Message sent. Thank you — I’ll get back to you soon.';
   }catch(error){status.className='contact-status is-error';status.textContent=`${error.message} Please email me directly below.`}
   finally{button.disabled=false;button.textContent='Send message'}
  });
  document.querySelectorAll('[data-preview-form]').forEach(a=>{
   const preview=()=>window.ParticleGuide?.morph(a.dataset.previewForm);
   a.addEventListener('pointerenter',preview);a.addEventListener('focus',preview);
  });
  document.querySelectorAll('[data-dehaze-reveal]').forEach(button=>button.addEventListener('click',()=>button.setAttribute('aria-pressed',String(button.getAttribute('aria-pressed')!=='true'))));
 }
 const routes=['index.html','projects.html','underwater-vision.html','robot-football.html','robotic-tetris.html','all-terrain-robot.html','tori.html','about.html'];
 let currentRoute=location.pathname.split('/').pop()||'index.html',wheelSum=0,wheelTime=0;
 const normalize=url=>url.pathname.split('/').pop()||'index.html';
 // Snapshot only scene content, never controls/dialogs. Viewport geometry keeps
 // the fixed card/caption and flowing copy rigidly together in one moving layer.
 function sceneLayer(scene){
  const layer=document.createElement('div');layer.className='chapter-layer';layer.inert=true;layer.setAttribute('aria-hidden','true');
  scene.querySelectorAll('.scene-copy,.stage-card,.scene-coordinate,.dehaze-gallery,.football-visual,.tetris-visual').forEach(el=>{
   if(getComputedStyle(el).display==='none')return;
   const copy=el.cloneNode(true),r=el.getBoundingClientRect(),style=getComputedStyle(el);
   // A snapshot must keep its source appearance after body.dataset.scene changes.
   // Freeze computed styles before detaching from ancestor/ID-dependent selectors.
   const sources=[el,...el.querySelectorAll('*')],copies=[copy,...copy.querySelectorAll('*')];
   sources.forEach((source,i)=>{
    const computed=getComputedStyle(source),target=copies[i];
    for(const property of computed)target.style.setProperty(property,computed.getPropertyValue(property));
    target.style.animation='none';target.style.transition='none';
   });
   const panel=copy.querySelector('#about-panel');if(panel)panel.classList.add('about-panel-snapshot');
   copy.removeAttribute('id');copy.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));
   // offset dimensions retain the card's rotation without rotating its bounding box twice.
   const w=el.offsetWidth,h=el.offsetHeight;
   Object.assign(copy.style,{position:'absolute',left:`${r.left+(r.width-w)/2}px`,top:`${r.top+(r.height-h)/2}px`,width:`${w}px`,height:`${h}px`,maxWidth:'none',margin:'0',transform:style.transform,animation:'none',transition:'none'});
   layer.append(copy);
  });
  document.body.append(layer);return layer;
 }
 function moveChapters(oldLayer,newLayer,direction,clock){
  const distance=Math.max(innerHeight,...[oldLayer,newLayer].flatMap(l=>[...l.children].map(n=>n.getBoundingClientRect().bottom)))+32;
  const animations=[oldLayer.animate([{transform:'translateY(0)'},{transform:`translateY(${-direction*distance}px)`}],{duration:clock.duration,fill:'both'}),newLayer.animate([{transform:`translateY(${direction*distance}px)`},{transform:'translateY(0)'}],{duration:clock.duration,fill:'both'})];
  animations.forEach(a=>{a.pause();a.currentTime=0});
  return new Promise(resolve=>{
   let raf;
   const finish=()=>{cancelAnimationFrame(raf);document.removeEventListener('motionchange',motion);reduced.removeEventListener('change',motion);animations.forEach(a=>a.cancel());oldLayer.remove();newLayer.remove();resolve()};
   const motion=()=>{if(reduced.matches||window.ParticleGuide?.paused)finish()};
   const tick=now=>{const p=Math.min(1,Math.max(0,(now-clock.start)/clock.duration));const eased=p*p*(3-2*p);animations.forEach(a=>a.currentTime=eased*clock.duration);if(p===1)finish();else raf=requestAnimationFrame(tick)};
   document.addEventListener('motionchange',motion);reduced.addEventListener('change',motion);raf=requestAnimationFrame(tick);
  });
 }
 async function navigate(url,push=true,direction){
  direction=direction||Math.sign(routes.indexOf(normalize(url))-routes.indexOf(currentRoute))||1;
  if(navigating){pending={url,push,direction};return;}
  navigating=true;
  document.getElementById('navigation-status')?.remove();
  try{
   const response=await fetch(url.href,{cache:'no-store',signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error('Page unavailable');
   const next=new DOMParser().parseFromString(await response.text(),'text/html');if(!next.querySelector('main .scene')||!next.querySelector('header')||!next.body.dataset.form)throw Error('Missing page content');
   const animate=!reduced.matches&&!window.ParticleGuide?.paused;
   const oldLayer=animate?sceneLayer(document.querySelector('.scene')):null;
   const nextStyle=next.querySelector('link[rel="stylesheet"]'),currentStyle=document.querySelector('link[rel="stylesheet"]');
   if(nextStyle&&currentStyle&&nextStyle.href!==currentStyle.href){
    await new Promise((resolve,reject)=>{const replacement=nextStyle.cloneNode();replacement.addEventListener('load',resolve,{once:true});replacement.addEventListener('error',()=>reject(Error('Stylesheet unavailable')),{once:true});currentStyle.replaceWith(replacement)});
   }
   document.querySelector('main').replaceWith(next.querySelector('main'));document.querySelector('header').innerHTML=next.querySelector('header').innerHTML;
   document.body.dataset.scene=next.body.dataset.scene;document.body.dataset.form=next.body.dataset.form;document.body.dataset.side=next.body.dataset.side;document.body.dataset.previous=next.body.dataset.previous||'';document.body.dataset.next=next.body.dataset.next||'';
   currentRoute=normalize(url);document.title=next.title;if(push)history.pushState({},'',url.href);
   window.scrollTo({top:0,behavior:'instant'});init();
   const scene=document.querySelector('.scene'),newLayer=animate?sceneLayer(scene):null;
   if(animate)scene.style.visibility='hidden';
   const clock={start:performance.now(),duration:1600};
   window.ParticleGuide?.morph(next.body.dataset.form,true,{travel:true,direction,clock});
   if(animate)await moveChapters(oldLayer,newLayer,direction,clock);
   scene.style.visibility='';
   document.querySelector('main').focus({preventScroll:true});
  }catch(error){
   // Keep the current page and its controls; a failed fetch is not a redirect.
   const status=document.createElement('div');status.id='navigation-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
   const message=document.createElement('span');message.textContent='This page could not be loaded. Check your connection and try again. ';
   const retry=document.createElement('button');retry.type='button';retry.textContent='Try again';retry.addEventListener('click',()=>navigate(url,true,direction));
   status.append(message,retry);document.body.append(status);
   if(!push)history.replaceState({},'',new URL(currentRoute,location.href));
  }finally{navigating=false;if(pending){const p=pending;pending=null;navigate(p.url,p.push,p.direction)}}
 }
 document.addEventListener('click',e=>{
  const a=e.target.closest('a');if(!a||e.defaultPrevented||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||a.target||a.hasAttribute('download'))return;
  const url=new URL(a.href,location.href);if(url.origin!==location.origin||!url.pathname.endsWith('.html'))return;
  if(normalize(url)===normalize(new URL(location.href))){if(url.hash==='#skills'||url.hash==='#contact'){e.preventDefault();document.querySelector('[data-about="toolkit"]')?.click();setAboutMode(url.hash.slice(1),true)}else if(!url.hash)e.preventDefault();return}
  e.preventDefault();navigate(url,true);
 });
 addEventListener('popstate',()=>{const url=new URL(location.href);if(normalize(url)===currentRoute&&currentRoute==='about.html')setAboutMode(url.hash==='#contact'?'contact':'skills');else navigate(url,false)});
 document.addEventListener('keydown',e=>{
  if(e.defaultPrevented||e.ctrlKey||e.metaKey||e.altKey||e.shiftKey||document.querySelector('dialog[open]')||e.target.closest('button,input,textarea,select,[role="tablist"]'))return;
  const next=e.key==='ArrowDown'||e.key==='ArrowRight',prev=e.key==='ArrowUp'||e.key==='ArrowLeft';if(!next&&!prev)return;
  const direction=next?1:-1;if(chapterTarget(direction)||aboutStepAvailable(direction)){e.preventDefault();if(!e.repeat)flip(direction)}
 });
 function atEdge(direction){return direction>0?scrollY+innerHeight>=document.documentElement.scrollHeight-12:scrollY<=12}
 // Route identity is authoritative: cached documents may omit or corrupt metadata.
 const chapters=routes;
 function chapterTarget(direction){
  const index=chapters.indexOf(currentRoute);
  const route=index<0?null:chapters[index+direction];
  return route?new URL(route,location.href):null;
 }
 function aboutStepAvailable(direction){return currentRoute==='about.html'&&((direction>0&&!document.body.classList.contains('contact-mode'))||(direction<0&&document.body.classList.contains('contact-mode')))}
 function flip(direction){if(navigating)return;if(aboutStepAvailable(direction)){setAboutMode(direction>0?'contact':'skills',true);return}const target=chapterTarget(direction);if(target)navigate(target,true,direction)}
 document.addEventListener('wheel',e=>{
  if(e.ctrlKey||document.querySelector('dialog[open]')||(e.target.closest('input,textarea,select,[role="tablist"]')&&!e.target.closest('#contact')))return;
  if(Math.abs(e.deltaY)<=Math.abs(e.deltaX))return;
  const direction=Math.sign(e.deltaY);if(!atEdge(direction)){wheelSum=0;return}
  e.preventDefault();const now=performance.now(),gap=now-wheelTime;wheelTime=now;
  if(navigating){wheelSum=Infinity;return}
  if(gap<160&&wheelSum===Infinity)return;
  if(gap>160||Math.sign(wheelSum)!==direction)wheelSum=0;
  wheelSum+=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1);
  if(Math.abs(wheelSum)>75){flip(direction);wheelSum=Infinity}
 },{passive:false});
 document.addEventListener('touchstart',e=>{if(e.touches.length===1&&!e.target.closest('dialog,button,a,input,textarea,select'))swipe={x:e.touches[0].clientX,y:e.touches[0].clientY,top:atEdge(-1),bottom:atEdge(1)};else swipe=null},{passive:true});
 document.addEventListener('touchend',e=>{if(!swipe)return;const s=swipe;swipe=null;const dx=e.changedTouches[0].clientX-s.x,dy=e.changedTouches[0].clientY-s.y,direction=dy<0?1:-1;if(Math.abs(dy)>85&&Math.abs(dy)>Math.abs(dx)*1.7&&(direction>0?s.bottom:s.top)&&atEdge(direction))flip(direction)},{passive:true});
 document.getElementById('motion-toggle').addEventListener('click',()=>{window.ParticleGuide?.setPaused(!window.ParticleGuide.paused);syncMotion()});
 document.addEventListener('motionchange',syncMotion);init();syncMotion();
})();
