/* ===============================================================
   LINA Home — interacciones generales.
   Menú móvil, header al scrollear, filtros del catálogo,
   newsletter, contacto y chatbot.
   =============================================================== */

(function () {
  'use strict';

  var L = window.LINA || {};
  var T = L.t || {};

  // --- Header: borde al despegarse del tope ---------------------
  var hdr = document.getElementById('hdr');
  if (hdr) {
    var marcar = function () {
      hdr.classList.toggle('is-stuck', window.scrollY > 8);
    };
    marcar();
    window.addEventListener('scroll', marcar, { passive: true });
  }

  // --- Menú móvil ------------------------------------------------
  var burger = document.getElementById('burger');
  var ov = document.getElementById('menuOv');
  if (burger && ov) {
    burger.addEventListener('click', function () {
      var abierto = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!abierto));
      ov.hidden = abierto;
      document.body.style.overflow = abierto ? '' : 'hidden';
    });
    ov.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        burger.setAttribute('aria-expanded', 'false');
        ov.hidden = true;
        document.body.style.overflow = '';
      }
    });
  }

  // --- Chatbot ---------------------------------------------------
  var fab = document.getElementById('botFab');
  var bot = document.getElementById('bot');
  if (fab && bot) {
    fab.addEventListener('click', function () {
      var abierto = fab.getAttribute('aria-expanded') === 'true';
      fab.setAttribute('aria-expanded', String(!abierto));
      bot.hidden = abierto;
    });
    var botClose = document.getElementById('botClose');
    if (botClose) botClose.addEventListener('click', function () {
      fab.setAttribute('aria-expanded', 'false');
      bot.hidden = true;
      fab.focus();
    });
  }

  // --- Catálogo: búsqueda, filtros y orden ----------------------
  var grid = document.getElementById('grid');

  if (grid) {
    var qIn = document.getElementById('fQ');
    var catIn = document.getElementById('fCat');
    var precioIn = document.getElementById('fPrecio');
    var ordenIn = document.getElementById('fOrden');
    var vacio = document.getElementById('gridEmpty');

    var pintarGrid = function () {
      var lista = (L.products || []).slice();
      var q = (qIn && qIn.value || '').trim().toLowerCase();
      var cat = catIn && catIn.value || '';
      var rango = precioIn && precioIn.value || '';
      var orden = ordenIn && ordenIn.value || 'nuevo';

      if (q) {
        lista = lista.filter(function (p) {
          return (p.nombre + ' ' + p.corto).toLowerCase().indexOf(q) > -1;
        });
      }
      if (cat) lista = lista.filter(function (p) { return p.cat === cat; });

      if (rango) {
        var partes = rango.split('-');
        var min = parseInt(partes[0], 10) || 0;
        var max = partes[1] ? parseInt(partes[1], 10) : Infinity;
        lista = lista.filter(function (p) { return p.precio >= min && p.precio <= max; });
      }

      lista.sort(function (a, b) {
        if (orden === 'precio_asc') return a.precio - b.precio;
        if (orden === 'precio_desc') return b.precio - a.precio;
        return b.nuevo - a.nuevo;
      });

      if (!lista.length) {
        grid.innerHTML = '';
        if (vacio) { vacio.hidden = false; vacio.textContent = T.sinResultados || ''; }
        return;
      }
      if (vacio) vacio.hidden = true;

      grid.innerHTML = lista.map(function (p) {
        return '' +
          '<a class="card" href="' + (L.base || '') + '/' + L.lang + '/producto/' + p.slug + '/">' +
            '<div class="card-img" style="--ph:' + p.color + '">' +
              '<img src="' + (L.base || '') + '/assets/img/' + p.img + '" alt="' + p.nombre + '" loading="lazy" width="600" height="750" ' +
              'onerror="this.style.display=\'none\';this.parentNode.classList.add(\'is-ph\')">' +
              '<span class="card-ph">' + p.nombre + '</span>' +
            '</div>' +
            '<h3>' + p.nombre + '</h3>' +
            '<p class="card-price"><span dir="ltr">₪' + p.precio + '</span></p>' +
          '</a>';
      }).join('');
    };

    [qIn, catIn, precioIn, ordenIn].forEach(function (el) {
      if (!el) return;
      el.addEventListener(el.tagName === 'INPUT' ? 'input' : 'change', pintarGrid);
    });

    pintarGrid();
  }

  // --- Newsletter -------------------------------------------------
  var nl = document.getElementById('nlForm');
  if (nl) {
    nl.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = nl.querySelector('input[type=email]');
      if (!email || !email.value || email.value.indexOf('@') < 1) {
        email.focus();
        return;
      }
      // TODO: conectar acá un servicio de email (Mailchimp, Brevo, Buttondown).
      // Por ahora solo confirma en pantalla.
      nl.innerHTML = '<p class="form-ok">' + (T.gracias || '') + '</p>';
    });
  }

  // --- Contacto: abre WhatsApp con el mensaje armado ---------------
  var cf = document.getElementById('contactForm');
  if (cf) {
    cf.addEventListener('submit', function (e) {
      e.preventDefault();
      var nombre = cf.querySelector('[name=nombre]').value;
      var mensaje = cf.querySelector('[name=mensaje]').value;
      if (!mensaje.trim()) return;
      var texto = (L.lang === 'he' ? 'שלום, אני ' : 'Hi, I am ') + nombre + '.\n' + mensaje;
      window.open('https://wa.me/' + L.whatsapp + '?text=' + encodeURIComponent(texto), '_blank', 'noopener');
    });
  }
})();
