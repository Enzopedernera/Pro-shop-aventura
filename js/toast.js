// ── SISTEMA DE TOASTS ─────────────────────────────────────────────────────────
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
  requestAnimationFrame(() => toast.classList.add("toast-visible"));
  toast._timer = setTimeout(() => cerrarToast(toast), duracion);
}

function cerrarToast(toast) {
  clearTimeout(toast._timer);
  toast.classList.remove("toast-visible");
  toast.addEventListener("transitionend", () => toast.remove(), { once: true });
}
