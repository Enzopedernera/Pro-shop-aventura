// =============================================
// script.js — Aventura Pro Shop
// Scope: formulario de contacto (contacto.html)
// El resto de la lógica vive en js/toast.js,
// js/home.js y js/checkout.js
// =============================================

// ── FORMULARIO DE CONTACTO ────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const formContacto = document.getElementById("formContacto");
  if (!formContacto) return;

  formContacto.addEventListener("submit", async function (e) {
    e.preventDefault();
    const formData   = new FormData(this);
    const btnSubmit  = formContacto.querySelector("button[type='submit']");
    const textoOriginal = btnSubmit.textContent;
    btnSubmit.textContent = "Enviando...";
    btnSubmit.disabled = true;
    try {
      const response = await fetch("https://pro-shop-aventura-production.up.railway.app/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre:   formData.get("nombre"),
          email:    formData.get("email"),
          telefono: formData.get("telefono") || "No indicado",
          mensaje:  formData.get("mensaje"),
        }),
      });
      const data = await response.json();
      if (data.ok) {
        mostrarToast("Mensaje enviado correctamente. Te responderemos a la brevedad.", "success", 6000);
        this.reset();
      } else {
        mostrarToast("Error al enviar el mensaje. Intentá de nuevo.", "error");
      }
    } catch {
      mostrarToast("No se pudo conectar con el servidor. Intentá de nuevo.", "error");
    } finally {
      btnSubmit.textContent = textoOriginal;
      btnSubmit.disabled = false;
    }
  });
});
