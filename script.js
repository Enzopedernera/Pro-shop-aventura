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

  // ── Panel carrito ─────────────────────────
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

  // ── Botones .btn-agregar ──────────────────
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

  // ── Celdas tabla de precios ───────────────
  document.querySelectorAll(".precio").forEach((celda) => {
    celda.addEventListener("click", () => {
      const producto = celda.dataset.producto;
      const dias = celda.dataset.dias;
      const precio = parseInt(celda.dataset.precio);
      const nombre = dias ? `${producto} (${dias} día/s)` : producto;

      agregarAlCarrito(nombre, precio, "");

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

  // ── Hamburguesa ───────────────────────────
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

  // ── Formulario CONTACTO ───────────────────
  const formContacto = document.getElementById("formContacto");
  if (formContacto) {
    formContacto.addEventListener("submit", async function (e) {
      e.preventDefault();

      const formData = new FormData(this);
      const btnSubmit = formContacto.querySelector("button[type='submit']");
      btnSubmit.textContent = "Enviando...";
      btnSubmit.disabled = true;

      try {
        const response = await fetch("http://localhost:3001/contacto", {
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
          alert("✅ Mensaje enviado correctamente. Te responderemos a la brevedad.");
          this.reset();
        } else {
          alert("❌ Error al enviar el mensaje. Intentá de nuevo.");
        }

      } catch (error) {
        alert("❌ No se pudo conectar con el servidor. Intentá de nuevo.");
        console.error(error);
      } finally {
        btnSubmit.textContent = "Enviar mensaje";
        btnSubmit.disabled = false;
      }
    });
  }

  // ── CHECKOUT ──────────────────────────────
  const checkoutLista = document.getElementById("checkoutLista");
  if (checkoutLista) {
    const carritoActual = JSON.parse(localStorage.getItem("carrito")) || [];

    if (carritoActual.length === 0) {
      window.location.href = "./alquiler.html";
    }

    let total = 0;

    carritoActual.forEach((item) => {
      const div = document.createElement("div");
      div.classList.add("checkout-item");

      const info = document.createElement("div");
      info.classList.add("checkout-item-info");

      const nombre = document.createElement("strong");
      nombre.textContent = item.nombre;
      info.appendChild(nombre);

      if (item.medida) {
        const medida = document.createElement("small");
        medida.textContent = `Talle/Medida: ${item.medida}`;
        info.appendChild(medida);
      }

      const cantidad = document.createElement("span");
      cantidad.classList.add("checkout-item-cantidad");
      cantidad.textContent = `x${item.cantidad}`;

      const precio = document.createElement("div");
      precio.classList.add("checkout-item-precio");
      precio.textContent = `$${formatearPrecio(item.precio * item.cantidad)}`;

      div.appendChild(info);
      div.appendChild(cantidad);
      div.appendChild(precio);
      checkoutLista.appendChild(div);

      total += item.precio * item.cantidad;
    });

    const subtotalEl = document.getElementById("checkoutSubtotal");
    const totalEl = document.getElementById("checkoutTotal");
    if (subtotalEl) subtotalEl.textContent = `$${formatearPrecio(total)}`;
    if (totalEl) totalEl.textContent = `$${formatearPrecio(total)}`;

    const fechaInicio = document.getElementById("fecha_inicio");
    const fechaFin = document.getElementById("fecha_fin");
    const checkoutDias = document.getElementById("checkoutDias");
    const cantDias = document.getElementById("cantDias");

    function calcularDias() {
      if (fechaInicio?.value && fechaFin?.value) {
        const ini = new Date(fechaInicio.value);
        const fin = new Date(fechaFin.value);
        const dias = Math.ceil((fin - ini) / (1000 * 60 * 60 * 24));
        if (dias > 0) {
          cantDias.textContent = dias;
          checkoutDias.style.display = "flex";
        } else {
          checkoutDias.style.display = "none";
        }
      }
    }

    fechaInicio?.addEventListener("change", calcularDias);
    fechaFin?.addEventListener("change", calcularDias);

    const formReservaCheckout = document.getElementById("formReserva");
    if (formReservaCheckout) {
      formReservaCheckout.addEventListener("submit", async function (e) {
        e.preventDefault();

        const checkPrivacidad = document.getElementById("checkPrivacidad");
        if (!checkPrivacidad?.checked) {
          alert("Aceptá los términos y la política de privacidad para continuar.");
          return;
        }

        const formData = new FormData(this);
        const fechaIni = new Date(formData.get("fecha_inicio"));
        const fechaF = new Date(formData.get("fecha_fin"));

        if (fechaF <= fechaIni) {
          alert("La fecha de fin debe ser posterior a la fecha de inicio.");
          return;
        }

        const btnConfirmar = document.getElementById("btnConfirmar");
        btnConfirmar.textContent = "Enviando...";
        btnConfirmar.disabled = true;

        try {
          const response = await fetch("http://localhost:3001/reserva", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nombre: formData.get("nombre"),
              email: formData.get("email"),
              telefono: formData.get("telefono") || "No indicado",
              dni: formData.get("dni") || "No indicado",
              fecha_inicio: formData.get("fecha_inicio"),
              fecha_fin: formData.get("fecha_fin"),
              notas: formData.get("notas") || "",
              carrito: carritoActual,
            }),
          });

          const data = await response.json();

          if (data.ok) {
            const exito = document.getElementById("checkoutExito");
            const exitoInfo = document.getElementById("checkoutExitoInfo");

            if (exitoInfo) {
              exitoInfo.innerHTML = `
                <strong>Nombre:</strong> ${formData.get("nombre")}<br>
                <strong>Email:</strong> ${formData.get("email")}<br>
                <strong>Fechas:</strong> ${formData.get("fecha_inicio")} al ${formData.get("fecha_fin")}<br>
                <strong>Total:</strong> $${formatearPrecio(total)}
              `;
            }

            if (exito) exito.style.display = "flex";

            localStorage.removeItem("carrito");
            carrito = [];

          } else {
            alert("❌ Error al enviar la reserva. Intentá de nuevo.");
            btnConfirmar.textContent = "Confirmar reserva →";
            btnConfirmar.disabled = false;
          }

        } catch (error) {
          alert("❌ No se pudo conectar con el servidor. Intentá de nuevo.");
          console.error(error);
          btnConfirmar.textContent = "Confirmar reserva →";
          btnConfirmar.disabled = false;
        }
      });
    }
  }

  // ── Render inicial ────────────────────────
  renderCarrito();
  actualizarContador();
});