// La tienda solo usa rutas públicas de la API: catálogo, crear pedido y seguimiento.
const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '') + '/api'

export async function api(ruta, { method = 'GET', body } = {}) {
  let r
  try {
    r = await fetch(BASE + ruta, { method, headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
  } catch {
    throw new Error('No pudimos conectar con la botica. Revisa tu conexión e inténtalo de nuevo.')
  }
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw Object.assign(new Error(data.error || 'Algo salió mal. Inténtalo de nuevo.'), { status: r.status })
  return data
}

export const money = (n) => 'S/ ' + Number(n || 0).toFixed(2)
