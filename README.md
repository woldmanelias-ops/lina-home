# LINA Home — sitio web

Sitio bilingüe hebreo/inglés. Corre con Jekyll, que GitHub Pages
ejecuta solo: no hay que instalar ni compilar nada.

---

## 1. Dónde está publicado

El sitio vive en el repo `woldmanelias-ops/lina-home` y GitHub Pages lo
publica solo en `https://woldmanelias-ops.github.io/lina-home/`.
Cada cambio que subas a la rama `main` se publica en uno o dos minutos.

### Conectar el dominio propio (cuando lo compres)

1. Comprá `linahomeil.com` (Namecheap, GoDaddy, o donde prefieras).
2. En el panel del dominio, creá un registro **CNAME** con host `www`
   apuntando a `woldmanelias-ops.github.io`.
3. En `_config.yml` cambiá `url` a `"https://www.linahomeil.com"` y
   `baseurl` a `""`.
4. En **Settings → Pages → Custom domain**, escribí `www.linahomeil.com`
   (GitHub crea solo el archivo `CNAME`).
5. Marcá **Enforce HTTPS**. Tarda hasta 24 horas en activarse.

---

## 2. Agregar un producto

Tres pasos, sin tocar código.

**a)** Abrí `_data/products.yml` y copiá un bloque entero al final:

```yaml
- slug: nombre-del-producto        # define la URL, sin ñ ni acentos
  categoria: salon                 # salon | dormitorio | bano
  precio: 199
  destacado: false                 # true lo muestra en la home
  nuevo: 5                         # número más alto = aparece primero
  img: nombre-del-producto.webp
  color: "#C9B8A3"                 # color del placeholder si falta la foto
  he:
    nombre: "שם המוצר"
    corto: "תיאור קצר."
    medidas: "40 × 60 ס״מ"
    material: "כותנה"
  en:
    nombre: "Product name"
    corto: "Short description."
    medidas: "40 × 60 cm"
    material: "Cotton"
```

**b)** Copiá un archivo de `_he/producto/` y uno de `_en/producto/`,
renombralos con el slug nuevo y cambiá el texto de adentro.

**c)** Subí la foto a `assets/img/` con el nombre que pusiste en `img`.

> **Importante para Google:** escribí la descripción vos, con tus palabras.
> Copiar el texto del proveedor es lo que hunde a las tiendas de
> dropshipping en las búsquedas, porque Google lo detecta como duplicado.

---

## 3. Agregar un artículo al blog

Copiá un archivo de `_he/blog/` y uno de `_en/blog/`, renombralos,
y cambiá el contenido. Mantené el mismo `translation_key` en los dos
para que Google entienda que son la misma página en otro idioma.

Publicar un artículo cada dos o tres semanas es lo que mueve el tráfico
orgánico. La estructura ya está lista; lo que falta es escribir.

---

## 4. Cambiar datos de contacto

Todo junto en `_config.yml`, sección `marca`. Tocás ahí y se actualiza
en todas las páginas.

---

## 5. Cambiar textos de botones y menús

- Hebreo: `_data/he.yml`
- Inglés: `_data/en.yml`

Las dos tienen las mismas claves. Si agregás una en un archivo,
agregala en el otro.

---

## Reglas que conviene no romper

**En los archivos `.yml` y en el front matter, poné los textos entre comillas.**
Un signo de interrogación o dos puntos sin comillas rompe el archivo y
el sitio deja de compilar. Si algo deja de funcionar después de un cambio,
eso es lo primero que hay que mirar.

**En el CSS, no uses `left`, `right`, `margin-left` ni `padding-right.`**
Todo está escrito con propiedades lógicas (`inline-start` / `inline-end`)
para que el hebreo RTL se espeje solo. Una sola regla con `left` rompe
el layout en hebreo sin romperlo en inglés, y es difícil de encontrar después.

**No uses `page.dir` en los templates.** En las páginas sueltas (home, FAQ,
envíos, categorías) Jekyll lo pisa con la carpeta ("/he/"). La dirección
se calcula del idioma en `_layouts/base.html`.

---

## 6. Cobros (Tranzila)

El carrito tiene dos pasos: productos y datos de envío (nombre, teléfono,
ciudad, dirección y aceptar el תקנון). Qué pasa al confirmar depende de
`pago.tranzila_terminal` en `_config.yml`:

- **Vacío (hoy):** el pedido llega a tu WhatsApp con productos, total y
  todos los datos de envío. Cobrás por transferencia o Bit como hasta ahora.
- **Con el nombre de la terminal:** el botón pasa a "לתשלום מאובטח" y el
  cliente paga en la página segura de Tranzila con tarjeta, Bit o Google Pay.
  Si paga, vuelve a `/thank-you/` (se vacía el carrito y puede mandarte el
  pedido por WhatsApp). Si falla, vuelve a `/payment-failed/` con el
  carrito intacto.

Para activarlo:

1. Abrí el עוסק (פטור o מורשה). Tranzila no te abre terminal sin eso.
2. Firmá con Tranzila y pediles que activen en la terminal: **Bit**,
   **Google Pay** y, si querés, **cuotas** y **PayPal**.
3. Pediles que registren estas direcciones en la terminal (Tranzila exige
   que estén cargadas):
   - Éxito: `https://woldmanelias-ops.github.io/lina-home/he/thank-you/` y `/en/thank-you/`
   - Falla: `https://woldmanelias-ops.github.io/lina-home/he/payment-failed/` y `/en/payment-failed/`
   - Si después conectás el dominio, cambialas por las de `www.linahomeil.com`.
4. En `_config.yml` → `pago`, escribí el nombre de la terminal y ajustá
   `bit`, `google_pay`, `paypal` y `cuotas_max`.
5. Hacé una compra de prueba con poco monto y anulala desde el panel.

**Antes de despachar cada pedido**, mirá en el panel de Tranzila que el
monto cobrado coincida con los productos del pedido (el número de pedido
`L…` aparece en la descripción). GitHub Pages no tiene servidor, así que
el monto sale del navegador del cliente; esta revisión es lo que evita
que alguien te pague de menos.

Apple Pay necesita además verificar el dominio con Tranzila: conviene
hacerlo después de conectar `linahomeil.com`.

---

## 7. Páginas legales

`/terms/` (תקנון), `/privacy/` y `/accessibility/`, en los dos idiomas, con
link en el footer. Son **borradores**: que los revise un abogado antes de
promocionar. Cuando abras el עוסק, completá en `_config.yml` → `marca`:
`titular`, `numero_osek`, `direccion` y `coordinador_accesibilidad`, y
aparecen solos en esas páginas. Si agregás el Pixel de Meta o Google
Analytics, actualizá la sección correspondiente de `/privacy/`.

---

## Pendientes

- [ ] Subir el logo a `assets/img/` y reemplazar el texto "LINA" del header
- [ ] Fotos reales de producto (por ahora hay placeholders de color)
- [ ] Foto del hero en `assets/img/hero.webp`
- [ ] Cargar los productos reales (kit mesa y kit living) en `_data/products.yml`
- [ ] Poner los links reales de Instagram y Facebook en `_config.yml`
- [ ] Que alguien con hebreo nativo revise los textos antes de promocionar
- [ ] Que un abogado revise תקנון, privacidad y accesibilidad
- [ ] Sumar una sección de reseñas cuando haya reseñas reales de clientes
- [ ] Dar de alta el sitio en Google Search Console
- [ ] Crear el perfil de Google Business Profile
- [ ] Conectar el newsletter a un servicio real (ver `assets/js/main.js`)
- [ ] Pixel de Meta para medir las ventas de los anuncios
- [ ] Abrir el עוסק y la terminal de Tranzila (ver sección 6)
