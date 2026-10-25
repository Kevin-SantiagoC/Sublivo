const WA='573000000000'; // ← número de WhatsApp de la tienda (código país + número, sin +)
const P=window.PRODUCTS,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const money=n=>'$'+n.toLocaleString('es-CO'),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const slug=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const byId=Object.fromEntries(P.map(p=>[p.i,p]));
let fav={};try{fav=JSON.parse(localStorage.getItem('sublivo_fav')||'{}')}catch(e){}
let cart={};try{cart=JSON.parse(localStorage.getItem('sublivo_cart')||'{}')}catch(e){}
const save=()=>{try{localStorage.setItem('sublivo_cart',JSON.stringify(cart))}catch(e){}};
const count=()=>Object.values(cart).reduce((a,b)=>a+b,0);
const total=()=>Object.entries(cart).reduce((a,[i,q])=>a+byId[i].p*q,0);
const ctl=i=>cart[i]?`<div class="step"><button data-a="dec" data-i="${i}" aria-label="Quitar uno">−</button><span>${cart[i]} en el carrito</span><button data-a="inc" data-i="${i}" aria-label="Agregar uno">+</button></div>`:`<button class="btn full" data-a="inc" data-i="${i}">Agregar</button>`;
const card=p=>`<article class="p"><div class="ph"><img loading="lazy" src="img/${p.i}.jpg" alt="${esc(p.n)} ${esc(p.b)}"><button class="fv ${fav[p.i]?'on':''}" data-a="fav" data-i="${p.i}" aria-label="Favorito">♥</button></div><div class="b"><div class="br">${esc(p.b)}</div><h3>${esc(p.n)}</h3>${p.x?`<div class="x">${esc(p.x)}</div>`:''}<div class="pr">${p.o?`<s>Original ${money(p.o)}</s>`:''}${money(p.p)}</div><div class="ctl" data-c="${p.i}">${ctl(p.i)}</div></div></article>`;
// carrito (panel lateral)
document.body.insertAdjacentHTML('beforeend',`<div class="ov" data-a="close"></div><aside class="dr" aria-label="Carrito"><header><h3>Tu carrito</h3><button data-a="close" aria-label="Cerrar">×</button></header><div class="items"></div><footer></footer></aside><div class="bar" id="bar"><div class="bi"><div class="bt"><span class="bc">0</span><span class="bl">perfumes</span><b class="bp"></b></div><div class="ba"><button class="btn lt" data-a="open">Ver carrito</button><a class="btn pk wa" target="_blank" rel="noopener">Pedir por WhatsApp</a></div></div></div>`);
function paint(){
  $$('[data-c]').forEach(e=>e.innerHTML=ctl(e.dataset.c));
  $$('.cartn').forEach(e=>e.textContent=count());
  const ids=Object.keys(cart);
  $('.items').innerHTML=ids.length?ids.map(i=>{const p=byId[i];return `<div class="it"><img src="img/${i}.jpg" alt=""><div><h4>${esc(p.n)}</h4><div class="br">${esc(p.b)} · ${money(p.p)}</div><div class="row"><div class="step"><button data-a="dec" data-i="${i}">−</button><span>${cart[i]}</span><button data-a="inc" data-i="${i}">+</button></div><b>${money(p.p*cart[i])}</b></div><button class="del" data-a="del" data-i="${i}">Quitar del carrito</button></div></div>`}).join(''):'<p class="empty">Tu carrito está vacío.<br>Agrega tus perfumes favoritos.</p>';
  const msg=encodeURIComponent('Hola Sublivo, quiero hacer este pedido:\n'+ids.map(i=>`• ${cart[i]} × ${byId[i].n} (${byId[i].b}) — ${money(byId[i].p*cart[i])}`).join('\n')+`\nTotal: ${money(total())}`);
  $('.dr footer').innerHTML=ids.length?`<div class="tot"><span>Total</span><span>${money(total())}</span></div><a class="btn full" href="https://wa.me/${WA}?text=${msg}" target="_blank" rel="noopener">Enviar pedido por WhatsApp</a><button class="btn line full" data-a="clear">Vaciar carrito</button><small>Envío gratis en Tunja. Envíos a todo el país.</small>`:'';
  document.body.classList.toggle('has',ids.length>0);$('.bc').textContent=count();$('.bl').textContent=count()==1?' perfume':' perfumes';$('.bp').textContent=money(total());$('.bar .wa').href=`https://wa.me/${WA}?text=${msg}`;
}
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-a]');if(!t)return;const a=t.dataset.a,i=t.dataset.i;
  if(a=='fav'){fav[i]?delete fav[i]:fav[i]=1;try{localStorage.setItem('sublivo_fav',JSON.stringify(fav))}catch(e){}t.classList.toggle('on',!!fav[i]);if(window.fk=='fav')window.redraw();return}
  if(a=='inc')cart[i]=(cart[i]||0)+1;
  if(a=='dec'){cart[i]=(cart[i]||0)-1;if(cart[i]<=0)delete cart[i]}
  if(a=='del')delete cart[i];
  if(a=='clear')cart={};
  if(a=='open'){document.body.classList.add('open')}
  if(a=='close'){document.body.classList.remove('open')}
  save();paint();
  if(a=='inc'){const s=$('[data-c="'+i+'"] .step');s&&s.classList.add('pop');const b=$('#bar');b.classList.remove('bump');void b.offsetWidth;b.classList.add('bump')}
});
document.addEventListener('keydown',e=>{if(e.key=='Escape')document.body.classList.remove('open')});
addEventListener('storage',e=>{if(e.key=='sublivo_cart'){cart=JSON.parse(e.newValue||'{}');paint()}});
// páginas de catálogo
const pg=document.body.dataset.page,grid=$('#grid');
if(grid){
  const pool=pg=='marcas'?P:P.filter(p=>p.g==pg);let f='',q='',sort='',brand=pg=='marcas'?decodeURIComponent(location.hash.slice(1)):'';
  const flt=p=>!f||(f=='fav'?fav[p.i]:f=='a'?p.p<=90000:f=='b'?p.p>90000&&p.p<=110000:p.p>110000);
  const brands=[...new Set(pool.map(p=>p.b))].sort((a,b)=>a=='Otras marcas'?1:b=='Otras marcas'?-1:a.localeCompare(b));
  const draw=()=>{
    let l=pool.filter(p=>(!q||(p.n+' '+p.b).toLowerCase().includes(q))&&(!brand||slug(p.b)==brand)&&flt(p));
    if(sort=='asc')l=[...l].sort((a,b)=>a.p-b.p);if(sort=='desc')l=[...l].sort((a,b)=>b.p-a.p);
    $('#n').textContent=l.length+(l.length==1?' perfume':' perfumes');
    if(pg=='marcas'&&!brand&&!sort){grid.className='';grid.innerHTML=brands.map(b=>{const x=l.filter(p=>p.b==b);return x.length?`<section class="brandsec"><h2>${esc(b)}</h2><div class="grid">${x.map(card).join('')}</div></section>`:''}).join('')||'<p class="empty">No encontramos ese perfume. Escríbenos y te ayudamos.</p>'}
    else{grid.className='grid';grid.innerHTML=l.map(card).join('')||'<p class="empty">No encontramos ese perfume. Escríbenos y te ayudamos.</p>'}
    paint()};
  if(pg=='marcas'){const pl=$('#pills');const dp=()=>{pl.innerHTML=`<button class="pill ${brand?'':'on'}" data-b="">Todas<small>${pool.length}</small></button>`+brands.map(b=>`<button class="pill ${slug(b)==brand?'on':''}" data-b="${slug(b)}">${esc(b)}<small>${pool.filter(p=>p.b==b).length}</small></button>`).join('')};
    pl.onclick=e=>{const b=e.target.closest('.pill');if(!b)return;brand=b.dataset.b;history.replaceState(null,'','#'+brand);dp();draw()};
    addEventListener('hashchange',()=>{brand=decodeURIComponent(location.hash.slice(1));dp();draw()});dp()}
  $('.tools').insertAdjacentHTML('afterend','<div class="pills" id="fp"></div>');const fp=$('#fp'),FL=[['','Todos'],['a','Hasta $90.000'],['b','$90.000 a $110.000'],['c','Más de $110.000'],['fav','♥ Favoritos']];const dfp=()=>fp.innerHTML=FL.map(([k,t])=>`<button class="pill ${f==k?'on':''}" data-k="${k}">${t}</button>`).join('');fp.onclick=e=>{const b=e.target.closest('.pill');if(!b)return;f=b.dataset.k;window.fk=f;dfp();draw()};dfp();window.redraw=draw;
  $('#q').oninput=e=>{q=e.target.value.trim().toLowerCase();draw()};$('#s').onchange=e=>{sort=e.target.value;draw()};draw();
}else paint();
