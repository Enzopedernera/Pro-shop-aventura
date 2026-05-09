// =============================================
// CARRITO — Rental Pro Shop
// =============================================

// ── ESTADO GLOBAL ─────────────────────────────
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

// ── PERSISTENCIA ──────────────────────────────
function guardarCarrito() {
  localStorage.setItem("carrito", JSON.stringify(carrito));
}

// ── CANTIDAD TOTAL ────────────────────────────
function obtenerCantidadTotal() {
  return carrito.reduce((acc, item) => acc + item.cantidad, 0);
}

// ── ACTUALIZAR CONTADOR ───────────────────────
function actualizarContador() {
  const contador = document.getElementById("contadorCarrito");
  if (contador) {
    contador.textContent = obtenerCantidadTotal();
  }
}

// ── AGREGAR AL CARRITO ────────────────────────
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

// ── ANIMACIÓN ICONO ───────────────────────────
function animarCarrito() {
  const icono = document.querySelector(".carrito-icono");
  if (!icono) return;
  icono.classList.add("shake");
  setTimeout(() => icono.classList.remove("shake"), 300);
}

// ── CAMBIAR CANTIDAD ──────────────────────────
function cambiarCantidad(index, cambio) {
  carrito[index].cantidad += cambio;
  if (carrito[index].cantidad <= 0) {
    carrito.splice(index, 1);
  }
  guardarCarrito();
  renderCarrito();
  actualizarContador();
}

// ── ELIMINAR ITEM ─────────────────────────────
function eliminarItem(index) {
  carrito.splice(index, 1);
  guardarCarrito();
  renderCarrito();
  actualizarContador();
}

// ── VACIAR CARRITO ────────────────────────────
function vaciarCarrito() {
  carrito = [];
  guardarCarrito();
  renderCarrito();
  actualizarContador();
}

// ── FORMATO PRECIO ────────────────────────────
function formatearPrecio(num) {
  return num.toLocaleString("es-AR");
}

// ── RENDER CARRITO ────────────────────────────
function renderCarrito() {
  const lista = document.getElementById("listaCarrito");
  const totalSpan = document.getElementById("total");
  const btnFinalizar = document.getElementById("btnFinalizar");

  if (!lista || !totalSpan) return;

  lista.innerHTML = "";
  let total = 0;

  if (carrito.length === 0) {
    const vacio = document.createElement("p");
    vacio.style.cssText = "color:#999;font-size:14px;text-align:center;padding:30px 0";
    vacio.textContent = "Tu carrito está vacío 🛒";
    lista.appendChild(vacio);
    if (btnFinalizar) btnFinalizar.classList.add("disabled");
  } else {
    if (btnFinalizar) btnFinalizar.classList.remove("disabled");

    carrito.forEach((item, index) => {
      const div = document.createElement("div");
      div.classList.add("item-carrito");

      // Info
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

      // Controles
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

      // Precio
      const precio = document.createElement("div");
      precio.classList.add("item-precio");
      precio.textContent = `$${formatearPrecio(item.precio * item.cantidad)}`;

      // Eliminar
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

// ── FILTRAR PRODUCTOS ─────────────────────────
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

// ── INIT ──────────────────────────────────────
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

  // Cerrar carrito con Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") cerrarCarritoPanel();
  });

  // Botones .btn-agregar
  document.querySelectorAll(".btn-agregar").forEach((boton) => {
    boton.addEventListener("click", () => {
      const contenedor = boton.closest(".producto") || boton.closest(".detalle-info");

      if (!contenedor) return;

      let nombre, precio, medida = "";

      if (contenedor.classList.contains("producto")) {
        nombre = contenedor.dataset.nombre;
        precio = parseFloat(contenedor.dataset.precio);
        const selectMedida = contenedor.querySelector(".medida");
        medida = selectMedida ? selectMedida.value : "";

        if (selectMedida && !medida) {
          alert("Seleccioná una medida");
          return;
        }
      } else {
        nombre = boton.dataset.nombre;
        precio = parseFloat(boton.dataset.precio);
        const selectMedida = contenedor.querySelector(".medida");
        medida = selectMedida ? selectMedida.value : "";

        if (selectMedida && !medida) {
          alert("Seleccioná una medida");
          return;
        }
      }

      agregarAlCarrito(nombre, precio, medida);
    });
  });

  // Celdas clickeables en tabla de precios
  document.querySelectorAll(".precio").forEach((celda) => {
    celda.addEventListener("click", () => {
      const producto = celda.dataset.producto;
      const dias = celda.dataset.dias;
      const precio = parseInt(celda.dataset.precio);
      const nombre = dias ? `${producto} (${dias} día/s)` : producto;

      agregarAlCarrito(nombre, precio, "");

      // Feedback visual
      const textoOriginal = celda.textContent;
      celda.textContent = "✓ Agregado";
      celda.style.background = "#22c55e";
      celda.style.color = "#fff";
      celda.style.fontWeight = "600";
      celda.style.fontSize = "13px";

      setTimeout(() => {
        celda.textContent = textoOriginal;
        celda.style.background = "";
        celda.style.color = "";
        celda.style.fontWeight = "";
        celda.style.fontSize = "";
      }, 1200);
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

    // Cerrar menú al hacer click fuera
    document.addEventListener("click", (e) => {
      if (!hamburguesa.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.remove("active");
        hamburguesa.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Formulario RESERVA
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
        alert("Tu carrito está vacío. Seleccioná al menos un producto antes de reservar.");
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
            `• ${i.nombre}${i.medida ? " (" + i.medida + ")" : ""} x${i.cantidad}: $${formatearPrecio(i.precio * i.cantidad)}`
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

  // Formulario CONTACTO
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

  // Render inicial
  renderCarrito();
  actualizarContador();
});