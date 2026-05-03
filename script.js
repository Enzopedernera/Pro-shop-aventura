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
// 🔢 CONTADOR TOTAL (PRO)
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
// ➕ AGREGAR
// =========================
function agregarAlCarrito(nombre, precio, medida = "") {

  const existe = carrito.find(
    item => item.nombre === nombre && item.medida === medida
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
// 🖥️ RENDER
// =========================
function renderCarrito() {
  const lista = document.getElementById("listaCarrito");
  const totalSpan = document.getElementById("total");

  if (!lista || !totalSpan) return;

  lista.innerHTML = "";

  let total = 0;

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
// 🔍 FILTRO
// =========================
function filtrarProductos(categoria) {
  document.querySelectorAll(".producto").forEach(producto => {
    const cat = producto.dataset.categoria;
    producto.style.display =
      categoria === "todos" || cat === categoria ? "block" : "none";
  });
}


// =========================
// 🚀 INIT
// =========================
document.addEventListener("DOMContentLoaded", () => {

  // Toggle carrito
  const toggle = document.getElementById("toggleCarrito");
  const drop = document.getElementById("carritoDropdown");

  if (toggle && drop) {
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      drop.style.display =
        drop.style.display === "block" ? "none" : "block";
    });

    document.addEventListener("click", () => {
      drop.style.display = "none";
    });

    drop.addEventListener("click", (e) => e.stopPropagation());
  }

  renderCarrito();
  actualizarContador();
});
document.querySelectorAll(".btn-agregar").forEach(boton => {
  boton.addEventListener("click", () => {

    const producto = boton.closest(".producto");

    const nombre = producto.dataset.nombre;
    const precio = parseFloat(producto.dataset.precio);
    const medida = producto.querySelector(".medida")?.value || "";

    if (producto.querySelector(".medida") && !medida) {
      alert("Seleccioná una medida");
      return;
    }

    agregarAlCarrito(nombre, precio, medida);
  });
});
totalSpan.textContent = "$" + formatearPrecio(total);

