import { createContext, useContext, useEffect, useState } from 'react'

const KEY = 'novasalud-carrito'
const KEY_ALERGIA = 'novasalud-alergia-aine'
const KEY_FAVS = 'novasalud-favoritos'
const KEY_PEDIDOS = 'novasalud-pedidos'
const Ctx = createContext(null)
const leerJson = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) || def } catch { return def } }
const guardar = (k, v) => { try { localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)) } catch { /* sin almacenamiento */ } }
const leerAlergia = () => { try { return localStorage.getItem(KEY_ALERGIA) === '1' } catch { return false } }

// Datos del cliente que se guardan solo en su navegador:
// el carrito, si es alérgico a los AINEs, sus favoritos y los pedidos que hizo desde este equipo.
export function CarritoProvider({ children }) {
  const [items, setItems] = useState(() => leerJson(KEY, [])) // [{id, nombre, presentacion, precio, cant, max, receta, aine}]
  const [alergiaAine, setAlergiaAine] = useState(leerAlergia)
  const [favoritos, setFavoritos] = useState(() => leerJson(KEY_FAVS, [])) // [id]
  const [pedidos, setPedidos] = useState(() => leerJson(KEY_PEDIDOS, [])) // [{codigo, celular, total, fecha}]
  useEffect(() => guardar(KEY, items), [items])
  useEffect(() => guardar(KEY_ALERGIA, alergiaAine ? '1' : '0'), [alergiaAine])
  useEffect(() => guardar(KEY_FAVS, favoritos), [favoritos])
  useEffect(() => guardar(KEY_PEDIDOS, pedidos), [pedidos])

  const agregar = (p, cant = 1) => setItems((xs) => {
    const ya = xs.find((x) => x.id === p.id)
    if (ya) return xs.map((x) => (x.id === p.id ? { ...x, cant: Math.min(x.cant + cant, p.disponible) } : x))
    return [...xs, { id: p.id, nombre: p.nombre, presentacion: p.presentacion, precio: p.precioFinal, cant: Math.min(cant, p.disponible), max: p.disponible, receta: p.requiereReceta, aine: !!p.contieneAine }]
  })
  const cambiar = (id, cant) => setItems((xs) => xs.flatMap((x) => (x.id !== id ? [x] : cant <= 0 ? [] : [{ ...x, cant: Math.min(cant, x.max) }])))
  const vaciar = () => setItems([])
  // Actualiza precios y topes con el catálogo más reciente.
  const sincronizar = (catalogo) => setItems((xs) => xs.flatMap((x) => {
    const p = catalogo.find((c) => c.id === x.id)
    if (!p || p.agotado) return []
    return [{ ...x, precio: p.precioFinal, max: p.disponible, cant: Math.min(x.cant, p.disponible), receta: p.requiereReceta, aine: !!p.contieneAine }]
  }))

  const esFavorito = (id) => favoritos.includes(id)
  const alternarFavorito = (id) => setFavoritos((fs) => (fs.includes(id) ? fs.filter((f) => f !== id) : [...fs, id]))

  // Los últimos 5 pedidos hechos desde este equipo, para volver a verlos sin escribir el código.
  const recordarPedido = (p) => setPedidos((ps) => [{ ...ps.find((x) => x.codigo === p.codigo), ...p }, ...ps.filter((x) => x.codigo !== p.codigo)].slice(0, 5))
  const olvidarPedidos = () => setPedidos([])

  const total = Math.round(items.reduce((t, x) => t + x.cant * x.precio, 0) * 100) / 100
  const unidades = items.reduce((t, x) => t + x.cant, 0)
  return (
    <Ctx.Provider value={{ items, agregar, cambiar, vaciar, sincronizar, total, unidades, alergiaAine, setAlergiaAine, favoritos, esFavorito, alternarFavorito, pedidos, recordarPedido, olvidarPedidos }}>
      {children}
    </Ctx.Provider>
  )
}
export const useCarrito = () => useContext(Ctx)
