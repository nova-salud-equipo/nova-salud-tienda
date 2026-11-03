import { useEffect, useRef, useState } from 'react'

// Efectos visuales: solo con mouse y si el usuario no pidió reducir el movimiento.
const conMouse = () => matchMedia('(pointer: fine)').matches
const conMovimiento = () => !matchMedia('(prefers-reduced-motion: reduce)').matches

// Cursor propio: un punto exacto y un anillo que lo sigue con retraso.
export function Cursor() {
  const dot = useRef(null)
  const ring = useRef(null)
  useEffect(() => {
    if (!conMouse() || !conMovimiento()) return
    const root = document.documentElement
    root.classList.add('cursor-on', 'cursor-out') // oculto hasta el primer movimiento
    let x = -100, y = -100, rx = x, ry = y, raf
    const mover = (e) => {
      x = e.clientX; y = e.clientY
      dot.current.style.transform = `translate(${x}px,${y}px)`
      const t = e.target
      ring.current.classList.toggle('hover', !!t.closest?.('a,button,label.opt,label.check,select,.chip'))
      root.classList.toggle('cursor-text', !!t.closest?.('input:not([type=radio]):not([type=checkbox]),textarea'))
      root.classList.remove('cursor-out')
    }
    const loop = () => { rx += (x - rx) * 0.2; ry += (y - ry) * 0.2; ring.current.style.transform = `translate(${rx}px,${ry}px)`; raf = requestAnimationFrame(loop) }
    const bajar = (e) => {
      ring.current.classList.add('down')
      const w = document.createElement('span')
      w.className = 'click-wave'; w.style.left = e.clientX + 'px'; w.style.top = e.clientY + 'px'
      document.body.appendChild(w); w.addEventListener('animationend', () => w.remove())
    }
    const subir = () => ring.current.classList.remove('down')
    const salir = () => root.classList.add('cursor-out')
    addEventListener('pointermove', mover); addEventListener('pointerdown', bajar); addEventListener('pointerup', subir)
    document.addEventListener('pointerleave', salir)
    loop()
    return () => {
      cancelAnimationFrame(raf); root.classList.remove('cursor-on', 'cursor-text', 'cursor-out')
      removeEventListener('pointermove', mover); removeEventListener('pointerdown', bajar); removeEventListener('pointerup', subir)
      document.removeEventListener('pointerleave', salir)
    }
  }, [])
  return <><div ref={dot} className="cur-dot" aria-hidden="true" /><div ref={ring} className="cur-ring" aria-hidden="true" /></>
}

// Aparición al hacer scroll ([data-reveal]), inclinación 3D (.tilt) y luz que sigue al mouse (.spot).
// Usa atributos data-* porque React reescribe className en cada render.
export function useEfectos() {
  useEffect(() => {
    if (!conMovimiento()) { document.documentElement.classList.add('sin-mov'); return }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.setAttribute('data-shown', ''); io.unobserve(e.target) } }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
    const buscar = () => document.querySelectorAll('[data-reveal]:not([data-shown])').forEach((el) => io.observe(el))
    buscar()
    const mo = new MutationObserver(buscar)
    mo.observe(document.body, { childList: true, subtree: true })

    let actual = null
    const soltar = () => { if (actual) { actual.style.removeProperty('--rx'); actual.style.removeProperty('--ry'); actual = null } }
    const mover = (e) => {
      if (!conMouse()) return
      const card = e.target.closest?.('.tilt')
      if (card !== actual) soltar()
      if (card && !card.classList.contains('off')) {
        actual = card
        const r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height
        card.style.setProperty('--rx', `${(0.5 - py) * 8}deg`); card.style.setProperty('--ry', `${(px - 0.5) * 10}deg`)
        card.style.setProperty('--gx', `${px * 100}%`); card.style.setProperty('--gy', `${py * 100}%`)
      }
      const spot = e.target.closest?.('.spot')
      if (spot) {
        const r = spot.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height
        spot.style.setProperty('--mx', `${px * 100}%`); spot.style.setProperty('--my', `${py * 100}%`)
        spot.style.setProperty('--px', (px - 0.5).toFixed(3)); spot.style.setProperty('--py', (py - 0.5).toFixed(3))
      }
    }
    addEventListener('pointermove', mover)
    return () => { io.disconnect(); mo.disconnect(); removeEventListener('pointermove', mover) }
  }, [])
}

// Barra de progreso de lectura y botón para volver arriba.
export function Scroll() {
  const barra = useRef(null)
  const [arriba, setArriba] = useState(false)
  useEffect(() => {
    const f = () => {
      const max = document.documentElement.scrollHeight - innerHeight
      barra.current.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`
      setArriba(scrollY > 700)
    }
    f(); addEventListener('scroll', f, { passive: true }); addEventListener('resize', f)
    return () => { removeEventListener('scroll', f); removeEventListener('resize', f) }
  }, [])
  return (
    <>
      <div ref={barra} className="scroll-bar" aria-hidden="true" />
      <button className={'to-top' + (arriba ? ' show' : '')} onClick={() => scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Volver arriba" tabIndex={arriba ? 0 : -1}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5m-6 6 6-6 6 6" /></svg>
      </button>
    </>
  )
}

// Figuras flotantes del fondo (cápsulas, cruces, pastillas). `d` = profundidad para el parallax.
const FIGURAS = [
  { t: 'capsula', x: 4, y: 14, s: 56, r: -30, d: 1.2 },
  { t: 'cruz', x: 44, y: 8, s: 26, r: 12, d: 0.6 },
  { t: 'pastilla', x: 12, y: 78, s: 34, r: 0, d: 0.9 },
  { t: 'circulo', x: 36, y: 88, s: 14, r: 0, d: 1.6 },
  { t: 'capsula', x: 52, y: 70, s: 40, r: 40, d: 0.7 },
  { t: 'cruz', x: 93, y: 82, s: 34, r: -8, d: 1.3 },
  { t: 'pastilla', x: 88, y: 10, s: 28, r: 0, d: 1 },
  { t: 'circulo', x: 70, y: 4, s: 10, r: 0, d: 1.8 },
  { t: 'capsula', x: 30, y: 40, s: 22, r: 70, d: 1.5 },
]
function Figura({ t, s }) {
  if (t === 'capsula') return <svg width={s} height={s / 2.2} viewBox="0 0 44 20"><rect x="1" y="1" width="42" height="18" rx="9" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.35)" strokeWidth="1.5" /><path d="M22 1v18" stroke="rgba(255,255,255,.35)" strokeWidth="1.5" /><rect x="22" y="1" width="21" height="18" rx="9" fill="rgba(110,231,183,.25)" /></svg>
  if (t === 'cruz') return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M9 2h6v7h7v6h-7v7H9v-7H2V9h7z" fill="rgba(255,255,255,.12)" stroke="rgba(255,255,255,.3)" strokeWidth="1" /></svg>
  if (t === 'pastilla') return <svg width={s} height={s} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10.5" fill="rgba(255,255,255,.07)" stroke="rgba(255,255,255,.3)" strokeWidth="1.2" /><path d="M5 12h14" stroke="rgba(255,255,255,.3)" strokeWidth="1.2" /></svg>
  return <svg width={s} height={s} viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="rgba(110,231,183,.45)" /></svg>
}
export function FondoFiguras() {
  return (
    <div className="figuras" aria-hidden="true">
      {FIGURAS.map((f, i) => (
        <span key={i} className="fig" style={{ left: f.x + '%', top: f.y + '%', '--d': f.d, '--r': f.r + 'deg', animationDelay: `${-i * 1.7}s`, animationDuration: `${9 + (i % 4) * 2}s` }}>
          <Figura {...f} />
        </span>
      ))}
    </div>
  )
}
