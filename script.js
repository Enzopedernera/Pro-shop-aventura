// =============================================
// SCRIPT — Aventura Pro Shop
// Versión mejorada con:
//   - Selector de fechas en home → pasa fechas al checkout
//   - WhatsApp flotante con tooltip
//   - FAQ accordion nativo (usa <details>, no necesita JS)
//   - Todas las funciones originales preservadas
// =============================================

// ── SISTEMA DE TOASTS ─────────────────────────────────────────────────────
function mostrarToast(mensaje, tipo = "info", duracion = 4000) {
  let contenedor = document.getElementById("toast-contenedor");
  if (!contenedor) {
    contenedor = document.createElement("div");
    contenedor.id = "toast-contenedor";
    document.body.appendChild(contenedor);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${tipo}`;
  toast.setAttribute("role", tipo === "error" ? "alert" : "status");
  toast.setAttribute("aria-live", tipo === "error" ? "assertive" : "polite");

  const iconos = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️" };
  toast.innerHTML = `
    <span class="toast-icono">${iconos[tipo] || "ℹ️"}</span>
    <span class="toast-mensaje">${mensaje}</span>
    <button class="toast-cerrar" aria-label="Cerrar">✕</button>
  `;

  toast.querySelector(".toast-cerrar").addEventListener("click", () => cerrarToast(toast));
  contenedor.appendChild(toast);

  // Entrada animada
  requestAnimationFrame(() => toast.classList.add("toast-visible"));

  // Auto-cierre
  const timer = setTimeout(() => cerrarToast(toast), duracion);
  toast._timer = timer;
}

function cerrarToast(toast) {
  clearTimeout(toast._timer);
  toast.classList.remove("toast-visible");
  toast.addEventListener("transitionend", () => toast.remove(), { once: true });
}
// ─────────────────────────────────────────────────────────────────────────────

let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

function guardarCarrito() {
  localStorage.setItem("carrito", JSON.stringify(carrito));
}

function obtenerCantidadTotal() {
  return carrito.reduce((acc, item) => acc + item.cantidad, 0);
}

function actualizarContador() {
  const contador = document.getElementById("contadorCarrito");
  if (contador) contador.textContent = obtenerCantidadTotal();
}

function agregarAlCarrito(nombre, precio, medida = "") {
  const existe = carrito.find(
    (item) => item.nombre === nombre && item.medida === medida,
  );
  if (existe) {
    existe.cantidad++;
  } else {
    carrito.push({ nombre, precio, medida, cantidad: 1 });
  }
  guardarCarrito();
  renderCarrito();
  actualizarContador();
  animarCarrito();
}

function animarCarrito() {
  const icono = document.querySelector(".carrito-icono");
  if (!icono) return;
  icono.classList.add("shake");
  setTimeout(() => icono.classList.remove("shake"), 300);
}

function cambiarCantidad(index, cambio) {
  carrito[index].cantidad += cambio;
  if (carrito[index].cantidad <= 0) carrito.splice(index, 1);
  guardarCarrito();
  renderCarrito();
  actualizarContador();
}

function eliminarItem(index) {
  carrito.splice(index, 1);
  guardarCarrito();
  renderCarrito();
  actualizarContador();
}

function vaciarCarrito() {
  carrito = [];
  guardarCarrito();
  renderCarrito();
  actualizarContador();
}

function formatearPrecio(num) {
  return num.toLocaleString("es-AR");
}

function renderCarrito() {
  const lista = document.getElementById("listaCarrito");
  const totalSpan = document.getElementById("total");
  const btnFinalizar = document.getElementById("btnFinalizar");

  if (!lista || !totalSpan) return;

  lista.innerHTML = "";
  let total = 0;

  if (carrito.length === 0) {
    const vacio = document.createElement("p");
    vacio.style.cssText =
      "color:#999;font-size:14px;text-align:center;padding:30px 0";
    vacio.textContent = "Tu carrito está vacío 🛒";
    lista.appendChild(vacio);
    if (btnFinalizar) btnFinalizar.classList.add("disabled");
  } else {
    if (btnFinalizar) btnFinalizar.classList.remove("disabled");

    carrito.forEach((item, index) => {
      const div = document.createElement("div");
      div.classList.add("item-carrito");

      const info = document.createElement("div");
      info.classList.add("item-info");

      const nombre = document.createElement("strong");
      nombre.textContent = item.nombre;
      info.appendChild(nombre);

      if (item.medida) {
        const medida = document.createElement("small");
        medida.textContent = `(${item.medida})`;
        info.appendChild(medida);
      }

      const controles = document.createElement("div");
      controles.classList.add("item-controles");

      const btnMenos = document.createElement("button");
      btnMenos.textContent = "−";
      btnMenos.setAttribute("aria-label", "Reducir cantidad");
      btnMenos.onclick = () => cambiarCantidad(index, -1);

      const cantidad = document.createElement("span");
      cantidad.textContent = item.cantidad;

      const btnMas = document.createElement("button");
      btnMas.textContent = "+";
      btnMas.setAttribute("aria-label", "Aumentar cantidad");
      btnMas.onclick = () => cambiarCantidad(index, 1);

      controles.appendChild(btnMenos);
      controles.appendChild(cantidad);
      controles.appendChild(btnMas);

      const precio = document.createElement("div");
      precio.classList.add("item-precio");
      precio.textContent = `$${formatearPrecio(item.precio * item.cantidad)}`;

      const btnEliminar = document.createElement("button");
      btnEliminar.classList.add("eliminar");
      btnEliminar.textContent = "✕";
      btnEliminar.setAttribute("aria-label", `Eliminar ${item.nombre}`);
      btnEliminar.onclick = () => eliminarItem(index);

      div.appendChild(info);
      div.appendChild(controles);
      div.appendChild(precio);
      div.appendChild(btnEliminar);
      lista.appendChild(div);

      total += item.precio * item.cantidad;
    });
  }

  totalSpan.textContent = formatearPrecio(total);
}

// ── FILTROS DE PRODUCTOS ───────────────────────
function filtrarProductos(categoria, botonActivo) {
  document.querySelectorAll(".producto").forEach((producto) => {
    const cat = producto.dataset.categoria;
    if (!cat) {
      producto.style.display = "flex";
      return;
    }
    producto.style.display =
      categoria === "todos" || cat === categoria ? "flex" : "none";
  });

  if (botonActivo) {
    document
      .querySelectorAll(".filtros button")
      .forEach((btn) => btn.classList.remove("activo"));
    botonActivo.classList.add("activo");
  }
}

// ── SELECTOR DE FECHAS EN HOME ────────────────
function initSelectorFechas() {
  const fechaLlegada = document.getElementById("fechaLlegada");
  const fechaSalida = document.getElementById("fechaSalida");
  const cantPersonas = document.getElementById("cantPersonas");
  const btnBuscar = document.getElementById("btnBuscarEquipos");

  if (!fechaLlegada || !btnBuscar) return;

  // Fecha mínima = hoy
  const hoy = new Date().toISOString().split("T")[0];
  fechaLlegada.min = hoy;
  fechaSalida.min = hoy;

  // Cuando cambia fecha llegada, actualizar mínimo en fecha salida
  fechaLlegada.addEventListener("change", () => {
    if (fechaSalida) {
      fechaSalida.min = fechaLlegada.value;
      if (fechaSalida.value && fechaSalida.value <= fechaLlegada.value) {
        fechaSalida.value = "";
      }
    }
  });

  // Al hacer clic en buscar, guardar fechas y redirigir
  btnBuscar.addEventListener("click", (e) => {
    e.preventDefault();
    const llegada = fechaLlegada.value;
    const salida = fechaSalida.value;
    const personas = cantPersonas ? cantPersonas.value : "1";

    // Guardar en localStorage para pre-completar el checkout
    if (llegada) localStorage.setItem("fechaLlegada", llegada);
    if (salida) localStorage.setItem("fechaSalida", salida);
    if (personas) localStorage.setItem("cantPersonas", personas);

    // Marcar que viene del selector del home (no un link directo)
    sessionStorage.setItem("desdeHome", "1");

    window.location.href = "./page/checkout.html";
  });
}

// ── INIT CHECKOUT CON FECHAS PRE-CARGADAS ────
function initFechasCheckout() {
  const listaEsquiadores = document.getElementById("listaEsquiadores");
  if (!listaEsquiadores) return;

  // Limpiar siempre cualquier reserva confirmada anterior
  // para que no aparezca el modal de confirmación en una sesión nueva.
  localStorage.removeItem("reservaConfirmada");

  // Si NO viene del selector del home, limpiar datos viejos para evitar
  // que se pre-carguen fechas/personas de una sesión anterior.
  const desdeHome = sessionStorage.getItem("desdeHome");
  if (!desdeHome) {
    localStorage.removeItem("fechaLlegada");
    localStorage.removeItem("fechaSalida");
    localStorage.removeItem("cantPersonas");
  }
  // Consumir la marca para que no persista entre recargas
  sessionStorage.removeItem("desdeHome");

  // Se pre-cargan al renderizar cada esquiador
  window._fechaInicioPrecargada = localStorage.getItem("fechaLlegada") || "";
  window._fechaFinPrecargada = localStorage.getItem("fechaSalida") || "";
  window._cantPersonasPrecargada = localStorage.getItem("cantPersonas") || "1";
}

// ── INIT PRINCIPAL ─────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Panel carrito
  const toggle = document.getElementById("toggleCarrito");
  const panel = document.getElementById("carritoPanel");
  const overlay = document.getElementById("overlay");
  const cerrar = document.getElementById("cerrarCarrito");

  function abrirCarrito() {
    panel?.classList.add("active");
    overlay?.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function cerrarCarritoPanel() {
    panel?.classList.remove("active");
    overlay?.classList.remove("active");
    document.body.style.overflow = "";
  }

  toggle?.addEventListener("click", abrirCarrito);
  cerrar?.addEventListener("click", cerrarCarritoPanel);
  overlay?.addEventListener("click", cerrarCarritoPanel);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") cerrarCarritoPanel();
  });

  // Botones .btn-agregar
  document.querySelectorAll(".btn-agregar").forEach((boton) => {
    boton.addEventListener("click", () => {
      const contenedor =
        boton.closest(".producto") || boton.closest(".detalle-info");
      if (!contenedor) return;

      let nombre,
        precio,
        medida = "";

      if (contenedor.classList.contains("producto")) {
        nombre = contenedor.dataset.nombre;
        precio = parseFloat(contenedor.dataset.precio);
        const selectMedida = contenedor.querySelector(".medida");
        medida = selectMedida ? selectMedida.value : "";
        if (selectMedida && !medida) {
          mostrarToast("Seleccioná una medida antes de agregar al carrito.", "warning");
          return;
        }
      } else {
        nombre = boton.dataset.nombre;
        precio = parseFloat(boton.dataset.precio);
        const selectMedida = contenedor.querySelector(".medida");
        medida = selectMedida ? selectMedida.value : "";
        if (selectMedida && !medida) {
          mostrarToast("Seleccioná una medida antes de agregar al carrito.", "warning");
          return;
        }
      }

      agregarAlCarrito(nombre, precio, medida);
    });
  });

  // Hamburguesa
  const hamburguesa = document.getElementById("hamburguesa");
  const menu = document.getElementById("menu");

  if (hamburguesa && menu) {
    hamburguesa.addEventListener("click", () => {
      const abierto = menu.classList.toggle("active");
      hamburguesa.setAttribute("aria-expanded", abierto);
    });

    document.addEventListener("click", (e) => {
      if (!hamburguesa.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.remove("active");
        hamburguesa.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Selector de fechas en home
  initSelectorFechas();

  // Pre-carga de fechas en checkout
  initFechasCheckout();

  // Formulario CONTACTO
  const formContacto = document.getElementById("formContacto");
  if (formContacto) {
    formContacto.addEventListener("submit", async function (e) {
      e.preventDefault();

      const formData = new FormData(this);
      const btnSubmit = formContacto.querySelector("button[type='submit']");
      const textoOriginal = btnSubmit.textContent;
      btnSubmit.textContent = "Enviando...";
      btnSubmit.disabled = true;

      try {
        const response = await fetch("https://pro-shop-aventura-production.up.railway.app/contacto", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: formData.get("nombre"),
            email: formData.get("email"),
            telefono: formData.get("telefono") || "No indicado",
            mensaje: formData.get("mensaje"),
          }),
        });

        const data = await response.json();

        if (data.ok) {
          mostrarToast("Mensaje enviado correctamente. Te responderemos a la brevedad.", "success", 6000);
          this.reset();
        } else {
          mostrarToast("Error al enviar el mensaje. Intentá de nuevo.", "error");
        }
      } catch (error) {
        mostrarToast("No se pudo conectar con el servidor. Intentá de nuevo.", "error");
        console.error(error);
      } finally {
        btnSubmit.textContent = textoOriginal;
        btnSubmit.disabled = false;
      }
    });
  }

  // ── CHECKOUT ──────────────────────────────────
  const listaEsquiadores = document.getElementById("listaEsquiadores");
  if (listaEsquiadores) {
    // Precios importados desde precios.js (fuente de verdad)
    const TABLA_PRECIOS = window.PRECIOS ?? {};

    // getPrecio provisto por precios.js
    const getPrecioLocal = window.getPrecio ?? function(k, d) { return 0; };

    function calcularDiasEsq(inicio, fin) {
      if (!inicio || !fin) return 0;
      const ini = new Date(inicio);
      const f = new Date(fin);
      const d = Math.ceil((f - ini) / (1000 * 60 * 60 * 24)) +1;
      return d > 0 ? d : 0;
    }

    // Leer fechas pre-cargadas desde home
    const fechaInicioDefault = window._fechaInicioPrecargada || "";
    const fechaFinDefault = window._fechaFinPrecargada || "";
    const cantPersonasDefault = parseInt(
      window._cantPersonasPrecargada || "1",
      10,
    );

    let cantEsq = Math.min(cantPersonasDefault, 10) || 1;
    const numEsqEl = document.getElementById("numEsq");
    if (numEsqEl) numEsqEl.textContent = cantEsq;

    let esquiadores = [];

    document.getElementById("btnMasEsq")?.addEventListener("click", () => {
      if (cantEsq < 10) {
        cantEsq++;
        document.getElementById("numEsq").textContent = cantEsq;
        renderEsquiadores();
      }
    });

    document.getElementById("btnMenosEsq")?.addEventListener("click", () => {
      if (cantEsq > 1) {
        cantEsq--;
        document.getElementById("numEsq").textContent = cantEsq;
        renderEsquiadores();
      }
    });

    function esquiadorDefault() {
      return {
        nombre: "",
        edad: "adulto",
        nivel: "principiante",
        tipo: "ski",
        altura: "",
        talleBota: "",
        fecha_inicio: fechaInicioDefault,
        fecha_fin: fechaFinDefault,
        casco: false,
        talleCasco: "M",
        antiparras: false,
        talleAntiparras: "M",
        guantes: false,
        talleGuantes: "M",
        botas_preski: false,
        campera: false,
        talleCampera: "M",
        pantalon_adulto: false,
        tallePantalon: "M",
        combo_adulto: false,
        pantalon_nino: false,
        tallePantalon_nino: "4",
        combo_nino: false,
      };
    }

    function generarRecomendacion(esq) {
      const h = parseInt(esq.altura) || 0;
      const b = parseInt(esq.talleBota) || 0;
      const esNino = esq.edad === "nino";
      const nivel = esq.nivel || "principiante";

      const F_SKI  = { principiante:{min:.84,max:.90,nota:"más corto, fácil de manejar"}, intermedio:{min:.90,max:.95,nota:"longitud estándar"}, avanzado:{min:.95,max:1.00,nota:"más largo, mayor velocidad"} };
      const F_SNOW = { principiante:{min:.82,max:.86,nota:"tabla corta, más maniobrable"}, intermedio:{min:.86,max:.90,nota:"longitud estándar"}, avanzado:{min:.90,max:.94,nota:"más largo, mayor estabilidad"} };
      const F_BAST = { principiante:{min:.64,max:.66}, intermedio:{min:.66,max:.68}, avanzado:{min:.66,max:.68} };
      const FLEX   = { principiante:"Flex suave (60–80)", intermedio:"Flex medio (80–100)", avanzado:"Flex duro (100+)" };
      const NIVEL_LABELS = { principiante:"Principiante", intermedio:"Intermedio", avanzado:"Avanzado" };

      let titulo = "";
      let items  = [];

      if (esq.tipo === "ski" || esq.tipo === "solo_ski") {
        const f = esNino ? {min:.84,max:.90,nota:"para niños"} : F_SKI[nivel];
        const ski  = h ? `${Math.round(h*f.min)}–${Math.round(h*f.max)} cm` : "—";
        const bast = h ? `${Math.round(h*F_BAST[nivel].min)}–${Math.round(h*F_BAST[nivel].max)} cm` : "—";
        titulo = "Recomendación para esquí";
        items = [
          { label:"Longitud esquí",  valor: ski,  nota: f.nota },
          ...(esq.tipo === "ski" ? [{ label:"Bastones", valor: bast, nota:"" }] : []),
          { label:"Bota",            valor: b ? `EU ${b}` : "—", nota:"" },
          ...(esNino && esq.tipo === "ski" ? [{ label:"Casco", valor:"incluido en el pack", nota:"" }] : []),
        ];
      } else if (esq.tipo === "snow" || esq.tipo === "solo_snow") {
        const f = esNino ? {min:.80,max:.85,nota:"para niños"} : F_SNOW[nivel];
        const tabla = h ? `${Math.round(h*f.min)}–${Math.round(h*f.max)} cm` : "—";
        titulo = "Recomendación para snowboard";
        items = [
          { label:"Longitud tabla",  valor: tabla, nota: f.nota },
          { label:"Bota snowboard",  valor: b ? `EU ${b}` : "—", nota:"" },
          ...(esNino && esq.tipo === "snow" ? [{ label:"Casco", valor:"incluido en el pack", nota:"" }] : []),
        ];
      } else if (esq.tipo === "solo_bota_ski" || esq.tipo === "solo_bota_snow") {
        titulo = "Recomendación para bota";
        items = [
          { label:"Talle bota",       valor: b ? `EU ${b}` : "—", nota:"" },
          { label:"Flex recomendado", valor: FLEX[nivel], nota:"" },
          { label:"Disponible",       valor: "EU 36 al 44", nota:"" },
        ];
      }

      if (!titulo) return "";

      const filas = items.map(d => `
        <div class="esq-recomendacion-item">
          <span class="esq-recomendacion-label">${d.label}</span>
          <span class="esq-recomendacion-valor">${d.valor}</span>
          ${d.nota ? `<span class="esq-recomendacion-nota">· ${d.nota}</span>` : ""}
        </div>`).join("");

      return `
        <div class="esq-recomendacion">
          <div class="esq-recomendacion-titulo">
            ${titulo}
            <span class="esq-recomendacion-tag">${NIVEL_LABELS[nivel]}</span>
          </div>
          <div class="esq-recomendacion-items">${filas}</div>
        </div>`;
    }

    function renderEsquiadores() {
      while (esquiadores.length < cantEsq) esquiadores.push(esquiadorDefault());
      while (esquiadores.length > cantEsq) esquiadores.pop();

      listaEsquiadores.innerHTML = "";

      esquiadores.forEach((esq, i) => {
        const diasEsq = calcularDiasEsq(esq.fecha_inicio, esq.fecha_fin);
        const esNino = esq.edad === "nino";
        const div = document.createElement("div");
        div.classList.add("esquiador-card");
        div.innerHTML = `
          <div class="esquiador-header">
            <div class="esq-num">${i + 1}</div>
            <span class="esq-titulo">Esquiador ${i + 1}</span>
            <span class="esq-badge">${esq.edad === "adulto" ? "Adulto" : "Niño"} · ${esq.tipo === "ski" ? "Ski" : "Snowboard"}</span>
          </div>

          <div class="checkout-grid checkout-grid--mb">
            <div class="campo">
              <label>Nombre (opcional)</label>
              <input type="text" value="${esq.nombre}" placeholder="Ej: Juan"
                onchange="actualizarEsq(${i}, 'nombre', this.value)" />
            </div>
            <div class="campo">
              <label>Edad</label>
              <select onchange="actualizarEsq(${i}, 'edad', this.value)">
                <option value="adulto" ${esq.edad === "adulto" ? "selected" : ""}>Adulto (12+ años)</option>
                <option value="nino" ${esq.edad === "nino" ? "selected" : ""}>Niño (hasta 12 años)</option>
              </select>
            </div>
          </div>

          <div class="tipo-toggle">
            <button type="button" class="tipo-btn ${esq.tipo === "ski" ? "activo" : ""}"
              onclick="actualizarEsq(${i}, 'tipo', 'ski')"> Ski completo</button>
            <button type="button" class="tipo-btn ${esq.tipo === "snow" ? "activo" : ""}"
              onclick="actualizarEsq(${i}, 'tipo', 'snow')">Snowboard completo</button>
            <button type="button" class="tipo-btn ${esq.tipo === "solo_ski" ? "activo" : ""}"
              onclick="actualizarEsq(${i}, 'tipo', 'solo_ski')"> Solo Esquí</button>
            <button type="button" class="tipo-btn ${esq.tipo === "solo_snow" ? "activo" : ""}"
              onclick="actualizarEsq(${i}, 'tipo', 'solo_snow')"> Solo Snowboard</button>
            <button type="button" class="tipo-btn ${esq.tipo === "solo_bota_ski" ? "activo" : ""}"
              onclick="actualizarEsq(${i}, 'tipo', 'solo_bota_ski')"> Bota Ski</button>
            <button type="button" class="tipo-btn ${esq.tipo === "solo_bota_snow" ? "activo" : ""}"
              onclick="actualizarEsq(${i}, 'tipo', 'solo_bota_snow')"> Bota Snowboard</button>
          </div>

          <div class="nivel-section">Nivel de experiencia</div>
          <div class="nivel-toggle">
            <button type="button" class="nivel-btn ${esq.nivel === 'principiante' ? 'activo' : ''}"
              onclick="actualizarEsq(${i}, 'nivel', 'principiante')">
              Principiante
            </button>
            <button type="button" class="nivel-btn ${esq.nivel === 'intermedio' ? 'activo' : ''}"
              onclick="actualizarEsq(${i}, 'nivel', 'intermedio')">
              Intermedio
            </button>
            <button type="button" class="nivel-btn ${esq.nivel === 'avanzado' ? 'activo' : ''}"
              onclick="actualizarEsq(${i}, 'nivel', 'avanzado')">
              Avanzado
            </button>
          </div>

          <div class="checkout-grid checkout-grid--my">
            <div class="campo">
              <label>Altura (cm)</label>
              <select onchange="actualizarEsq(${i}, 'altura', this.value)">
                <option value="">Seleccioná</option>
                ${(esNino
                  ? [60,65,70,75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140]
                  : [ 140, 145, 150, 155, 160, 165, 170, 175, 180, 185, 190,]
                )
                    .map(
                      (h) =>
                      `<option value="${h}" ${esq.altura == h ? "selected" : ""}>${h} cm</option>`,
                  )
                  .join("")}
              </select>
            </div>
            <div class="campo">
              <label>Talle bota AR</label>
              <select onchange="actualizarEsq(${i}, 'talleBota', this.value)">
                <option value="">Seleccioná</option>
                ${(esNino
                  ? [26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38]
                  : [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48]
                )
                  .map(
                    (t) =>
                      `<option value="${t}" ${esq.talleBota == t ? "selected" : ""}>${t}</option>`,
                  )
                  .join("")}
              </select>
            </div>
          </div>

          <div class="esq-section">Fechas de alquiler</div>
          <div class="checkout-grid checkout-grid--mb-sm">
            <div class="campo">
              <label>Fecha inicio</label>
              <input type="date" value="${esq.fecha_inicio}"
                onchange="actualizarEsq(${i}, 'fecha_inicio', this.value)" />
            </div>
            <div class="campo">
              <label>Fecha fin</label>
              <input type="date" value="${esq.fecha_fin}"
                onchange="actualizarEsq(${i}, 'fecha_fin', this.value)" />
            </div>
          </div>
          ${
            diasEsq > 0
              ? `<div class="checkout-dias checkout-dias--visible">
            <span>📅</span><strong>${diasEsq}</strong>&nbsp;día/s de alquiler
          </div>`
              : ""
          }

          ${generarRecomendacion(esq)}

          <div class="esq-section">Accesorios</div>

          <div class="accesorio-row">
  <span class="acc-label">Casco</span>
  ${
    esNino && (esq.tipo === "ski" || esq.tipo === "snow")
      ? `<span class="acc-incluido">✅ Incluido en el pack</span>
       <select onchange="actualizarEsq(${i}, 'talleCasco', this.value)">
         ${["S", "M", "L", "XL"].map((t) => `<option ${esq.talleCasco === t ? "selected" : ""}>${t}</option>`).join("")}
       </select>`
      : `<div class="acc-toggle">
         <button type="button" class="${esq.casco ? "activo" : ""}"
           onclick="actualizarEsq(${i}, 'casco', true)">Sí</button>
         <button type="button" class="${!esq.casco ? "activo" : ""}"
           onclick="actualizarEsq(${i}, 'casco', false)">No</button>
       </div>
       ${
         esq.casco
           ? `<select onchange="actualizarEsq(${i}, 'talleCasco', this.value)">
         ${["S", "M", "L", "XL"].map((t) => `<option ${esq.talleCasco === t ? "selected" : ""}>${t}</option>`).join("")}
       </select>`
           : ""
       }`
  }
</div>

          <div class="accesorio-row">
            <span class="acc-label">Antiparras</span>
            <div class="acc-toggle">
              <button type="button" class="${esq.antiparras ? "activo" : ""}"
                onclick="actualizarEsq(${i}, 'antiparras', true)">Sí</button>
              <button type="button" class="${!esq.antiparras ? "activo" : ""}"
                onclick="actualizarEsq(${i}, 'antiparras', false)">No</button>
            </div>
            ${
              esq.antiparras
                ? `<select onchange="actualizarEsq(${i}, 'talleAntiparras', this.value)">
              ${["S", "M", "L", "XL"].map((t) => `<option ${esq.talleAntiparras === t ? "selected" : ""}>${t}</option>`).join("")}
            </select>`
                : ""
            }
          </div>

          <div class="accesorio-row">
            <span class="acc-label">Guantes</span>
            <div class="acc-toggle">
              <button type="button" class="${esq.guantes ? "activo" : ""}"
                onclick="actualizarEsq(${i}, 'guantes', true)">Sí</button>
              <button type="button" class="${!esq.guantes ? "activo" : ""}"
                onclick="actualizarEsq(${i}, 'guantes', false)">No</button>
            </div>
            ${
              esq.guantes
                ? `<select onchange="actualizarEsq(${i}, 'talleGuantes', this.value)">
              ${["S", "M", "L", "XL"].map((t) => `<option ${esq.talleGuantes === t ? "selected" : ""}>${t}</option>`).join("")}
            </select>`
                : ""
            }
          </div>

          <div class="accesorio-row">
            <span class="acc-label">Botas Preski</span>
            <div class="acc-toggle">
              <button type="button" class="${esq.botas_preski ? "activo" : ""}"
                onclick="actualizarEsq(${i}, 'botas_preski', true)">Sí</button>
              <button type="button" class="${!esq.botas_preski ? "activo" : ""}"
                onclick="actualizarEsq(${i}, 'botas_preski', false)">No</button>
            </div>
          </div>

          <div class="esq-section">Indumentaria</div>

          <div class="accesorio-row">
            <span class="acc-label">Campera ${esNino ? "niño" : "adulto"}</span>
            <div class="acc-toggle">
              <button type="button" class="${esq.campera ? "activo" : ""}"
                onclick="actualizarEsq(${i}, 'campera', true)">Sí</button>
              <button type="button" class="${!esq.campera ? "activo" : ""}"
                onclick="actualizarEsq(${i}, 'campera', false)">No</button>
            </div>
            ${
              esq.campera
                ? `<select onchange="actualizarEsq(${i}, 'talleCampera', this.value)">
              ${(esNino ? ["4", "6", "8", "10", "12", "14"] : ["S", "M", "L", "XL"]).map((t) => `<option ${esq.talleCampera === t ? "selected" : ""}>${t}</option>`).join("")}
            </select>`
                : ""
            }
          </div>

          <div class="accesorio-row">
            <span class="acc-label">Pantalón ${esNino ? "niño / Enterito" : "adulto"}</span>
            <div class="acc-toggle">
              <button type="button" class="${esNino ? (esq.pantalon_nino ? "activo" : "") : esq.pantalon_adulto ? "activo" : ""}"
                onclick="actualizarEsq(${i}, '${esNino ? "pantalon_nino" : "pantalon_adulto"}', true)">Sí</button>
              <button type="button" class="${esNino ? (!esq.pantalon_nino ? "activo" : "") : !esq.pantalon_adulto ? "activo" : ""}"
                onclick="actualizarEsq(${i}, '${esNino ? "pantalon_nino" : "pantalon_adulto"}', false)">No</button>
            </div>
            ${
              (esNino ? esq.pantalon_nino : esq.pantalon_adulto)
                ? `<select onchange="actualizarEsq(${i}, '${esNino ? "tallePantalon_nino" : "tallePantalon"}', this.value)">
              ${(esNino ? ["4", "6", "8", "10", "12", "14"] : ["S", "M", "L", "XL"]).map((t) => `<option ${(esNino ? esq.tallePantalon_nino : esq.tallePantalon) === t ? "selected" : ""}>${t}</option>`).join("")}
            </select>`
                : ""
            }
          </div>

          <div class="accesorio-row">
            <span class="acc-label">Campera + Pantalón ${esNino ? "niño" : "adulto"} (combo)</span>
            <div class="acc-toggle">
              <button type="button" class="${esNino ? (esq.combo_nino ? "activo" : "") : esq.combo_adulto ? "activo" : ""}"
                onclick="actualizarEsq(${i}, '${esNino ? "combo_nino" : "combo_adulto"}', true)">Sí</button>
              <button type="button" class="${esNino ? (!esq.combo_nino ? "activo" : "") : !esq.combo_adulto ? "activo" : ""}"
                onclick="actualizarEsq(${i}, '${esNino ? "combo_nino" : "combo_adulto"}', false)">No</button>
            </div>
          </div>
        `;
        listaEsquiadores.appendChild(div);
      });

      actualizarResumen();
    }

    window.actualizarEsq = function (i, campo, valor) {
      esquiadores[i][campo] = valor;
      renderEsquiadores();
    };

    // Permite que el selector de fechas globales del checkout actualice todos los esquiadores
    window.actualizarFechasGlobales = function(ini, fin) {
      esquiadores.forEach(function(esq) {
        if (ini) esq.fecha_inicio = ini;
        if (fin)  esq.fecha_fin   = fin;
      });
      renderEsquiadores();
    };

    function precioEsquiador(esq) {
      const d = calcularDiasEsq(esq.fecha_inicio, esq.fecha_fin) || 1;
      const esNino = esq.edad === "nino";
      let total = 0;

      if (esq.tipo === "ski") {
        total += getPrecioLocal(esNino ? "ski_junior" : "ski_adulto", d);
      } else if (esq.tipo === "snow") {
        total += getPrecioLocal(esNino ? "snow_junior" : "snow_adulto", d);
      } else if (esq.tipo === "solo_ski") {
        total += getPrecioLocal(esNino ? "solo_ski_junior" : "solo_ski_adulto", d);
      } else if (esq.tipo === "solo_snow") {
        total += getPrecioLocal(esNino ? "solo_snow_junior" : "solo_snow_adulto", d);
      } else if (esq.tipo === "solo_bota_ski") {
        total += getPrecioLocal("solo_bota_ski", d);
      } else if (esq.tipo === "solo_bota_snow") {
        total += getPrecioLocal("solo_bota_snow", d);
      }

      const cascoIncluido = esNino && (esq.tipo === "ski" || esq.tipo === "snow");
      if (esq.casco && !cascoIncluido) total += getPrecioLocal("casco", d);
      if (esq.antiparras) total += getPrecioLocal("antiparras", d);
      if (esq.guantes) total += getPrecioLocal("guantes", d);
      if (esq.botas_preski) total += getPrecioLocal("botas_preski", d);
      if (esq.campera)
        total += getPrecioLocal(esNino ? "campera_nino" : "campera_adulto", d);
      if (esq.pantalon_adulto) total += getPrecioLocal("pantalon_adulto", d);
      if (esq.pantalon_nino) total += getPrecioLocal("pantalon_nino", d);
      if (esq.combo_adulto) total += getPrecioLocal("combo_adulto", d);
      if (esq.combo_nino) total += getPrecioLocal("combo_nino", d);

      return total;
    }

    function actualizarResumen() {
      const resumenLista = document.getElementById("resumenLista");
      const totalDiaEl = document.getElementById("totalDia");
      const totalReservaEl = document.getElementById("totalReserva");

      if (!resumenLista) return;

      resumenLista.innerHTML = "";
      let totalGeneral = 0;

      esquiadores.forEach((esq, i) => {
        const esNino = esq.edad === "nino";
        const d = calcularDiasEsq(esq.fecha_inicio, esq.fecha_fin) || 1;
        totalGeneral += precioEsquiador(esq);

        const grupo = document.createElement("div");
        grupo.classList.add("resumen-grupo");

        const titulo = document.createElement("div");
        titulo.classList.add("resumen-grupo-titulo");
        titulo.textContent = `${esq.nombre || `Esquiador ${i + 1}`} — ${esq.edad === "adulto" ? "Adulto" : "Niño"} · ${
          esq.tipo === "ski" ? "Ski" :
          esq.tipo === "snow" ? "Snowboard" :
          esq.tipo === "solo_ski" ? "Solo Esquí" :
          esq.tipo === "solo_snow" ? "Solo Snowboard" :
          esq.tipo === "solo_bota_ski" ? "Bota Ski" :
          esq.tipo === "solo_bota_snow" ? "Bota Snowboard" : "Equipo"
        } · ${esq.nivel ? esq.nivel.charAt(0).toUpperCase() + esq.nivel.slice(1) : ""} · ${d} día/s`;
        grupo.appendChild(titulo);

        const items = [];
        let packKey, packLabel;

        if (esq.tipo === "ski") {
          packKey   = esNino ? "ski_junior" : "ski_adulto";
          packLabel = esNino ? "Pack Ski Junior (ski + botas + bastones)" : "Pack Ski Adulto (ski + botas + bastones)";
        } else if (esq.tipo === "snow") {
          packKey   = esNino ? "snow_junior" : "snow_adulto";
          packLabel = esNino ? "Pack Snowboard Junior (tabla + botas)" : "Pack Snowboard Adulto (tabla + botas)";
        } else if (esq.tipo === "solo_ski") {
          packKey   = esNino ? "solo_ski_junior" : "solo_ski_adulto";
          packLabel = esNino ? "Solo Esquí Junior (sin botas)" : "Solo Esquí Adulto (sin botas)";
        } else if (esq.tipo === "solo_snow") {
          packKey   = esNino ? "solo_snow_junior" : "solo_snow_adulto";
          packLabel = esNino ? "Solo Snowboard Junior (sin botas)" : "Solo Snowboard Adulto (sin botas)";
        } else if (esq.tipo === "solo_bota_ski") {
          packKey   = "solo_bota_ski";
          packLabel = "Solo Bota de Ski";
        } else if (esq.tipo === "solo_bota_snow") {
          packKey   = "solo_bota_snow";
          packLabel = "Solo Bota de Snowboard";
        } else {
          packKey   = esNino ? "snow_junior" : "snow_adulto";
          packLabel = "Equipo";
        }

        items.push([packLabel, getPrecioLocal(packKey, d)]);
        const cascoIncluido = esNino && (esq.tipo === "ski" || esq.tipo === "snow");
        if (cascoIncluido)
          items.push([`Casco talle ${esq.talleCasco} (incluido)`, 0]);
        else if (esq.casco)
          items.push([`Casco talle ${esq.talleCasco}`, getPrecioLocal("casco", d)]);
        if (esq.antiparras)
          items.push([
            `Antiparras talle ${esq.talleAntiparras}`,
            getPrecioLocal("antiparras", d),
          ]);
        if (esq.guantes)
          items.push([
            `Guantes talle ${esq.talleGuantes}`,
            getPrecioLocal("guantes", d),
          ]);
        if (esq.botas_preski)
          items.push(["Botas Preski", getPrecioLocal("botas_preski", d)]);
        if (esq.campera)
          items.push([
            `Campera ${esNino ? "niño" : "adulto"} talle ${esq.talleCampera}`,
            getPrecioLocal(esNino ? "campera_nino" : "campera_adulto", d),
          ]);
        if (esq.pantalon_adulto)
          items.push([
            `Pantalón adulto talle ${esq.tallePantalon}`,
            getPrecioLocal("pantalon_adulto", d),
          ]);
        if (esq.pantalon_nino)
          items.push([
            `Pantalón/Enterito niño talle ${esq.tallePantalon_nino}`,
            getPrecioLocal("pantalon_nino", d),
          ]);
        if (esq.combo_adulto)
          items.push([
            "Campera + Pantalón adulto (combo)",
            getPrecioLocal("combo_adulto", d),
          ]);
        if (esq.combo_nino)
          items.push([
            "Campera + Pantalón niño (combo)",
            getPrecioLocal("combo_nino", d),
          ]);

        items.forEach(([label, precio]) => {
          const item = document.createElement("div");
          item.classList.add("checkout-item");
          item.innerHTML = `
            <span class="checkout-item-info">${label}</span>
            <span class="checkout-item-precio">$${formatearPrecio(precio)}</span>
          `;
          grupo.appendChild(item);
        });

        resumenLista.appendChild(grupo);
      });

      if (totalDiaEl) {
        const totalPorDia = esquiadores.reduce((acc, esq) => {
          const esNino = esq.edad === "nino";
          let packKey;
          if (esq.tipo === "ski")            packKey = esNino ? "ski_junior" : "ski_adulto";
          else if (esq.tipo === "snow")       packKey = esNino ? "snow_junior" : "snow_adulto";
          else if (esq.tipo === "solo_ski")   packKey = esNino ? "solo_ski_junior" : "solo_ski_adulto";
          else if (esq.tipo === "solo_snow")  packKey = esNino ? "solo_snow_junior" : "solo_snow_adulto";
          else if (esq.tipo === "solo_bota_ski")  packKey = "solo_bota_ski";
          else if (esq.tipo === "solo_bota_snow") packKey = "solo_bota_snow";
          else packKey = esNino ? "snow_junior" : "snow_adulto";

          let t = getPrecioLocal(packKey, 1);
          if (esq.casco) t += getPrecioLocal("casco", 1);
          if (esq.antiparras) t += getPrecioLocal("antiparras", 1);
          if (esq.guantes) t += getPrecioLocal("guantes", 1);
          if (esq.botas_preski) t += getPrecioLocal("botas_preski", 1);
          if (esq.campera)
            t += getPrecioLocal(esNino ? "campera_nino" : "campera_adulto", 1);
          if (esq.pantalon_adulto) t += getPrecioLocal("pantalon_adulto", 1);
          if (esq.pantalon_nino) t += getPrecioLocal("pantalon_nino", 1);
          if (esq.combo_adulto) t += getPrecioLocal("combo_adulto", 1);
          if (esq.combo_nino) t += getPrecioLocal("combo_nino", 1);
          return acc + t;
        }, 0);
        totalDiaEl.textContent = `$${formatearPrecio(totalPorDia)}`;
      }

      if (totalReservaEl)
        totalReservaEl.textContent = `$${formatearPrecio(totalGeneral)}`;
    }

    // Submit reserva
    const formReservaCheckout = document.getElementById("formReserva");
    if (formReservaCheckout) {
      formReservaCheckout.addEventListener("submit", async function (e) {
        e.preventDefault();

        const checkPrivacidad = document.getElementById("checkPrivacidad");
        if (!checkPrivacidad?.checked) {
          mostrarToast("Aceptá los términos y la política de privacidad para continuar.", "warning");
          return;
        }

        const formData = new FormData(this);
        const btnConfirmar = document.getElementById("btnConfirmar");
        btnConfirmar.textContent = "Enviando...";
        btnConfirmar.disabled = true;

        const totalGeneral = esquiadores.reduce(
          (acc, esq) => acc + precioEsquiador(esq),
          0,
        );

        try {
          const response = await fetch("https://pro-shop-aventura-production.up.railway.app/reserva", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nombre: formData.get("nombre"),
              email: formData.get("email"),
              telefono: formData.get("telefono") || "No indicado",
              dni: formData.get("dni") || "No indicado",
              notas: formData.get("notas") || "",
              esquiadores: esquiadores,
              total_reserva: totalGeneral,
            }),
          });

          const data = await response.json();

          if (data.ok) {
            // Genera número de reserva único
            const numero = "RPS-" + Date.now().toString(36).toUpperCase().slice(-6);

            // Guarda datos para la página de confirmación
            localStorage.setItem("reservaConfirmada", JSON.stringify({
              numero,
              nombre:      formData.get("nombre"),
              email:       formData.get("email"),
              telefono:    formData.get("telefono") || "",
              esquiadores: cantEsq,
              total:       totalGeneral,
            }));

            // Limpia el carrito y fechas
            localStorage.removeItem("fechaLlegada");
            localStorage.removeItem("fechaSalida");
            localStorage.removeItem("cantPersonas");
            localStorage.removeItem("carrito");
            carrito = [];

            // Redirige a la página de confirmación
            window.location.href = "./reserva-confirmada.html";
          } else {
            mostrarToast("Error al enviar la reserva. Intentá de nuevo.", "error");
            btnConfirmar.textContent = "Confirmar reserva →";
            btnConfirmar.disabled = false;
          }
        } catch (error) {
          mostrarToast("No se pudo conectar con el servidor. Intentá de nuevo.", "error");
          console.error(error);
          btnConfirmar.textContent = "Confirmar reserva →";
          btnConfirmar.disabled = false;
        }
      });
    }

    renderEsquiadores();
  }

  // Render inicial carrito
  renderCarrito();
  actualizarContador();
});
// ── GALERÍA DE EQUIPOS ─────────────────────────────────────────────────────
function cambiarImagen(idPrincipal, src, thumb) {
  const principal = document.getElementById(idPrincipal);
  if (!principal) return;
  principal.classList.add("galeria-principal--fading");
  setTimeout(() => {
    principal.src = src;
    principal.classList.remove("galeria-principal--fading");
  }, 150);
  thumb.closest(".galeria-thumbs")
    .querySelectorAll(".galeria-thumb")
    .forEach(t => t.classList.remove("activo"));
  thumb.classList.add("activo");
}
