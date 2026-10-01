/* ===============================================================
   Carrito LINA Home
   Guarda los productos en localStorage y cierra el pedido en dos pasos:
     1. Productos y totales.
     2. Datos para el envío (nombre, teléfono, ciudad, dirección).

   Cómo se cobra lo decide _config.yml → pago.tranzila_terminal:
     - Vacío:  el pedido se manda por WhatsApp con todos los datos.
     - Lleno:  se abre la página de pago segura de Tranzila (tarjetas,
               Bit, Google Pay). Al pagar vuelve a /thank-you/, y si
               falla, a /payment-failed/ con el carrito intacto.

   IMPORTANTE: GitHub Pages no tiene servidor, así que el monto viaja
   desde el navegador. Antes de despachar, compará en el panel de
   Tranzila que lo cobrado coincida con los productos del pedido.
   =============================================================== */

(function () {
  'use strict';

  var KEY = 'lina_cart_v1';
  var KEY_CLIENTE = 'lina_cliente_v1';
  var KEY_PEDIDO = 'lina_ultimo_pedido_v1';
  var TRANZILA = 'https://direct.tranzila.com/';

  var L = window.LINA || {};
  var T = L.t || {};
  var PAGO = L.pago || {};
  var he = L.lang === 'he';

  // --- Almacenamiento (todo con try/catch: hay navegadores que lo bloquean)

  function leerJSON(k, def) {
    try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? def : v; }
    catch (e) { return def; }
  }
  function guardarJSON(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
  }

  function leer() { return leerJSON(KEY, []); }

  function guardar(items) {
    guardarJSON(KEY, items);
    pintar();
  }

  function producto(slug) {
    return (L.products || []).filter(function (p) { return p.slug === slug; })[0];
  }

  function precio(n) {
    return '<span dir="ltr">₪' + n + '</span>';
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // Líneas del pedido con precio actual del catálogo (nunca el guardado).
  function lineas() {
    var out = [];
    leer().forEach(function (it) {
      var p = producto(it.slug);
      if (p && it.q > 0) out.push({ slug: p.slug, nombre: p.nombre, precio: p.precio, q: it.q });
    });
    return out;
  }

  function totales(ls) {
    var sub = ls.reduce(function (a, i) { return a + i.precio * i.q; }, 0);
    var envio = ls.length ? (L.envio || 0) : 0;
    return { sub: sub, envio: envio, total: sub + envio };
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

  var paso = 1;

  function pintar() {
    var ls = lineas();
    var body = document.getElementById('cartBody');
    var ft = document.getElementById('cartFt');
    var badge = document.getElementById('cartCount');
    if (!body) return;

    var unidades = ls.reduce(function (a, i) { return a + i.q; }, 0);
    if (badge) {
      badge.textContent = unidades;
      badge.hidden = unidades === 0;
    }

    if (!ls.length) {
      irPaso(1);
      body.innerHTML = '<p class="cart-empty">' + esc(T.vacio) + '</p>';
      if (ft) ft.hidden = true;
      return;
    }

    body.innerHTML = ls.map(function (it) {
      var p = producto(it.slug);
      return '' +
        '<div class="ci">' +
          '<div class="ci-img" style="background:' + esc(p.color) + '">' +
            '<img src="' + esc(L.base || '') + '/assets/img/' + esc(p.img) + '" alt="" onerror="this.style.display=\'none\'">' +
          '</div>' +
          '<div class="ci-info">' +
            '<div class="ci-name">' + esc(p.nombre) + '</div>' +
            '<div class="ci-price">' + precio(p.precio) + '</div>' +
            '<div class="ci-qty">' +
              '<button type="button" data-cart-minus="' + esc(p.slug) + '" aria-label="-">−</button>' +
              '<span>' + it.q + '</span>' +
              '<button type="button" data-cart-plus="' + esc(p.slug) + '" aria-label="+">+</button>' +
            '</div>' +
            '<button type="button" class="ci-rm" data-cart-rm="' + esc(p.slug) + '">' + esc(T.quitar) + '</button>' +
          '</div>' +
        '</div>';
    }).join('');

    var t = totales(ls);
    document.getElementById('cartSub').innerHTML = precio(t.sub);
    document.getElementById('cartShip').innerHTML = precio(t.envio);
    document.getElementById('cartTotal').innerHTML = precio(t.total);
    if (ft) ft.hidden = false;
  }

  // Cambia entre "productos" (1) y "datos de envío" (2).
  function irPaso(n) {
    paso = n;
    var body = document.getElementById('cartBody');
    var form = document.getElementById('cartForm');
    var next = document.getElementById('cartNext');
    var pay = document.getElementById('cartPay');
    var back = document.getElementById('cartBack');
    if (!form) return;
    body.hidden = n !== 1;
    form.hidden = n !== 2;
    next.hidden = n !== 1;
    pay.hidden = n !== 2;
    back.hidden = n !== 2;
    if (n === 2) {
      rellenar(form);
      form.scrollTop = 0;
      // Foco en el primer dato obligatorio que falte (o en el nombre).
      var vacio = Array.prototype.filter.call(form.querySelectorAll('input[required]'), function (i) {
        return i.type === 'checkbox' ? !i.checked : !i.value;
      })[0];
      (vacio || form.elements.contact).focus();
    }
  }

  // Si el cliente ya compró desde este navegador, le ahorramos tipear.
  function rellenar(form) {
    var c = leerJSON(KEY_CLIENTE, {});
    ['contact', 'phone', 'email', 'city', 'address'].forEach(function (k) {
      var el = form.elements[k];
      if (el && !el.value && c[k]) el.value = c[k];
    });
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
    var cerrarBtn = document.getElementById('cartClose');
    if (cerrarBtn) cerrarBtn.focus();
  }

  function cerrar() {
    var c = document.getElementById('cart');
    var b = document.getElementById('cartBd');
    if (!c || c.hidden) return;
    c.hidden = true; b.hidden = true;
    document.body.style.overflow = '';
    irPaso(1);
    if (ultimoFoco) ultimoFoco.focus();
  }

  // --- Cierre del pedido ----------------------------------------

  function nuevoNumero() {
    var d = new Date();
    var p2 = function (n) { return (n < 10 ? '0' : '') + n; };
    var rnd = Math.floor(1000 + Math.random() * 9000);
    return 'L' + String(d.getFullYear()).slice(2) + p2(d.getMonth() + 1) + p2(d.getDate()) + '-' + rnd;
  }

  function datosDe(form) {
    var g = function (k) { return (form.elements[k] && form.elements[k].value || '').trim(); };
    return {
      contact: g('contact'), phone: g('phone'), email: g('email'),
      city: g('city'), address: g('address'), notes: g('notes')
    };
  }

  function confirmar(e) {
    e.preventDefault();
    var form = e.target;
    var ls = lineas();
    if (!ls.length) return;

    var cli = datosDe(form);
    var t = totales(ls);
    var pedido = {
      numero: nuevoNumero(),
      fecha: new Date().toISOString(),
      items: ls, sub: t.sub, envio: t.envio, total: t.total,
      cliente: cli, lang: L.lang
    };

    guardarJSON(KEY_CLIENTE, {
      contact: cli.contact, phone: cli.phone, email: cli.email, city: cli.city, address: cli.address
    });
    guardarJSON(KEY_PEDIDO, pedido);

    if (PAGO.terminal) pagarTranzila(pedido);
    else enviarWhatsApp(pedido);
  }

  // Texto del pedido: sirve para WhatsApp y para las notas de Tranzila.
  function resumen(p, conCliente) {
    var r = [];
    r.push((he ? 'הזמנה ' : 'Order ') + p.numero + ' — LINA Home');
    r.push('');
    p.items.forEach(function (i) {
      r.push('• ' + i.nombre + ' × ' + i.q + ' — ₪' + (i.precio * i.q));
    });
    r.push('');
    r.push((he ? 'ביניים: ' : 'Subtotal: ') + '₪' + p.sub);
    r.push((he ? 'משלוח: ' : 'Shipping: ') + '₪' + p.envio);
    r.push((he ? 'סה״כ: ' : 'Total: ') + '₪' + p.total);
    if (conCliente) {
      var c = p.cliente;
      r.push('');
      r.push((he ? 'שם: ' : 'Name: ') + c.contact);
      r.push((he ? 'טלפון: ' : 'Phone: ') + c.phone);
      if (c.email) r.push((he ? 'מייל: ' : 'Email: ') + c.email);
      r.push((he ? 'כתובת: ' : 'Address: ') + c.address + ', ' + c.city);
      if (c.notes) r.push((he ? 'הערות: ' : 'Notes: ') + c.notes);
    }
    return r.join('\n');
  }

  function enviarWhatsApp(p) {
    var url = 'https://wa.me/' + L.whatsapp + '?text=' + encodeURIComponent(resumen(p, true));
    window.open(url, '_blank', 'noopener');
  }

  // Arma un formulario oculto y lo manda a la página segura de Tranzila.
  // Parámetros según la documentación de Tranzila (iframenew.php).
  function pagarTranzila(p) {
    var c = p.cliente;
    var compra = p.items.map(function (i) {
      return { product_name: i.nombre, product_quantity: i.q, product_price: i.precio };
    });
    if (p.envio) compra.push({ product_name: he ? 'משלוח' : 'Shipping', product_quantity: 1, product_price: p.envio });

    var campos = {
      sum: p.total,
      currency: 1,                       // 1 = shékels
      lang: he ? 'il' : 'us',
      pdesc: 'LINA Home ' + p.numero,
      contact: c.contact,
      phone: c.phone,
      email: c.email,
      address: c.address,
      city: c.city,
      remarks: (p.numero + (c.notes ? ' | ' + c.notes : '')).slice(0, 250),
      json_purchase_data: encodeURIComponent(JSON.stringify(compra)),
      u71: 1,                            // muestra el detalle de productos
      DCdisable: p.numero,               // evita cobrar dos veces el mismo pedido
      orden: p.numero,                   // vuelve en la URL de éxito
      success_url_address: L.abs + '/' + L.lang + '/thank-you/',
      fail_url_address: L.abs + '/' + L.lang + '/payment-failed/',
      nologo: 1,
      accessibility: 2,
      trBgColor: 'FDFBF7',
      trTextColor: '2E211A',
      trButtonColor: 'B5674D',
      buttonLabel: (T.pagar || '') + ' ₪' + p.total
    };
    if (PAGO.cuotasMax > 1) campos.maxpay = PAGO.cuotasMax;
    else campos.cred_type = 1;
    if (PAGO.bit) campos.bit_pay = 1;
    if (PAGO.googlePay) campos.google_pay = 1;
    if (PAGO.paypal) campos.ppnewwin = 2;

    var f = document.createElement('form');
    f.method = 'POST';
    f.action = TRANZILA + encodeURIComponent(PAGO.terminal) + '/iframenew.php';
    f.acceptCharset = 'UTF-8';
    Object.keys(campos).forEach(function (k) {
      var v = campos[k];
      if (v === '' || v == null) return;
      var i = document.createElement('input');
      i.type = 'hidden'; i.name = k; i.value = v;
      f.appendChild(i);
    });
    document.body.appendChild(f);
    f.submit();
  }

  // --- Páginas de resultado (thank-you / payment-failed) -----------

  function paginaResultado() {
    var ok = document.getElementById('orderOk');
    var fail = document.getElementById('orderFail');
    var p = leerJSON(KEY_PEDIDO, null);

    if (ok) {
      var box = document.getElementById('orderSummary');
      var wa = document.getElementById('orderWa');
      if (p && box) {
        box.innerHTML =
          '<p class="order-num">' + esc(T.pedidoNum) + ' <strong dir="ltr">' + esc(p.numero) + '</strong></p>' +
          '<ul class="order-items">' + p.items.map(function (i) {
            return '<li><span>' + esc(i.nombre) + ' × ' + i.q + '</span>' + precio(i.precio * i.q) + '</li>';
          }).join('') +
          '<li class="order-total"><span>' + esc(he ? 'סה״כ כולל משלוח' : 'Total incl. shipping') + '</span>' + precio(p.total) + '</li></ul>';
        if (wa) wa.href = 'https://wa.me/' + L.whatsapp + '?text=' + encodeURIComponent(resumen(p, true));
      } else if (box) {
        box.innerHTML = '<p>' + esc(T.pedidoVacio) + '</p>';
      }
      // Pago hecho: vaciamos el carrito.
      guardarJSON(KEY, []);
      pintar();
    }

    if (fail) {
      var retry = document.getElementById('orderRetry');
      if (retry) retry.addEventListener('click', function () { abrir(); });
    }
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
    if (e.target.closest('#cartNext')) irPaso(2);
    if (e.target.closest('#cartBack')) irPaso(1);
  });

  document.addEventListener('submit', function (e) {
    if (e.target.id === 'cartForm') confirmar(e);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') cerrar();
  });

  document.addEventListener('DOMContentLoaded', function () {
    pintar();
    paginaResultado();
  });

  window.LinaCart = { agregar: agregar, abrir: abrir, cerrar: cerrar };
})();
