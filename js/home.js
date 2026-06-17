// ── HOME — Selector de fechas + hero video + preselección de equipo ───────────

// Establece el src del video según viewport ANTES del DOMContentLoaded
// para evitar que el browser cargue el archivo incorrecto.
(function () {
  const video = document.getElementById("heroVideo");
  if (!video) return;
  const src =
    window.innerWidth <= 768
      ? video.dataset.srcMobile || video.dataset.src
      : video.dataset.src;
  if (src) {
    const source = document.createElement("source");
    source.src = src;
    source.type = "video/mp4";
    video.appendChild(source);
    video.load();
  }
})();

// ── SELECTOR DE FECHAS ────────────────────────────────────────────────────────
function initSelectorFechas() {
  const fechaLlegada = document.getElementById("fechaLlegada");
  const fechaSalida  = document.getElementById("fechaSalida");
  const cantPersonas = document.getElementById("cantPersonas");
  const btnBuscar    = document.getElementById("btnBuscarEquipos");
  const contadorDias = document.getElementById("contadorDias");

  if (!fechaLlegada || !btnBuscar) return;

  const hoy = new Date().toISOString().split("T")[0];
  fechaLlegada.min = hoy;
  if (fechaSalida) fechaSalida.min = hoy;

  function actualizarContadorDias() {
    if (!contadorDias) return;
    const llegada = fechaLlegada.value;
    const salida  = fechaSalida ? fechaSalida.value : "";
    if (!llegada || !salida) { contadorDias.style.display = "none"; return; }
    const dias = Math.ceil((new Date(salida) - new Date(llegada)) / 86400000) + 1;
    if (dias > 0) {
      contadorDias.textContent = `📅 ${dias} día${dias > 1 ? "s" : ""} seleccionado${dias > 1 ? "s" : ""}`;
      contadorDias.style.display = "block";
    } else {
      contadorDias.style.display = "none";
    }
  }

  fechaLlegada.addEventListener("change", () => {
    if (fechaSalida) {
      fechaSalida.min = fechaLlegada.value;
      if (fechaSalida.value && fechaSalida.value <= fechaLlegada.value) fechaSalida.value = "";
    }
    actualizarContadorDias();
  });
  if (fechaSalida) fechaSalida.addEventListener("change", actualizarContadorDias);

  btnBuscar.addEventListener("click", (e) => {
    e.preventDefault();
    const llegada  = fechaLlegada.value;
    const salida   = fechaSalida ? fechaSalida.value : "";
    const personas = cantPersonas ? cantPersonas.value : "1";

    if (!llegada) {
      mostrarToast("Seleccioná una fecha de llegada.", "warning");
      fechaLlegada.focus();
      return;
    }
    if (!salida) {
      mostrarToast("Seleccioná una fecha de salida.", "warning");
      if (fechaSalida) fechaSalida.focus();
      return;
    }

    localStorage.setItem("fechaLlegada", llegada);
    localStorage.setItem("fechaSalida",  salida);
    if (personas) localStorage.setItem("cantPersonas", personas);
    sessionStorage.setItem("desdeHome", "1");
    window.location.href = "./page/checkout.html";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initSelectorFechas();

  // Preseleccionar tipo de equipo al ir al checkout desde tarjetas de producto
  document.querySelectorAll(".pack-card-btn[data-tipo]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.setItem("tipoPreseleccionado", btn.dataset.tipo);
      window.location.href = btn.href;
    });
  });

  // Forzar autoplay en iOS/mobile (muted requerido)
  const heroVideo = document.getElementById("heroVideo");
  if (heroVideo) {
    heroVideo.muted = true;
    heroVideo.play().catch(() => {});
  }
});
