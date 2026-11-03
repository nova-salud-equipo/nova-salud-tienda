// Íconos SVG de trazo (estilo lineal), sin dependencias externas.
const I = ({ d, size = 20, children, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    {d ? <path d={d} /> : children}
  </svg>
)

export const Buscar = (p) => <I {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></I>
export const Carro = (p) => <I {...p}><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2.5 3h2.6l2.4 11.4a1.8 1.8 0 0 0 1.8 1.4h8.4a1.8 1.8 0 0 0 1.8-1.4L21 7H6" /></I>
export const Camion = (p) => <I {...p}><path d="M3 6h11v10H3zM14 9h4l3 3.5V16h-7" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17.5" cy="17.5" r="1.8" /></I>
export const Reloj = (p) => <I {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></I>
export const Escudo = (p) => <I {...p}><path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z" /><path d="m9 12 2 2 4-4" /></I>
export const Tienda = (p) => <I {...p}><path d="M4 10v10h16V10M3 4h18l-1.5 6h-15zM9.5 20v-5h5v5" /></I>
export const Pastilla = (p) => <I {...p}><path d="M10.5 20.5a5 5 0 0 1-7-7l6-6a5 5 0 0 1 7 7z" /><path d="m8.5 8.5 7 7" /></I>
export const Hoja = (p) => <I {...p}><path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15" /><path d="M5 19c3-4 6-6.5 9.5-8.5" /></I>
export const Bebe = (p) => <I {...p}><circle cx="12" cy="12" r="9" /><path d="M9 10h.01M15 10h.01M9.5 15a3.5 3.5 0 0 0 5 0" /></I>
export const Gota = (p) => <I {...p}><path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11z" /></I>
export const Corazon = (p) => <I {...p}><path d="M20.4 5.6a5 5 0 0 0-7.1 0L12 6.9l-1.3-1.3a5 5 0 0 0-7.1 7.1L12 21l8.4-8.3a5 5 0 0 0 0-7.1z" /><path d="M3.5 12h4l1.5-2.5 2.5 5 1.5-2.5h7.5" /></I>
export const Estetoscopio = (p) => <I {...p}><path d="M5 3v6a5 5 0 0 0 10 0V3" /><path d="M10 14v2a5 5 0 0 0 10 0v-2" /><circle cx="20" cy="12" r="2" /></I>
export const Check = (p) => <I {...p} d="M20 6 9 17l-5-5" />
export const Mas = (p) => <I {...p} d="M12 5v14M5 12h14" />
export const Menos = (p) => <I {...p} d="M5 12h14" />
export const Basura = (p) => <I {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></I>
export const Flecha = (p) => <I {...p} d="M19 12H5m6-6-6 6 6 6" />
export const FlechaDer = (p) => <I {...p} d="M5 12h14m-6-6 6 6-6 6" />
export const Paquete = (p) => <I {...p}><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></I>
export const Ubicacion = (p) => <I {...p}><path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></I>
export const Telefono = (p) => <I {...p} d="M21 16.5v3a2 2 0 0 1-2.2 2A19 19 0 0 1 2.5 5.2 2 2 0 0 1 4.5 3h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.5 10.8a16 16 0 0 0 4.7 4.7l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
export const Correo = (p) => <I {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></I>
export const Receta = (p) => <I {...p}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6M8 13h8M8 17h5" /></I>
export const Tarjeta = (p) => <I {...p}><rect x="2.5" y="5" width="19" height="14" rx="2" /><path d="M2.5 10h19M6.5 15h4" /></I>
export const Movil = (p) => <I {...p}><rect x="6" y="2.5" width="12" height="19" rx="2.5" /><path d="M11 18h2" /></I>
export const Billete = (p) => <I {...p}><rect x="2.5" y="6" width="19" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M6 12h.01M18 12h.01" /></I>
export const Alerta = (p) => <I {...p}><circle cx="12" cy="12" r="9" /><path d="M12 8v4.5M12 16h.01" /></I>
export const Info = (p) => <I {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></I>
export const Copiar = (p) => <I {...p}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" /></I>

// Logo: cruz de farmacia dentro de un escudo redondeado.
export const Logo = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
    <rect width="40" height="40" rx="11" fill="var(--teal)" />
    <path d="M16.5 9h7v7.5H31v7h-7.5V31h-7v-7.5H9v-7h7.5z" fill="#fff" />
    <circle cx="31" cy="9" r="4" fill="var(--accent)" stroke="var(--teal)" strokeWidth="2" />
  </svg>
)

// Ícono y color de cada categoría según su nombre (las categorías vienen de la API).
const TEMAS = [
  { k: ['dolor', 'analg', 'fiebre', 'antiinfl'], i: Pastilla, c: 'teal' },
  { k: ['vitamin', 'suplem', 'natural', 'nutri'], i: Hoja, c: 'lime' },
  { k: ['bebé', 'bebe', 'infant', 'niño', 'mamá'], i: Bebe, c: 'sky' },
  { k: ['piel', 'derma', 'cuidado', 'higiene', 'personal', 'belleza'], i: Gota, c: 'rose' },
  { k: ['cardio', 'presión', 'corazón', 'diabet', 'crónic'], i: Corazon, c: 'red' },
  { k: ['antibi', 'infecc', 'gripe', 'resfr', 'respira', 'alerg', 'tos'], i: Estetoscopio, c: 'violet' },
  { k: ['digest', 'estóm', 'gastro'], i: Paquete, c: 'amber' },
]
const COLORES = ['teal', 'sky', 'violet', 'amber', 'rose', 'lime']
export function temaCategoria(nombre = '') {
  const n = nombre.toLowerCase()
  const t = TEMAS.find((x) => x.k.some((k) => n.includes(k)))
  if (t) return { Icono: t.i, color: t.c }
  const h = [...n].reduce((a, ch) => a + ch.charCodeAt(0), 0)
  return { Icono: Pastilla, color: COLORES[h % COLORES.length] }
}
