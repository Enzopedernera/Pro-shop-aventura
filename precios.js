// =============================================
// precios.js — FUENTE DE VERDAD DE TARIFAS
// Rental Pro Shop — temporada 2026
//
// Para actualizar precios: editá solo este archivo.
// Los cambios se reflejan automáticamente en:
//   - Tarjetas de equipos (alquiler.html)
//   - Tabla de tarifas (alquiler.html)
//   - Cálculo del checkout (script.js lo importa)
// =============================================

const PRECIOS = {
  // ── PACKS PRINCIPALES ─────────────────────
  ski_adulto:    { 1: 55000, 3: 141000, 4: 179000, 5: 212000, 6: 241000, 7: 267000 },
  ski_junior:    { 1: 43000, 3: 110000, 4: 140000, 5: 166000, 6: 188000, 7: 208000 },
  snow_adulto:   { 1: 58000, 3: 149000, 4: 189000, 5: 224000, 6: 254000, 7: 281000 },
  snow_junior:   { 1: 44000, 3: 113000, 4: 143000, 5: 170000, 6: 193000, 7: 213000 },

  // ── EQUIPOS SUELTOS ───────────────────────
  solo_ski_adulto:   { 1: 38000, 3: 97000,  4: 124000, 5: 147000, 6: 167000, 7: 185000 },
  solo_ski_junior:   { 1: 30000, 3: 77000,  4: 98000,  5: 116000, 6: 132000, 7: 146000 },
  solo_snow_adulto:  { 1: 40000, 3: 103000, 4: 131000, 5: 155000, 6: 176000, 7: 195000 },
  solo_snow_junior:  { 1: 31000, 3: 79000,  4: 101000, 5: 120000, 6: 136000, 7: 150000 },
  solo_bota_ski:     { 1: 22000, 3: 56000,  4: 72000,  5: 85000,  6: 97000,  7: 107000 },
  solo_bota_snow:    { 1: 23000, 3: 59000,  4: 75000,  5: 89000,  6: 101000, 7: 112000 },

  // ── ACCESORIOS ────────────────────────────
  casco:         { 1: 19000, 3: 49000,  4: 62000,  5: 73000,  6: 83000,  7: 92000  },
  antiparras:    { 1: 27000, 3: 69000,  4: 88000,  5: 104000, 6: 118000, 7: 131000 },
  guantes:       { 1: 13000, 3: 33000,  4: 42000,  5: 50000,  6: 57000,  7: 63000  },
  botas_preski:  { 1: 15000, 3: 38000,  4: 48000,  5: 58000,  6: 65500,  7: 73000  },
  bastones:      { 1: 20000, 3: 51000,  4: 65000,  5: 77000,  6: 87000,  7: 97000  },
  raquetas:      { 1: 25000 },
  trineo:        { 1: 15000 },

  // ── INDUMENTARIA ──────────────────────────
  campera_adulto:  { 1: 23000, 3: 61000,  4: 78000,  5: 92000,  6: 105000, 7: 116000 },
  campera_nino:    { 1: 17000, 3: 45000,  4: 58000,  5: 69000,  6: 79000,  7: 87000  },
  pantalon_adulto: { 1: 20000, 3: 53000,  4: 78000,  5: 92000,  6: 105000, 7: 116000 },
  pantalon_nino:   { 1: 14000, 3: 38000,  4: 48000,  5: 58000,  6: 66000,  7: 74000  },
  combo_adulto:    { 1: 39000, 3: 103000, 4: 131000, 5: 156000, 6: 177000, 7: 196000 },
  combo_nino:      { 1: 29000, 3: 76000,  4: 97000,  5: 115000, 6: 131000, 7: 145000 },
};

// Nombres para mostrar en tarjetas y tabla
const NOMBRES = {
  ski_adulto:      "Pack Ski Adulto",
  ski_junior:      "Pack Ski Junior",
  snow_adulto:     "Pack Snowboard Adulto",
  snow_junior:     "Pack Snowboard Junior",
  solo_ski_adulto:   "Solo Esquí Adulto",
  solo_ski_junior:   "Solo Esquí Junior",
  solo_snow_adulto:  "Solo Snowboard Adulto",
  solo_snow_junior:  "Solo Snowboard Junior",
  solo_bota_ski:     "Solo Bota de Ski",
  solo_bota_snow:    "Solo Bota de Snowboard",
  casco:           "Casco",
  antiparras:      "Antiparras",
  guantes:         "Guantes",
  botas_preski:    "Botas Preski",
  bastones:        "Bastones",
  raquetas:        "Raquetas",
  trineo:          "Trineo",
  campera_adulto:  "Campera Adulto",
  campera_nino:    "Campera Niño",
  pantalon_adulto: "Pantalón Adulto",
  pantalon_nino:   "Pantalón Niño",
  combo_adulto:    "Campera + Pantalón Adulto",
  combo_nino:      "Campera + Pantalón Niño",
};

// ── HELPERS ───────────────────────────────────────────────────────────────────
function formatPrecio(n) {
  return Number(n).toLocaleString("es-AR");
}

function getPrecio(key, dias) {
  const tabla = PRECIOS[key];
  if (!tabla) return 0;
  if (dias <= 0) return 0;
  if (dias === 1) return tabla[1] ?? 0;
  if (dias === 2) return (tabla[1] ?? 0) * 2;
  if (dias <= 7)  return tabla[dias] ?? (tabla[1] ?? 0) * dias;
  return (tabla[7] ?? tabla[1] ?? 0);
}

// ── INYECCIÓN EN TARJETAS ─────────────────────────────────────────────────────
// Busca elementos con data-precio-key="ski_adulto" y los rellena automáticamente
function inyectarPreciosTarjetas() {
  document.querySelectorAll("[data-precio-key]").forEach((el) => {
    const key = el.dataset.precioKey;
    const precio = PRECIOS[key]?.[1];
    if (precio !== undefined) {
      el.textContent = "$" + formatPrecio(precio);
    }
  });
}

// ── INYECCIÓN EN TABLAS ───────────────────────────────────────────────────────
// Busca elementos con data-precio-key y data-dias y los rellena
function inyectarPreciosTabla() {
  document.querySelectorAll("[data-precio-key][data-dias]").forEach((el) => {
    const key  = el.dataset.precioKey;
    const dias = parseInt(el.dataset.dias, 10);
    const precio = getPrecio(key, dias);
    if (precio > 0) {
      el.textContent = "$" + formatPrecio(precio);
      el.dataset.precio = precio; // mantiene data-precio para el JS del carrito
    }
  });
}

// Ejecuta al cargar
document.addEventListener("DOMContentLoaded", () => {
  inyectarPreciosTarjetas();
  inyectarPreciosTabla();
});


// Expone al scope global para que script.js pueda usarlos
window.PRECIOS   = PRECIOS;
window.getPrecio = getPrecio;