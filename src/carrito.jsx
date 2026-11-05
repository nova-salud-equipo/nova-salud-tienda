import { createContext, useContext, useEffect, useState } from 'react'

const KEY = 'novasalud-carrito'
const KEY_ALERGIA = 'novasalud-alergia-aine'
const Ctx = createContext(null)
const leer = () => { try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch { return [] } }
const leerAlergia = () => { try { return localStorage.getItem(KEY_ALERGIA) === '1' } catch { return false } }

// Carrito del cliente: se guarda en su navegador para que no lo pierda al recargar.
// También recuerda si el cliente indicó que es alérgico a los AINEs.
export function CarritoProvider({ children }) {
  const [items, setItems] = useState(leer) // [{id, nombre, precio, cant, max, receta, aine}]
  const [alergiaAine, setAlergiaAine] = useState(leerAlergia)
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(items)) } catch { /* sin almacenamiento */ } }, [items])
  useEffect(() => { try { localStorage.setItem(KEY_ALERGIA, alergiaAine ? '1' : '0') } catch { /* sin almacenamiento */ } }, [alergiaAine])
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
  const total = Math.round(items.reduce((t, x) => t + x.cant * x.precio, 0) * 100) / 100
  const unidades = items.reduce((t, x) => t + x.cant, 0)
  return <Ctx.Provider value={{ items, agregar, cambiar, vaciar, sincronizar, total, unidades, alergiaAine, setAlergiaAine }}>{children}</Ctx.Provider>
}
export const useCarrito = () => useContext(Ctx)
