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

  function loadComponent(elementId, file, base) {
    const el = document.getElementById(elementId);
    if (!el) return;

    fetch(base + "components/" + file)
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo cargar " + file);
        return res.text();
      })
      .then((html) => {
        // Reemplaza todos los {{BASE}} por el path calculado
        el.innerHTML = html.replaceAll("{{BASE}}", base);
      })
      .catch((err) => console.error("[components.js]", err));
  }

  const base = getBase();
  loadComponent("site-header", "header.html", base);
  loadComponent("site-footer", "footer.html", base);
})();