// =========================
// 🛒 CARRITO GLOBAL
// =========================
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

// =========================
// 💾 GUARDAR
// =========================
function guardarCarrito() {
  localStorage.setItem("carrito", JSON.stringify(carrito));
}

// =========================
// 🔢 CONTADOR TOTAL
// =========================
function obtenerCantidadTotal() {
  return carrito.reduce((acc, item) => acc + item.cantidad, 0);
}

// =========================
// 🎯 ACTUALIZAR CONTADOR
// =========================
function actualizarContador() {
  const contador = document.getElementById("contadorCarrito");
  if (contador) {
    contador.textContent = obtenerCantidadTotal();
  }
}

// =========================
// ➕ AGREGAR (nombre unificado + alias)
// =========================
function agregarAlCarrito(nombre, precio, medida = "") {
  const existe = carrito.find(
    (item) => item.nombre === nombre && item.medida === medida
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

// Alias para compatibilidad con reservas.html (onclick usa minúscula)
function agregarAlcarrito(nombre, precio, medida = "") {
  agregarAlCarrito(nombre, precio, medida);
}

// =========================
// 🎬 ANIMACIÓN ICONO
// =========================
function animarCarrito() {
  const icono = document.querySelector(".carrito-icono");
  if (!icono) return;
  icono.classList.add("shake");
  setTimeout(() => icono.classList.remove("shake"), 300);
}

// =========================
// 🔢 CAMBIAR CANTIDAD
// =========================
function cambiarCantidad(index, cambio) {
  carrito[index].cantidad += cambio;
  if (carrito[index].cantidad <= 0) {
    carrito.splice(index, 1);
  }
  guardarCarrito();
  renderCarrito();
  actualizarContador();
}

// =========================
// ❌ ELIMINAR
// =========================
function eliminarItem(index) {
  carrito.splice(index, 1);
  guardarCarrito();
  renderCarrito();
  actualizarContador();
}

// =========================
// 🎨 FORMATO PRECIO
// =========================
function formatearPrecio(num) {
  return num.toLocaleString("es-AR");
}

// =========================
// 🖥️ RENDER CARRITO
// =========================
function renderCarrito() {
  const lista = document.getElementById("listaCarrito");
  const totalSpan = document.getElementById("total");
  const btnFinalizar = document.getElementById("btnFinalizar");

  if (!lista || !totalSpan) return;

  lista.innerHTML = "";
  let total = 0;

  if (carrito.length === 0) {
    lista.innerHTML =
      "<p style='color:#999;font-size:14px;text-align:center;padding:30px 0'>Tu carrito está vacío 🛒</p>";
    if (btnFinalizar) btnFinalizar.classList.add("disabled");
  } else {
    if (btnFinalizar) btnFinalizar.classList.remove("disabled");
  }

  carrito.forEach((item, index) => {
    const div = document.createElement("div");
    div.classList.add("item-carrito");

    div.innerHTML = `
      <div class="item-info">
        <strong>${item.nombre}</strong>
        ${item.medida ? `<small>(${item.medida})</small>` : ""}
      </div>
      <div class="item-controles">
        <button onclick="cambiarCantidad(${index}, -1)">−</button>
        <span>${item.cantidad}</span>
        <button onclick="cambiarCantidad(${index}, 1)">+</button>
      </div>
      <div class="item-precio">
        $${formatearPrecio(item.precio * item.cantidad)}
      </div>
      <button class="eliminar" onclick="eliminarItem(${index})">✕</button>
    `;

    lista.appendChild(div);
    total += item.precio * item.cantidad;
  });

  totalSpan.textContent = formatearPrecio(total);
}

// =========================
// 🗑️ VACIAR
// =========================
function vaciarCarrito() {
  carrito = [];
  guardarCarrito();
  renderCarrito();
  actualizarContador();
}

// =========================
// 🔍 FILTRO PRODUCTOS
// FIX: ahora acepta el botón como 2do parámetro para marcar activo
// =========================
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
    document.querySelectorAll(".filtros button").forEach((btn) =>
      btn.classList.remove("activo")
    );
    botonActivo.classList.add("activo");
  }
}

// =========================
// 🚀 INIT
// =========================
document.addEventListener("DOMContentLoaded", () => {

  // ── Toggle carrito — PANEL LATERAL ─────────────────────────
  const toggle = document.getElementById("toggleCarrito");
  const panel = document.getElementById("carritoPanel");
  const overlay = document.getElementById("overlay");
  const cerrar = document.getElementById("cerrarCarrito");

  function abrirCarrito() {
    panel?.classList.add("active");
    overlay?.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function cerrarCarrito() {
    panel?.classList.remove("active");
    overlay?.classList.remove("active");
    document.body.style.overflow = "";
  }

  toggle?.addEventListener("click", abrirCarrito);
  cerrar?.addEventListener("click", cerrarCarrito);
  overlay?.addEventListener("click", cerrarCarrito);

  // ── Botones .btn-agregar (index.html) ──────────────────────
  document.querySelectorAll(".btn-agregar").forEach((boton) => {
    boton.addEventListener("click", () => {
      const producto = boton.closest(".producto");
      const nombre = producto.dataset.nombre;
      const precio = parseFloat(producto.dataset.precio);
      const selectMedida = producto.querySelector(".medida");
      const medida = selectMedida ? selectMedida.value : "";

      if (selectMedida && !medida) {
        alert("Seleccioná una medida");
        return;
      }

      agregarAlCarrito(nombre, precio, medida);
    });
  });

  // ── Click en celdas de precio (tablas de reservas.html) ────
  document.querySelectorAll(".precio").forEach((celda) => {
    celda.style.cursor = "pointer";
    celda.addEventListener("click", () => {
      const producto = celda.dataset.producto;
      const dias = celda.dataset.dias;
      const precio = parseInt(celda.dataset.precio);
      const nombre = dias ? `${producto} (${dias} día/s)` : producto;

      agregarAlCarrito(nombre, precio, "");

      // Feedback visual en celda
      const origBg = celda.style.background;
      const origColor = celda.style.color;
      celda.style.background = "#22c55e";
      celda.style.color = "#fff";
      setTimeout(() => {
        celda.style.background = origBg;
        celda.style.color = origColor;
      }, 600);
    });
  });

  // ── Hamburguesa ────────────────────────────────────────────
  // FIX: event listener que faltaba
  const hamburguesa = document.getElementById("hamburguesa");
  const menu = document.getElementById("menu");

  if (hamburguesa && menu) {
    hamburguesa.addEventListener("click", () => {
      menu.classList.toggle("active");
    });
  }

  // ── Formulario RESERVA ─────────────────────────────────────
  const formReserva = document.getElementById("formReserva");
  if (formReserva) {
    formReserva.addEventListener("submit", function (e) {
      e.preventDefault();

      const formData = new FormData(this);
      const fechaInicio = new Date(formData.get("fecha_inicio"));
      const fechaFin = new Date(formData.get("fecha_fin"));

      if (fechaFin <= fechaInicio) {
        alert("La fecha de fin debe ser posterior a la fecha de inicio.");
        return;
      }

      const carritoActual = JSON.parse(localStorage.getItem("carrito")) || [];

      if (carritoActual.length === 0) {
        alert(
          "Tu carrito está vacío. Seleccioná al menos un producto antes de reservar."
        );
        return;
      }

      const nombre = formData.get("nombre");
      const email = formData.get("email");
      const telefono = formData.get("telefono") || "No indicado";
      const dni = formData.get("dni") || "No indicado";
      const fechaIniStr = formData.get("fecha_inicio");
      const fechaFinStr = formData.get("fecha_fin");

      const itemsTexto = carritoActual
        .map(
          (i) =>
            `• ${i.nombre}${i.medida ? " (" + i.medida + ")" : ""} x${
              i.cantidad
            }: $${formatearPrecio(i.precio * i.cantidad)}`
        )
        .join("%0A");

      const totalReserva = carritoActual.reduce(
        (acc, i) => acc + i.precio * i.cantidad,
        0
      );

      const mensaje =
        `*🎿 Nueva reserva - Rental Pro Shop*%0A` +
        `%0A*👤 Cliente:*%0A` +
        `Nombre: ${nombre}%0A` +
        `Email: ${email}%0A` +
        `Teléfono: ${telefono}%0A` +
        `DNI: ${dni}%0A` +
        `%0A*📅 Fechas:*%0A` +
        `Desde: ${fechaIniStr}%0A` +
        `Hasta: ${fechaFinStr}%0A` +
        `%0A*🛒 Equipos seleccionados:*%0A` +
        `${itemsTexto}%0A` +
        `%0A*💰 Total: $${formatearPrecio(totalReserva)}*`;

      window.open(`https://wa.me/5492944646730?text=${mensaje}`, "_blank");

      localStorage.removeItem("carrito");
      carrito = [];
      renderCarrito();
      actualizarContador();
      this.reset();
    });
  }

  // ── Formulario CONTACTO ────────────────────────────────────
  // FIX: formulario no tenía listener, no hacía nada al enviar
  const formContacto = document.getElementById("formContacto");
  if (formContacto) {
    formContacto.addEventListener("submit", function (e) {
      e.preventDefault();

      const formData = new FormData(this);
      const nombre = formData.get("nombre");
      const email = formData.get("email");
      const telefono = formData.get("telefono") || "No indicado";
      const mensajeTexto = formData.get("mensaje");

      const mensaje =
        `*✉️ Nuevo mensaje - Rental Pro Shop*%0A` +
        `%0ANombre: ${nombre}%0A` +
        `Email: ${email}%0A` +
        `Teléfono: ${telefono}%0A` +
        `%0AMensaje: ${encodeURIComponent(mensajeTexto)}`;

      window.open(`https://wa.me/5492944646730?text=${mensaje}`, "_blank");
      this.reset();
    });
  }

  // ── Render inicial ─────────────────────────────────────────
  renderCarrito();
  actualizarContador();
});