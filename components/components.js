// =============================================
// components.js — inyecta header y footer en todas las páginas
//
// Uso en cada HTML (reemplaza el bloque de header/footer):
//   <div id="site-header"></div>
//   ...contenido de la página...
//   <div id="site-footer"></div>
//   <script src="{{COMPONENTS_PATH}}components/components.js"></script>
// =============================================

(function () {
  // Calcula el path hasta la raíz del proyecto según la profundidad de la URL.
  // /index.html            → base = ""
  // /page/alquiler.html    → base = "../"
  // /page/tiendas/ski.html → base = "../../"
  function getBase() {
    const parts = window.location.pathname.split("/").filter(Boolean);
    // Descarta el nombre del archivo (último segmento)
    const depth = parts.length > 0 ? parts.length - 1 : 0;
    return depth === 0 ? "" : "../".repeat(depth);
  }

  function loadComponent(elementId, file, base, callback) {
    const el = document.getElementById(elementId);
    if (!el) return;

    // Si estamos en file:// (Live Server sin servidor HTTP), fetch falla.
    // Usamos XMLHttpRequest síncrono como fallback, que sí funciona en file://.
    var isFile = window.location.protocol === "file:";

    if (isFile) {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", base + "components/" + file, false); // síncrono
      try {
        xhr.send();
        if (xhr.status === 0 || xhr.status === 200) {
          el.innerHTML = xhr.responseText.replaceAll("{{BASE}}", base);
          if (callback) callback();
        }
      } catch (err) {
        console.error("[components.js] XHR error:", err);
      }
      return;
    }

    fetch(base + "components/" + file)
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo cargar " + file);
        return res.text();
      })
      .then((html) => {
        el.innerHTML = html.replaceAll("{{BASE}}", base);
        if (callback) callback();
      })
      .catch((err) => console.error("[components.js]", err));
  }

  function initHamburger() {
    const hamburguesa = document.getElementById("hamburguesa");
    const menu = document.getElementById("menu");
    if (!hamburguesa || !menu) return;

    // Evita duplicar listeners
    hamburguesa.replaceWith(hamburguesa.cloneNode(true));
    const btn = document.getElementById("hamburguesa");

    btn.addEventListener("click", () => {
      const abierto = menu.classList.toggle("active");
      btn.setAttribute("aria-expanded", abierto);
    });

    document.addEventListener("click", (e) => {
      if (!btn.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.remove("active");
        btn.setAttribute("aria-expanded", "false");
      }
    });
  }

  const base = getBase();
  loadComponent("site-header", "header.html", base, initHamburger);
  loadComponent("site-footer", "footer.html", base);
})();