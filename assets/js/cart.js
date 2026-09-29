/* ===============================================================
   Carrito LINA Home
   Guarda en localStorage y cierra el pedido por WhatsApp.

   >>> ACÁ ENTRA LA PASARELA DE PAGO EN EL FUTURO <<<
   Cuando tengas volumen y quieras cobrar automático, lo único
   que cambia es la función checkout() de abajo: en vez de abrir
   WhatsApp, crea una sesión de pago y redirige. El resto del
   carrito (items, totales, persistencia) queda igual.
   =============================================================== */

(function () {
  'use strict';

  var KEY = 'lina_cart_v1';
  var L = window.LINA || {};
  var T = L.t || {};

  function leer() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch (e) { return []; }
  }

  function guardar(items) {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {}
    pintar();
  }

  function producto(slug) {
    return (L.products || []).filter(function (p) { return p.slug === slug; })[0];
  }

  function precio(n) {
    return '<span dir="ltr">₪' + n + '</span>';
  }

  // --- Acciones públicas ---------------------------------------

  function agregar(slug, cantidad) {
    var items = leer();
    var hay = items.filter(function (i) { return i.slug === slug; })[0];
    if (hay) { hay.q += (cantidad || 1); }
    else { items.push({ slug: slug, q: cantidad || 1 }); }
    guardar(items);
    abrir();
  }

  function cambiar(slug, delta) {
    var items = leer();
    for (var i = 0; i < items.length; i++) {
      if (items[i].slug === slug) {
        items[i].q += delta;
        if (items[i].q < 1) { items.splice(i, 1); }
        break;
      }
    }
    guardar(items);
  }

  function quitar(slug) {
    guardar(leer().filter(function (i) { return i.slug !== slug; }));
  }

  // --- Render ---------------------------------------------------

  function pintar() {
    var items = leer();
    var body = document.getElementById('cartBody');
    var ft = document.getElementById('cartFt');
    var badge = document.getElementById('cartCount');
    if (!body) return;

    var unidades = items.reduce(function (a, i) { return a + i.q; }, 0);
    if (badge) {
      badge.textContent = unidades;
      badge.hidden = unidades === 0;
    }

    if (!items.length) {
      body.innerHTML = '<p class="cart-empty">' + (T.vacio || '') + '</p>';
      if (ft) ft.hidden = true;
      return;
    }

    var sub = 0;
    var html = '';

    items.forEach(function (it) {
      var p = producto(it.slug);
      if (!p) return;
      sub += p.precio * it.q;
      html +=
        '<div class="ci">' +
          '<div class="ci-img" style="background:' + p.color + '">' +
            '<img src="' + (L.base || '') + '/assets/img/' + p.img + '" alt="" onerror="this.style.display=\'none\'">' +
          '</div>' +
          '<div class="ci-info">' +
            '<div class="ci-name">' + p.nombre + '</div>' +
            '<div class="ci-price">' + precio(p.precio) + '</div>' +
            '<div class="ci-qty">' +
              '<button data-cart-minus="' + p.slug + '" aria-label="-">−</button>' +
              '<span>' + it.q + '</span>' +
              '<button data-cart-plus="' + p.slug + '" aria-label="+">+</button>' +
            '</div>' +
            '<button class="ci-rm" data-cart-rm="' + p.slug + '">' + (T.quitar || '') + '</button>' +
          '</div>' +
        '</div>';
    });

    body.innerHTML = html;

    var envio = L.envio || 0;
    document.getElementById('cartSub').innerHTML = precio(sub);
    document.getElementById('cartShip').innerHTML = precio(envio);
    document.getElementById('cartTotal').innerHTML = precio(sub + envio);
    if (ft) ft.hidden = false;
  }

  // --- Abrir y cerrar -------------------------------------------

  var ultimoFoco = null;

  function abrir() {
    var c = document.getElementById('cart');
    var b = document.getElementById('cartBd');
    if (!c) return;
    ultimoFoco = document.activeElement;
    c.hidden = false; b.hidden = false;
    document.body.style.overflow = 'hidden';
    var cerrar = document.getElementById('cartClose');
    if (cerrar) cerrar.focus();
  }

  function cerrar() {
    var c = document.getElementById('cart');
    var b = document.getElementById('cartBd');
    if (!c) return;
    c.hidden = true; b.hidden = true;
    document.body.style.overflow = '';
    if (ultimoFoco) ultimoFoco.focus();
  }

  // --- Cierre del pedido ----------------------------------------

  function checkout() {
    var items = leer();
    if (!items.length) return;

    var he = L.lang === 'he';
    var lineas = [];
    var sub = 0;

    lineas.push(he ? 'הזמנה חדשה — LINA Home' : 'New order — LINA Home');
    lineas.push('');

    items.forEach(function (it) {
      var p = producto(it.slug);
      if (!p) return;
      sub += p.precio * it.q;
      lineas.push('• ' + p.nombre + ' × ' + it.q + ' — ₪' + (p.precio * it.q));
    });

    var envio = L.envio || 0;
    lineas.push('');
    lineas.push((he ? 'ביניים: ' : 'Subtotal: ') + '₪' + sub);
    lineas.push((he ? 'משלוח: ' : 'Shipping: ') + '₪' + envio);
    lineas.push((he ? 'סה״כ: ' : 'Total: ') + '₪' + (sub + envio));

    var url = 'https://wa.me/' + L.whatsapp + '?text=' + encodeURIComponent(lineas.join('\n'));
    window.open(url, '_blank', 'noopener');
  }

  // --- Eventos ---------------------------------------------------

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-cart-add],[data-cart-plus],[data-cart-minus],[data-cart-rm]');
    if (t) {
      if (t.dataset.cartAdd) {
        agregar(t.dataset.cartAdd, 1);
        var etiqueta = t.querySelector('.btn-label') || t;
        var original = etiqueta.textContent;
        etiqueta.textContent = T.agregado || original;
        setTimeout(function () { etiqueta.textContent = original; }, 1600);
      }
      if (t.dataset.cartPlus) cambiar(t.dataset.cartPlus, 1);
      if (t.dataset.cartMinus) cambiar(t.dataset.cartMinus, -1);
      if (t.dataset.cartRm) quitar(t.dataset.cartRm);
      return;
    }
    if (e.target.closest('#cartOpen')) abrir();
    if (e.target.closest('#cartClose') || e.target.id === 'cartBd') cerrar();
    if (e.target.closest('#cartCheckout')) checkout();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') cerrar();
  });

  document.addEventListener('DOMContentLoaded', pintar);

  window.LinaCart = { agregar: agregar, abrir: abrir, cerrar: cerrar };
})();
