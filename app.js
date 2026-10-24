const WA='573000000000'; // ← número de WhatsApp de la tienda (código país + número, sin +)
const P=window.PRODUCTS,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const money=n=>'$'+n.toLocaleString('es-CO'),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const slug=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const byId=Object.fromEntries(P.map(p=>[p.i,p]));
let cart={};try{cart=JSON.parse(localStorage.getItem('sublivo_cart')||'{}')}catch(e){}
const save=()=>{try{localStorage.setItem('sublivo_cart',JSON.stringify(cart))}catch(e){}};
const count=()=>Object.values(cart).reduce((a,b)=>a+b,0);
const total=()=>Object.entries(cart).reduce((a,[i,q])=>a+byId[i].p*q,0);
const ctl=i=>cart[i]?`<div class="step"><button data-a="dec" data-i="${i}" aria-label="Quitar uno">−</button><span>${cart[i]} en el carrito</span><button data-a="inc" data-i="${i}" aria-label="Agregar uno">+</button></div>`:`<button class="btn full" data-a="inc" data-i="${i}">Agregar</button>`;
const card=p=>`<article class="p"><img loading="lazy" src="img/${p.i}.jpg" alt="${esc(p.n)} ${esc(p.b)}"><div class="b"><div class="br">${esc(p.b)}</div><h3>${esc(p.n)}</h3>${p.x?`<div class="x">${esc(p.x)}</div>`:''}<div class="pr">${p.o?`<s>Original ${money(p.o)}</s>`:''}${money(p.p)}</div><div class="ctl" data-c="${p.i}">${ctl(p.i)}</div></div></article>`;
// carrito (panel lateral)
document.body.insertAdjacentHTML('beforeend',`<div class="ov" data-a="close"></div><aside class="dr" aria-label="Carrito"><header><h3>Tu carrito</h3><button data-a="close" aria-label="Cerrar">×</button></header><div class="items"></div><footer></footer></aside>`);
function paint(){
  $$('[data-c]').forEach(e=>e.innerHTML=ctl(e.dataset.c));
  $$('.cartn').forEach(e=>e.textContent=count());
  const ids=Object.keys(cart);
  $('.items').innerHTML=ids.length?ids.map(i=>{const p=byId[i];return `<div class="it"><img src="img/${i}.jpg" alt=""><div><h4>${esc(p.n)}</h4><div class="br">${esc(p.b)} · ${money(p.p)}</div><div class="row"><div class="step"><button data-a="dec" data-i="${i}">−</button><span>${cart[i]}</span><button data-a="inc" data-i="${i}">+</button></div><b>${money(p.p*cart[i])}</b></div><button class="del" data-a="del" data-i="${i}">Quitar del carrito</button></div></div>`}).join(''):'<p class="empty">Tu carrito está vacío.<br>Agrega tus perfumes favoritos.</p>';
  const msg=encodeURIComponent('Hola Sublivo, quiero hacer este pedido:\n'+ids.map(i=>`• ${cart[i]} × ${byId[i].n} (${byId[i].b}) — ${money(byId[i].p*cart[i])}`).join('\n')+`\nTotal: ${money(total())}`);
  $('.dr footer').innerHTML=ids.length?`<div class="tot"><span>Total</span><span>${money(total())}</span></div><a class="btn full" href="https://wa.me/${WA}?text=${msg}" target="_blank" rel="noopener">Enviar pedido por WhatsApp</a><button class="btn line full" data-a="clear">Vaciar carrito</button><small>Envío gratis en Tunja. Envíos a todo el país.</small>`:'';
}
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-a]');if(!t)return;const a=t.dataset.a,i=t.dataset.i;
  if(a=='inc')cart[i]=(cart[i]||0)+1;
  if(a=='dec'){cart[i]=(cart[i]||0)-1;if(cart[i]<=0)delete cart[i]}
  if(a=='del')delete cart[i];
  if(a=='clear')cart={};
  if(a=='open'){document.body.classList.add('open')}
  if(a=='close'){document.body.classList.remove('open')}
  save();paint();
});
document.addEventListener('keydown',e=>{if(e.key=='Escape')document.body.classList.remove('open')});
addEventListener('storage',e=>{if(e.key=='sublivo_cart'){cart=JSON.parse(e.newValue||'{}');paint()}});
// páginas de catálogo
const pg=document.body.dataset.page,grid=$('#grid');
if(grid){
  const pool=pg=='marcas'?P:P.filter(p=>p.g==pg);let pageN=0,q='',sort='',brand=pg=='marcas'?decodeURIComponent(location.hash.slice(1)):'';
  const brands=[...new Set(pool.map(p=>p.b))].sort((a,b)=>a=='Otras marcas'?1:b=='Otras marcas'?-1:a.localeCompare(b));
  const draw=()=>{
    let l=pool.filter(p=>(!q||(p.n+' '+p.b).toLowerCase().includes(q))&&(!brand||slug(p.b)==brand));
    if(sort=='asc')l=[...l].sort((a,b)=>a.p-b.p);if(sort=='desc')l=[...l].sort((a,b)=>b.p-a.p);
    $('#n').textContent=l.length+(l.length==1?' perfume':' perfumes');
    const seccion=pg=='marcas'&&!brand&&!sort,per=innerWidth<700?8:12,pages=Math.max(1,Math.ceil(l.length/per));
    if(seccion)l=[...l].sort((a,b)=>brands.indexOf(a.b)-brands.indexOf(b.b));
    pageN=Math.min(pageN,pages-1);
    const vis=pg=='marcas'?l.slice(pageN*per,pageN*per+per):l;
    const pgr=$('#pager');if(pgr)pgr.innerHTML=pages>1?`<button class="pnav" data-pg="-1" ${pageN?'':'disabled'}>‹ Anterior</button><span>Página ${pageN+1} de ${pages}</span><button class="pnav" data-pg="1" ${pageN<pages-1?'':'disabled'}>Siguiente ›</button>`:'';
    if(seccion){grid.className='';grid.innerHTML=brands.map(b=>{const x=vis.filter(p=>p.b==b);return x.length?`<section class="brandsec"><h2>${esc(b)}</h2><div class="grid">${x.map(card).join('')}</div></section>`:''}).join('')||'<p class="empty">No encontramos ese perfume. Escríbenos y te ayudamos.</p>'}
    else{grid.className='grid';grid.innerHTML=vis.map(card).join('')||'<p class="empty">No encontramos ese perfume. Escríbenos y te ayudamos.</p>'}
    paint()};
  if(pg=='marcas'){const pl=$('#pills');let pgi=0,per=innerWidth<700?6:12;
    const pages=()=>Math.max(1,Math.ceil(brands.length/per));
    const irA=()=>{const ix=brands.findIndex(b=>slug(b)==brand);if(ix>=0)pgi=Math.floor(ix/per)};
    const dp=()=>{const ini=pgi*per,vis=brands.slice(ini,ini+per);
      pl.innerHTML=`<button class="pill ${brand?'':'on'}" data-b="">Todas<small>${pool.length}</small></button>`+vis.map(b=>`<button class="pill ${slug(b)==brand?'on':''}" data-b="${slug(b)}">${esc(b)}<small>${pool.filter(p=>p.b==b).length}</small></button>`).join('')
      +(pages()>1?`<div class="pillnav"><button class="pnav" data-nav="-1" ${pgi?'':'disabled'}>‹ Anterior</button><span>${pgi+1} de ${pages()}</span><button class="pnav" data-nav="1" ${pgi<pages()-1?'':'disabled'}>Siguiente ›</button></div>`:'')};
    pl.onclick=e=>{const n=e.target.closest('.pnav');if(n){pgi=Math.max(0,Math.min(pages()-1,pgi+(+n.dataset.nav)));dp();return}
      const b=e.target.closest('.pill');if(!b)return;brand=b.dataset.b;pageN=0;history.replaceState(null,'','#'+brand);dp();draw()};
    addEventListener('hashchange',()=>{brand=decodeURIComponent(location.hash.slice(1));pageN=0;irA();dp();draw()});
    addEventListener('resize',()=>{const n=innerWidth<700?6:12;if(n!=per){per=n;pgi=Math.min(pgi,pages()-1);dp()}});
    irA();dp()}
  $('#q').oninput=e=>{q=e.target.value.trim().toLowerCase();pageN=0;draw()};$('#s').onchange=e=>{sort=e.target.value;pageN=0;draw()};
  const pgr0=$('#pager');if(pgr0){pgr0.onclick=e=>{const b=e.target.closest('.pnav');if(!b)return;pageN+=+b.dataset.pg;draw();$('#pills').scrollIntoView({behavior:'smooth',block:'start'})};
    let perP=innerWidth<700?8:12;addEventListener('resize',()=>{const n=innerWidth<700?8:12;if(n!=perP){perP=n;pageN=0;draw()}})}
  draw();
}else paint();
