// =============================================
// CARRITO — Rental Pro Shop
// =============================================

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
  const existe = carrito.find(item => item.nombre === nombre && item.medida === medida);
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

function filtrarProductos(categoria, botonActivo) {
  document.querySelectorAll(".producto").forEach((producto) => {
    const cat = producto.dataset.categoria;
    if (!cat) { producto.style.display = "flex"; return; }
    producto.style.display = categoria === "todos" || cat === categoria ? "flex" : "none";
  });

  if (botonActivo) {
    document.querySelectorAll(".filtros button").forEach(btn => btn.classList.remove("activo"));
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
        if (selectMedida && !medida) { alert("Seleccioná una medida"); return; }
      } else {
        nombre = boton.dataset.nombre;
        precio = parseFloat(boton.dataset.precio);
        const selectMedida = contenedor.querySelector(".medida");
        medida = selectMedida ? selectMedida.value : "";
        if (selectMedida && !medida) { alert("Seleccioná una medida"); return; }
      }

      agregarAlCarrito(nombre, precio, medida);
    });
  });

  // Celdas tabla de precios
  document.querySelectorAll(".precio").forEach((celda) => {
    celda.addEventListener("click", () => {
      const producto = celda.dataset.producto;
      const diasCelda = celda.dataset.dias;
      const precio = parseInt(celda.dataset.precio);
      const nombre = diasCelda ? `${producto} (${diasCelda} día/s)` : producto;

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

  // Formulario CONTACTO
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
  const listaEsquiadores = document.getElementById("listaEsquiadores");
  if (listaEsquiadores) {

    const TABLA_PRECIOS = {
      ski_adulto:      { 1: 55000,  3: 141000, 4: 179000, 5: 212000, 6: 241000, 7: 267000 },
      ski_junior:      { 1: 43000,  3: 110000, 4: 140000, 5: 166000, 6: 188000, 7: 208000 },
      snow_adulto:     { 1: 58000,  3: 149000, 4: 189000, 5: 224000, 6: 254000, 7: 281000 },
      snow_junior:     { 1: 44000,  3: 113000, 4: 143000, 5: 170000, 6: 193000, 7: 213000 },
      casco:           { 1: 19000,  3: 49000,  4: 62000,  5: 73000,  6: 83000,  7: 92000  },
      antiparras:      { 1: 27000,  3: 69000,  4: 88000,  5: 104000, 6: 118000, 7: 131000 },
      campera_adulto:  { 1: 23000,  3: 61000,  4: 78000,  5: 92000,  6: 105000, 7: 116000 },
      campera_nino:    { 1: 17000,  3: 45000,  4: 58000,  5: 69000,  6: 79000,  7: 87000  },
      pantalon_adulto: { 1: 20000,  3: 53000,  4: 78000,  5: 92000,  6: 105000, 7: 116000 },
      pantalon_nino:   { 1: 14000,  3: 38000,  4: 48000,  5: 58000,  6: 66000,  7: 74000  },
    };

    function getPrecio(equipo, d) {
      const tabla = TABLA_PRECIOS[equipo];
      if (!tabla) return 0;
      if (tabla[d]) return tabla[d];
      if (d >= 7) return tabla[7];
      if (d >= 6) return tabla[6];
      if (d >= 5) return tabla[5];
      if (d >= 4) return tabla[4];
      if (d >= 3) return tabla[3];
      return tabla[1] * d;
    }

    function calcularDiasEsq(inicio, fin) {
      if (!inicio || !fin) return 0;
      const ini = new Date(inicio);
      const f = new Date(fin);
      const d = Math.ceil((f - ini) / (1000 * 60 * 60 * 24));
      return d > 0 ? d : 0;
    }

    let cantEsq = 1;
    let esquiadores = [];

    document.getElementById("btnMasEsq")?.addEventListener("click", () => {
      if (cantEsq < 6) {
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
        nombre: "", edad: "adulto", tipo: "ski",
        altura: "", talleBota: "",
        fecha_inicio: "", fecha_fin: "",
        casco: false, talleCasco: "M",
        antiparras: false, talleAntiparras: "M",
        indumentaria: false, talleIndum: "M",
      };
    }

    function renderEsquiadores() {
      while (esquiadores.length < cantEsq) esquiadores.push(esquiadorDefault());
      while (esquiadores.length > cantEsq) esquiadores.pop();

      listaEsquiadores.innerHTML = "";

      esquiadores.forEach((esq, i) => {
        const diasEsq = calcularDiasEsq(esq.fecha_inicio, esq.fecha_fin);
        const div = document.createElement("div");
        div.classList.add("esquiador-card");
        div.innerHTML = `
          <div class="esquiador-header">
            <div class="esq-num">${i + 1}</div>
            <span class="esq-titulo">Esquiador ${i + 1}</span>
            <span class="esq-badge">${esq.edad === "adulto" ? "Adulto" : "Niño"} · ${esq.tipo === "ski" ? "Ski" : "Snowboard"}</span>
          </div>

          <div class="checkout-grid" style="margin-bottom:14px">
            <div class="campo">
              <label>Nombre (opcional)</label>
              <input type="text" value="${esq.nombre}" placeholder="Ej: Juan"
                onchange="actualizarEsq(${i}, 'nombre', this.value)" />
            </div>
            <div class="campo">
              <label>Edad</label>
              <select onchange="actualizarEsq(${i}, 'edad', this.value)">
                <option value="adulto" ${esq.edad === "adulto" ? "selected" : ""}>Adulto (15+ años)</option>
                <option value="nino" ${esq.edad === "nino" ? "selected" : ""}>Niño (hasta 14 años)</option>
              </select>
            </div>
          </div>

          <div class="tipo-toggle">
            <button type="button" class="tipo-btn ${esq.tipo === "ski" ? "activo" : ""}"
              onclick="actualizarEsq(${i}, 'tipo', 'ski')">🎿 Ski (ski + botas + bastones)</button>
            <button type="button" class="tipo-btn ${esq.tipo === "snow" ? "activo" : ""}"
              onclick="actualizarEsq(${i}, 'tipo', 'snow')">🏂 Snowboard (tabla + botas)</button>
          </div>

          <div class="checkout-grid" style="margin:14px 0">
            <div class="campo">
              <label>Altura (cm)</label>
              <select onchange="actualizarEsq(${i}, 'altura', this.value)">
                <option value="">Seleccioná</option>
                ${[100,110,120,125,130,135,140,145,150,155,160,165,170,175,180,185,190]
                  .map(h => `<option value="${h}" ${esq.altura == h ? "selected" : ""}>${h} cm</option>`).join("")}
              </select>
            </div>
            <div class="campo">
              <label>Talle bota EU</label>
              <select onchange="actualizarEsq(${i}, 'talleBota', this.value)">
                <option value="">Seleccioná</option>
                ${[28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45]
                  .map(t => `<option value="${t}" ${esq.talleBota == t ? "selected" : ""}>${t}</option>`).join("")}
              </select>
            </div>
          </div>

          <div class="esq-section">Fechas de alquiler</div>
          <div class="checkout-grid" style="margin-bottom:8px">
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
          ${diasEsq > 0 ? `<div class="checkout-dias" style="display:flex;margin-bottom:10px;gap:8px">
            <span>📅</span><strong>${diasEsq}</strong>&nbsp;día/s de alquiler
          </div>` : ""}

          <div class="esq-section">Accesorios</div>

          <div class="accesorio-row">
            <span class="acc-label">Casco</span>
            <div class="acc-toggle">
              <button type="button" class="${esq.casco ? "activo" : ""}"
                onclick="actualizarEsq(${i}, 'casco', true)">Sí</button>
              <button type="button" class="${!esq.casco ? "activo" : ""}"
                onclick="actualizarEsq(${i}, 'casco', false)">No</button>
            </div>
            ${esq.casco ? `<select onchange="actualizarEsq(${i}, 'talleCasco', this.value)">
              ${["S","M","L","XL"].map(t => `<option ${esq.talleCasco === t ? "selected" : ""}>${t}</option>`).join("")}
            </select>` : ""}
          </div>

          <div class="accesorio-row">
            <span class="acc-label">Antiparras</span>
            <div class="acc-toggle">
              <button type="button" class="${esq.antiparras ? "activo" : ""}"
                onclick="actualizarEsq(${i}, 'antiparras', true)">Sí</button>
              <button type="button" class="${!esq.antiparras ? "activo" : ""}"
                onclick="actualizarEsq(${i}, 'antiparras', false)">No</button>
            </div>
            ${esq.antiparras ? `<select onchange="actualizarEsq(${i}, 'talleAntiparras', this.value)">
              ${["S","M","L","XL"].map(t => `<option ${esq.talleAntiparras === t ? "selected" : ""}>${t}</option>`).join("")}
            </select>` : ""}
          </div>

          <div class="esq-section">Indumentaria</div>

          <div class="accesorio-row">
            <span class="acc-label">Campera + Pantalón</span>
            <div class="acc-toggle">
              <button type="button" class="${esq.indumentaria ? "activo" : ""}"
                onclick="actualizarEsq(${i}, 'indumentaria', true)">Sí</button>
              <button type="button" class="${!esq.indumentaria ? "activo" : ""}"
                onclick="actualizarEsq(${i}, 'indumentaria', false)">No</button>
            </div>
            ${esq.indumentaria ? `<select onchange="actualizarEsq(${i}, 'talleIndum', this.value)">
              ${["S","M","L","XL","4","6","8","10","12","14"].map(t => `<option ${esq.talleIndum === t ? "selected" : ""}>${t}</option>`).join("")}
            </select>` : ""}
          </div>
        `;
        listaEsquiadores.appendChild(div);
      });

      actualizarResumen();
    }

    window.actualizarEsq = function(i, campo, valor) {
      esquiadores[i][campo] = valor;
      renderEsquiadores();
    };

    function precioEsquiador(esq) {
      const d = calcularDiasEsq(esq.fecha_inicio, esq.fecha_fin) || 1;
      const esNino = esq.edad === "nino";
      let total = 0;

      if (esq.tipo === "ski") {
        total += getPrecio(esNino ? "ski_junior" : "ski_adulto", d);
      } else {
        total += getPrecio(esNino ? "snow_junior" : "snow_adulto", d);
      }

      if (esq.casco) total += getPrecio("casco", d);
      if (esq.antiparras) total += getPrecio("antiparras", d);
      if (esq.indumentaria) {
        total += getPrecio(esNino ? "campera_nino" : "campera_adulto", d);
        total += getPrecio(esNino ? "pantalon_nino" : "pantalon_adulto", d);
      }

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
        titulo.textContent = `${esq.nombre || `Esquiador ${i + 1}`} — ${esq.edad === "adulto" ? "Adulto" : "Niño"} · ${esq.tipo === "ski" ? "Ski" : "Snowboard"} · ${d} día/s`;
        grupo.appendChild(titulo);

        const items = [];
        const packKey = esq.tipo === "ski" ? (esNino ? "ski_junior" : "ski_adulto") : (esNino ? "snow_junior" : "snow_adulto");
        const packLabel = esq.tipo === "ski"
          ? (esNino ? "Pack Ski Junior (ski + botas + bastones)" : "Pack Ski Adulto (ski + botas + bastones)")
          : (esNino ? "Pack Snowboard Junior (tabla + botas)" : "Pack Snowboard Adulto (tabla + botas)");

        items.push([packLabel, getPrecio(packKey, d)]);
        if (esq.casco) items.push([`Casco talle ${esq.talleCasco}`, getPrecio("casco", d)]);
        if (esq.antiparras) items.push([`Antiparras talle ${esq.talleAntiparras}`, getPrecio("antiparras", d)]);
        if (esq.indumentaria) {
          items.push([
            `Campera + Pantalón talle ${esq.talleIndum}`,
            getPrecio(esNino ? "campera_nino" : "campera_adulto", d) +
            getPrecio(esNino ? "pantalon_nino" : "pantalon_adulto", d)
          ]);
        }

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

      // Total por día (usando precios de 1 día)
      if (totalDiaEl) {
        const totalPorDia = esquiadores.reduce((acc, esq) => {
          const esNino = esq.edad === "nino";
          const packKey = esq.tipo === "ski" ? (esNino ? "ski_junior" : "ski_adulto") : (esNino ? "snow_junior" : "snow_adulto");
          let t = getPrecio(packKey, 1);
          if (esq.casco) t += getPrecio("casco", 1);
          if (esq.antiparras) t += getPrecio("antiparras", 1);
          if (esq.indumentaria) {
            t += getPrecio(esNino ? "campera_nino" : "campera_adulto", 1);
            t += getPrecio(esNino ? "pantalon_nino" : "pantalon_adulto", 1);
          }
          return acc + t;
        }, 0);
        totalDiaEl.textContent = `$${formatearPrecio(totalPorDia)}`;
      }

      if (totalReservaEl) totalReservaEl.textContent = `$${formatearPrecio(totalGeneral)}`;
    }

    // Submit
    const formReservaCheckout = document.getElementById("formReserva");
    if (formReservaCheckout) {
      formReservaCheckout.addEventListener("submit", async function(e) {
        e.preventDefault();

        const checkPrivacidad = document.getElementById("checkPrivacidad");
        if (!checkPrivacidad?.checked) {
          alert("Aceptá los términos y la política de privacidad para continuar.");
          return;
        }

        const formData = new FormData(this);
        const btnConfirmar = document.getElementById("btnConfirmar");
        btnConfirmar.textContent = "Enviando...";
        btnConfirmar.disabled = true;

        const totalGeneral = esquiadores.reduce((acc, esq) => acc + precioEsquiador(esq), 0);

        try {
          const response = await fetch("http://localhost:3001/reserva", {
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
            const exito = document.getElementById("checkoutExito");
            const exitoInfo = document.getElementById("checkoutExitoInfo");

            if (exitoInfo) {
              exitoInfo.innerHTML = `
                <strong>Nombre:</strong> ${formData.get("nombre")}<br>
                <strong>Email:</strong> ${formData.get("email")}<br>
                <strong>Esquiadores:</strong> ${cantEsq}<br>
                <strong>Total reserva:</strong> $${formatearPrecio(totalGeneral)}
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

    renderEsquiadores();
  }

  // Render inicial carrito
  renderCarrito();
  actualizarContador();
});