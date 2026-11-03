import { useState } from 'react'
import { flushSync } from 'react-dom'

export default function Tema() {
  const [oscuro, setOscuro] = useState(() => document.documentElement.dataset.theme === 'dark')
  const [cambiando, setCambiando] = useState(false)
  async function cambiar(event) {
    const siguiente = !oscuro
    const aplicar = () => {
      document.documentElement.dataset.theme = siguiente ? 'dark' : 'light'
      try { localStorage.setItem('nova-tema', siguiente ? 'dark' : 'light') } catch {}
      flushSync(() => setOscuro(siguiente))
    }
    if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      aplicar()
      return
    }
    const rect = event.currentTarget.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    const radio = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
    setCambiando(true)
    const transicion = document.startViewTransition(aplicar)
    try {
      await transicion.ready
      await document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radio}px at ${x}px ${y}px)`] },
        { duration: 550, easing: 'cubic-bezier(.23,1,.32,1)', pseudoElement: '::view-transition-new(root)' },
      ).finished
    } catch {
      // El tema ya está aplicado aunque el navegador interrumpa la animación.
    } finally {
      setCambiando(false)
    }
  }
  return <button className="theme-button" disabled={cambiando} onClick={cambiar} aria-pressed={oscuro} aria-label={oscuro ? 'Activar modo claro' : 'Activar modo oscuro'}><span key={String(oscuro)} className="theme-symbol" aria-hidden="true">{oscuro ? '☀' : '☾'}</span><span>{oscuro ? 'Claro' : 'Oscuro'}</span></button>
}
