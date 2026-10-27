/* SUBLIVO · lógica del sitio: carrito, favoritos, filtros y barra inferior.
   Los productos vienen de products.js. Cambia WA por el número de WhatsApp de la tienda. */
const WA = "573226267514"; // ← número de WhatsApp de la tienda (código país + número, sin +)
const P = window.PRODUCTS,
  $ = (s, r = document) => r.querySelector(s),
  $$ = (s, r = document) => [...r.querySelectorAll(s)];
const money = (n) => "$" + n.toLocaleString("es-CO"),
  esc = (s) =>
    String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const slug = (s) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const byId = Object.fromEntries(P.map((p) => [p.i, p]));
let fav = {};
try {
  fav = JSON.parse(localStorage.getItem("sublivo_fav") || "{}");
} catch (e) {}
let cart = {};
try {
  cart = JSON.parse(localStorage.getItem("sublivo_cart") || "{}");
} catch (e) {}
const save = () => {
  try {
    localStorage.setItem("sublivo_cart", JSON.stringify(cart));
  } catch (e) {}
};
const count = () => Object.values(cart).reduce((a, b) => a + b, 0);
const total = () => Object.entries(cart).reduce((a, [i, q]) => a + byId[i].p * q, 0);
const ctl = (i) =>
  cart[i]
    ? `<div class="step"><button data-a="dec" data-i="${i}" aria-label="Quitar uno">−</button><span>${cart[i]}<em> en el carrito</em></span><button data-a="inc" data-i="${i}" aria-label="Agregar uno">+</button></div>`
    : `<button class="btn full" data-a="inc" data-i="${i}">Agregar</button>`;
const card = (p) =>
  `<article class="p"><div class="ph"><img loading="lazy" src="img/${p.i}.jpg" alt="${esc(p.n)} ${esc(p.b)}"><button class="fv ${fav[p.i] ? "on" : ""}" data-a="fav" data-i="${p.i}" aria-label="Agregar a favoritos">♥</button></div><div class="b"><div class="br">${esc(p.b)}</div><h3>${esc(p.n)}</h3>${p.x ? `<div class="x">${esc(p.x)}</div>` : ""}<div class="pr">${p.o ? `<s>Original ${money(p.o)}</s>` : ""}${money(p.p)}</div><div class="ctl" data-c="${p.i}">${ctl(p.i)}</div></div></article>`;
// ---- Carrito (panel lateral) y datos de entrega ----
let view = "cart"; // "cart" = lista de perfumes · "form" = datos de entrega · "done" = pedido enviado
const FIELDS = [
  ["nombre", "Nombre", "given-name", "text", "Ej.: María"],
  ["apellidos", "Apellidos", "family-name", "text", "Ej.: Gómez Pérez"],
  ["celular", "Número de celular", "tel-national", "tel", "Ej.: 300 123 4567"],
  ["ciudad", "Ciudad", "address-level2", "text", "Ej.: Tunja"],
  ["direccion", "Dirección", "street-address", "text", "Calle, número, barrio y apartamento"],
];
const RULES = {
  nombre: [(v) => v.length >= 2, "Escribe tu nombre."],
  apellidos: [(v) => v.length >= 2, "Escribe tus apellidos."],
  celular: [
    (v) => /^3\d{9}$/.test(v.replace(/\D/g, "").replace(/^57(?=3\d{9}$)/, "")),
    "Escribe un celular de 10 dígitos, por ejemplo 300 123 4567.",
  ],
  ciudad: [(v) => v.length >= 2, "Escribe tu ciudad."],
  direccion: [(v) => v.length >= 5, "Escribe tu dirección completa."],
};
const FORM = `<form class="chk" id="chk" novalidate hidden><p class="chs"></p>${FIELDS.map(
  ([n, l, ac, t, ph]) =>
    `<label>${l}<input name="${n}" type="${t}" autocomplete="${ac}"${t == "tel" ? ' inputmode="tel"' : ""} placeholder="${ph}" required><small class="fe" aria-live="polite"></small></label>`,
).join("")}</form>`;
const DONE = `<div class="done"><div class="ok">✓</div><h4>Tu pedido está casi listo</h4><p>Se abrió WhatsApp con tu pedido y tus datos. Envía el mensaje para que confirmemos la disponibilidad y el envío contigo.</p></div>`;
const EMPTY = '<p class="empty">Tu carrito está vacío.<br>Agrega tus perfumes favoritos.</p>';
document.body.insertAdjacentHTML(
  "beforeend",
  `<div class="ov" data-a="close"></div><aside class="dr" aria-label="Carrito"><header><button class="back" data-a="back" aria-label="Volver al carrito" hidden>←</button><h3 id="dt">Tu carrito</h3><button data-a="close" aria-label="Cerrar">×</button></header><div class="items"></div>${FORM}<footer></footer></aside><div class="bar" id="bar"><div class="bi"><div class="bt"><span class="bc">0</span><span class="bl">perfumes</span><b class="bp"></b></div><div class="ba"><button class="btn lt" data-a="open">Ver carrito</button><button class="btn pk" data-a="checkout">Confirmar pedido</button></div></div></div>`,
);
const form = $("#chk");
let datos = {};
try {
  datos = JSON.parse(localStorage.getItem("sublivo_datos") || "{}");
} catch (e) {}
FIELDS.forEach(([n]) => {
  if (datos[n]) form.elements[n].value = datos[n];
});
form.addEventListener("input", (e) => {
  datos[e.target.name] = e.target.value;
  try {
    localStorage.setItem("sublivo_datos", JSON.stringify(datos));
  } catch (err) {}
  e.target.setAttribute("aria-invalid", "false");
  e.target.nextElementSibling.textContent = "";
});
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (enviar()) {
    save();
    paint();
  }
});
// Revisa los campos y muestra el error debajo de cada uno
function validar() {
  let primero = null;
  FIELDS.forEach(([n]) => {
    const input = form.elements[n],
      [ok, msg] = RULES[n],
      mal = !ok(input.value.trim());
    input.setAttribute("aria-invalid", mal);
    input.nextElementSibling.textContent = mal ? msg : "";
    if (mal && !primero) primero = input;
  });
  if (primero) primero.focus();
  return !primero;
}
// Arma el mensaje de WhatsApp con el pedido y los datos de entrega
function mensaje() {
  const d = Object.fromEntries(FIELDS.map(([n]) => [n, form.elements[n].value.trim()]));
  return (
    "Hola, Sublivo. Quiero hacer este pedido:\n" +
    Object.keys(cart)
      .map((i) => `• ${cart[i]} × ${byId[i].n} (${byId[i].b}) — ${money(byId[i].p * cart[i])}`)
      .join("\n") +
    `\nTotal: ${money(total())}\n\nMis datos:\nNombre: ${d.nombre} ${d.apellidos}\nCelular: ${d.celular}\nCiudad: ${d.ciudad}\nDirección: ${d.direccion}`
  );
}
function enviar() {
  if (!validar()) return false;
  const url = `https://wa.me/${WA}?text=${encodeURIComponent(mensaje())}`;
  if (!window.open(url, "_blank")) location.href = url;
  view = "done";
  return true;
}
const item = (i) => {
  const p = byId[i];
  return `<div class="it"><img src="img/${i}.jpg" alt=""><div><h4>${esc(p.n)}</h4><div class="br">${esc(p.b)} · ${money(p.p)}</div><div class="row"><div class="step"><button data-a="dec" data-i="${i}">−</button><span>${cart[i]}</span><button data-a="inc" data-i="${i}">+</button></div><b>${money(p.p * cart[i])}</b></div><button class="del" data-a="del" data-i="${i}">Quitar del carrito</button></div></div>`;
};
function paint() {
  $$("[data-c]").forEach((e) => (e.innerHTML = ctl(e.dataset.c)));
  $$(".cartn").forEach((e) => (e.textContent = count()));
  const ids = Object.keys(cart),
    tot = `<div class="tot"><span>Total</span><span>${money(total())}</span></div>`;
  if (!ids.length && view == "form") view = "cart";
  $("#dt").textContent = { cart: "Tu carrito", form: "Tus datos de entrega", done: "¡Gracias por tu pedido!" }[view];
  $(".back").hidden = view != "form";
  $(".items").hidden = view == "form";
  form.hidden = view != "form";
  $(".items").innerHTML = view == "done" ? DONE : ids.length ? ids.map(item).join("") : EMPTY;
  $(".chs").textContent = `${count()} ${count() == 1 ? "perfume" : "perfumes"} · Total ${money(total())}`;
  $(".dr footer").innerHTML = !ids.length
    ? ""
    : view == "form"
      ? `${tot}<button class="btn full" data-a="send">Enviar pedido por WhatsApp</button><small>Tus datos se guardan solo en tu dispositivo, para que no tengas que escribirlos otra vez.</small>`
      : view == "done"
        ? `<button class="btn full" data-a="close">Seguir comprando</button><button class="btn line full" data-a="clear">Vaciar carrito</button>`
        : `${tot}<button class="btn full" data-a="checkout">Confirmar pedido</button><button class="btn line full" data-a="clear">Vaciar carrito</button><small>Envío gratis en Tunja. Envíos a todo el país.</small>`;
  document.body.classList.toggle("has", ids.length > 0);
  $(".bc").textContent = count();
  $(".bl").textContent = count() == 1 ? " perfume" : " perfumes";
  $(".bp").textContent = money(total());
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-a]");
  if (!t) return;
  const a = t.dataset.a,
    i = t.dataset.i;
  if (a == "fav") {
    fav[i] ? delete fav[i] : (fav[i] = 1);
    try {
      localStorage.setItem("sublivo_fav", JSON.stringify(fav));
    } catch (err) {}
    t.classList.toggle("on", !!fav[i]);
    if (window.fk == "fav") window.redraw();
    return;
  }
  if (a == "inc") cart[i] = (cart[i] || 0) + 1;
  if (a == "dec") {
    cart[i] = (cart[i] || 0) - 1;
    if (cart[i] <= 0) delete cart[i];
  }
  if (a == "del") delete cart[i];
  if (a == "clear") {
    cart = {};
    view = "cart";
  }
  if (a == "open") {
    view = "cart";
    document.body.classList.add("open");
  }
  if (a == "checkout") {
    view = "form";
    document.body.classList.add("open");
    setTimeout(() => (FIELDS.map(([n]) => form.elements[n]).find((x) => !x.value.trim()) || form.elements.nombre).focus(), 300);
  }
  if (a == "back") view = "cart";
  if (a == "send" && !enviar()) return;
  if (a == "close") {
    document.body.classList.remove("open");
    if (view == "done") view = "cart";
  }
  save();
  paint();
  if (a == "inc") {
    const s = $('[data-c="' + i + '"] .step');
    s && s.classList.add("pop");
    const b = $("#bar");
    b.classList.remove("bump");
    void b.offsetWidth;
    b.classList.add("bump");
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key == "Escape") document.body.classList.remove("open");
});
addEventListener("storage", (e) => {
  if (e.key == "sublivo_cart") {
    cart = JSON.parse(e.newValue || "{}");
    paint();
  }
});
// páginas de catálogo
const pg = document.body.dataset.page,
  grid = $("#grid");
if (grid) {
  const pool = pg == "marcas" ? P : P.filter((p) => p.g == pg);
  let f = "",
    q = "",
    sort = "",
    brand = pg == "marcas" ? decodeURIComponent(location.hash.slice(1)) : "";
  const flt = (p) =>
    !f ||
    (f == "fav"
      ? fav[p.i]
      : f == "a"
        ? p.p <= 90000
        : f == "b"
          ? p.p > 90000 && p.p <= 110000
          : p.p > 110000);
  const brands = [...new Set(pool.map((p) => p.b))].sort((a, b) =>
    a == "Otras marcas" ? 1 : b == "Otras marcas" ? -1 : a.localeCompare(b),
  );
  const draw = () => {
    let l = pool.filter(
      (p) => (!q || (p.n + " " + p.b).toLowerCase().includes(q)) && (!brand || slug(p.b) == brand) && flt(p),
    );
    if (sort == "asc") l = [...l].sort((a, b) => a.p - b.p);
    if (sort == "desc") l = [...l].sort((a, b) => b.p - a.p);
    $("#n").textContent = l.length + (l.length == 1 ? " perfume" : " perfumes");
    if (pg == "marcas" && !brand && !sort) {
      grid.className = "";
      grid.innerHTML =
        brands
          .map((b) => {
            const x = l.filter((p) => p.b == b);
            return x.length
              ? `<section class="brandsec"><h2>${esc(b)}</h2><div class="grid">${x.map(card).join("")}</div></section>`
              : "";
          })
          .join("") || '<p class="empty">No encontramos ese perfume. Escríbenos y te ayudamos.</p>';
    } else {
      grid.className = "grid";
      grid.innerHTML =
        l.map(card).join("") || '<p class="empty">No encontramos ese perfume. Escríbenos y te ayudamos.</p>';
    }
    paint();
  };
  if (pg == "marcas") {
    const pl = $("#pills");
    const dp = () => {
      pl.innerHTML =
        `<button class="pill ${brand ? "" : "on"}" data-b="">Todas<small>${pool.length}</small></button>` +
        brands
          .map(
            (b) =>
              `<button class="pill ${slug(b) == brand ? "on" : ""}" data-b="${slug(b)}">${esc(b)}<small>${pool.filter((p) => p.b == b).length}</small></button>`,
          )
          .join("");
    };
    pl.onclick = (e) => {
      const b = e.target.closest(".pill");
      if (!b) return;
      brand = b.dataset.b;
      history.replaceState(null, "", "#" + brand);
      dp();
      draw();
      const on = $(".pill.on", pl);
      on && on.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    };
    addEventListener("hashchange", () => {
      brand = decodeURIComponent(location.hash.slice(1));
      dp();
      draw();
    });
    dp();
  }
  $(".tools").insertAdjacentHTML("afterend", '<div class="pills" id="fp"></div>');
  const fp = $("#fp"),
    FL = [
      ["", "Todos"],
      ["a", "Hasta $90.000"],
      ["b", "$90.000 a $110.000"],
      ["c", "Más de $110.000"],
      ["fav", "♥ Favoritos"],
    ];
  const dfp = () =>
    (fp.innerHTML = FL.map(
      ([k, t]) => `<button class="pill ${f == k ? "on" : ""}" data-k="${k}">${t}</button>`,
    ).join(""));
  fp.onclick = (e) => {
    const b = e.target.closest(".pill");
    if (!b) return;
    f = b.dataset.k;
    window.fk = f;
    dfp();
    draw();
  };
  dfp();
  window.redraw = draw;
  $("#q").oninput = (e) => {
    q = e.target.value.trim().toLowerCase();
    draw();
  };
  $("#s").onchange = (e) => {
    sort = e.target.value;
    draw();
  };
  draw();
} else paint();

// Cinta animada: repite el texto para que el desplazamiento no tenga cortes
const mq = $("#marq");
if (mq) mq.textContent = mq.textContent.repeat(12) + mq.textContent.repeat(12);
