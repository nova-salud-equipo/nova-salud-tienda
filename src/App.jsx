import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { api, money } from './api.js'
import { useCarrito } from './carrito.jsx'
import * as Ic from './iconos.jsx'
import { Cursor, FondoFiguras, Scroll, useEfectos } from './efectos.jsx'

const menosMovimiento = () => matchMedia('(prefers-reduced-motion: reduce)').matches

// Navegación simple con #: funciona en cualquier hosting estático.
// '/catalogo', '/como' y '/seguir' son secciones de la portada: llevan a la portada y hacen scroll hasta ellas.
const SECCIONES = { '/catalogo': 'catalogo', '/como': 'como', '/seguir': 'seguir' }
function useRuta() {
  const [h, setH] = useState(location.hash.slice(1) || '/')
  useEffect(() => {
    const f = () => { const r = location.hash.slice(1) || '/'; setH(r); if (!SECCIONES[r]) window.scrollTo(0, 0) }
    addEventListener('hashchange', f)
    return () => removeEventListener('hashchange', f)
  }, [])
  return h
}
const ir = (r) => { location.hash = r }
const irA = (id) => document.getElementById(id)?.scrollIntoView({ behavior: menosMovimiento() ? 'auto' : 'smooth', block: 'start' })

function Ancla({ to, children, ...p }) {
  return <a href={'#' + to} onClick={(e) => { if (location.hash === '#' + to) { e.preventDefault(); irA(SECCIONES[to]) } }} {...p}>{children}</a>
}

// La cruz de la botica: la forma que se repite en todo el sitio.
const CRUZ = 'M1 0h1v1h1v1H2v1H1V2H0V1h1z'
const Cruz = (p) => <svg viewBox="0 0 3 3" aria-hidden="true" {...p}><path d={CRUZ} /></svg>
// La misma cruz armada con cinco bloques (intro y pie).
const CruzBloques = ({ gap = 0, ...p }) => (
  <svg viewBox="0 0 3 3" aria-hidden="true" {...p}>
    {[[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]].map(([x, y], i) => (
      <rect key={i} className={'b b' + i} x={x + gap / 2} y={y + gap / 2} width={1 - gap + (gap ? 0 : 0.01)} height={1 - gap + (gap ? 0 : 0.01)} />
    ))}
  </svg>
)

// Entradas al hacer scroll: cada [data-r] aparece una sola vez al entrar en pantalla.
function useReveal(ref, activo = true, deps = []) {
  useEffect(() => {
    const root = ref.current
    if (!root || !activo) return
    const els = root.querySelectorAll('[data-r]:not(.in)')
    if (!document.documentElement.classList.contains('js') || !('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return }
    const io = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target) } }), { rootMargin: '0px 0px -8% 0px' })
    els.forEach((e) => io.observe(e))
    // Respaldo: con un scroll muy rápido el observador puede saltarse elementos; si ya pasaron por la pantalla, se revelan igual.
    let raf = 0
    const revisar = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => els.forEach((e) => { if (!e.classList.contains('in') && e.getBoundingClientRect().top < innerHeight * 0.92) { e.classList.add('in'); io.unobserve(e) } })) }
    addEventListener('scroll', revisar, { passive: true })
    return () => { io.disconnect(); removeEventListener('scroll', revisar); cancelAnimationFrame(raf) }
  }, [activo, ...deps])
}

// Título que sube palabra por palabra.
const Palabras = ({ texto, desde = 0 }) => texto.split(' ').map((w, i, arr) => (
  <span key={i}><span className="w"><span style={{ '--i': desde + i }}>{w}</span></span>{i < arr.length - 1 ? ' ' : ''}</span>
))

// Al agregar, una cruz vuela desde el botón hasta el carrito.
function volarAlCarrito(desde) {
  const destino = document.querySelector('.cart-btn')
  if (!destino) return
  const latido = () => destino.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: 320, easing: 'cubic-bezier(.23,1,.32,1)' })
  if (!desde || menosMovimiento()) return latido()
  const a = desde.getBoundingClientRect(), b = destino.getBoundingClientRect()
  const el = document.createElement('div')
  el.className = 'vuela'
  el.innerHTML = `<svg viewBox="0 0 3 3"><path d="${CRUZ}"/></svg>`
  el.style.left = a.left + a.width / 2 - 11 + 'px'
  el.style.top = a.top + a.height / 2 - 11 + 'px'
  document.body.appendChild(el)
  const dx = b.left + b.width / 2 - (a.left + a.width / 2)
  const dy = b.top + b.height / 2 - (a.top + a.height / 2)
  el.animate([
    { transform: 'translate(0,0) scale(.6) rotate(0deg)', opacity: 0 },
    { transform: `translate(${dx * 0.35}px, ${dy * 0.35 - 70}px) scale(1.25) rotate(90deg)`, opacity: 1, offset: 0.4 },
    { transform: `translate(${dx}px, ${dy}px) scale(.45) rotate(180deg)`, opacity: 0.4 },
  ], { duration: 720, easing: 'cubic-bezier(.45,0,.2,1)' }).onfinish = () => { el.remove(); latido() }
}

function introPendiente() {
  return !menosMovimiento()
}

export default function App() {
  const ruta = useRuta()
  const { unidades } = useCarrito()
  const esPortada = ruta === '/' || !!SECCIONES[ruta]
  const [intro, setIntro] = useState(() => (esPortada && introPendiente() ? 'on' : 'off'))
  const [arriba, setArriba] = useState(true)
  useEffect(() => {
    const f = () => setArriba(scrollY < 12)
    f(); addEventListener('scroll', f, { passive: true })
    return () => removeEventListener('scroll', f)
  }, [])

  let pagina
  if (ruta.startsWith('/carrito')) pagina = <Carrito />
  else if (ruta.startsWith('/pedido/')) { const [cod, qs] = ruta.slice(8).split('?'); pagina = <Seguimiento key={cod} codigo={decodeURIComponent(cod)} celularInicial={new URLSearchParams(qs).get('c') || ''} recien={new URLSearchParams(qs).get('nuevo') === '1'} /> }
  else if (ruta.startsWith('/seguimiento')) pagina = <Seguimiento />
  else pagina = <Portada seccion={SECCIONES[ruta]} listo={intro !== 'on'} />

  return (
    <>
      {intro !== 'off' && <Intro onVuelo={() => setIntro('vuelo')} onFin={() => setIntro('off')} />}
      <a className="skip" href="#contenido" onClick={(e) => { e.preventDefault(); document.getElementById('contenido')?.focus() }}>Saltar al contenido</a>
      <header className={'top' + (arriba ? '' : ' scrolled')}>
        <div className="wrap top-in">
          <a href="#/" className="brand" data-logo-destino aria-label="Nova Salud, ir al inicio"><Cruz className="brand-mark" /><span><b translate="no">Nova Salud</b><small>Botica en línea</small></span></a>
          <nav className="top-nav" aria-label="Principal">
            <Ancla to="/catalogo" className="nav-l">Catálogo</Ancla>
            <Ancla to="/como" className="nav-l hide-s">Cómo funciona</Ancla>
            <a href="#/seguimiento" className={'nav-l nav-ico hide-s' + (ruta.startsWith('/seguimiento') || ruta.startsWith('/pedido') ? ' on' : '')}><Ico n="caja" />Seguir mi pedido</a>
            <a href="#/carrito" className={'cart-btn' + (ruta.startsWith('/carrito') ? ' on' : '')} aria-label={`Carrito, ${unidades} productos`}>
              <svg className="cart-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2.2l2.3 11.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L21 8H6.2" /><circle cx="9.5" cy="20" r="1.3" /><circle cx="17" cy="20" r="1.3" /></svg>
              <span className="hide-xs">Carrito</span>
              <span key={unidades} className={'pill' + (unidades ? ' on' : '')}>{unidades}</span>
            </a>
          </nav>
        </div>
      </header>
      <main id="contenido" tabIndex={-1}>{pagina}</main>
      <Pie ruta={ruta} />
    </>
  )
}

/* ---------- Presentación de entrada ---------- */
// El logo aparece grande al centro, una línea de pulso cruza la pantalla, el nombre se revela con un brillo
// y luego el logo vuela hasta su lugar en la cabecera mientras el fondo se desvanece.
function Intro({ onVuelo, onFin }) {
  const [geo, setGeo] = useState(null)
  const [fase, setFase] = useState('entrada')
  const cb = useRef({ onVuelo, onFin })
  useLayoutEffect(() => {
    document.documentElement.classList.add('intro-activa')
    let vivo = true
    const medir = () => {
      const d = document.querySelector('[data-logo-destino]')
      if (!d) return null
      const r = d.getBoundingClientRect()
      const vw = document.documentElement.clientWidth, vh = innerHeight
      const escala = Math.min(2.8, (vw * 0.8) / r.width)
      const cx = vw / 2, cy = vh * 0.44
      return { r, escala, vw, vh, cx, cy, dx: cx - (r.left + r.width / 2), dy: cy - (r.top + r.height / 2), yPulso: cy + (r.height * escala) / 2 + Math.min(70, vh * 0.08) }
    }
    Promise.race([document.fonts.ready, new Promise((ok) => setTimeout(ok, 700))]).then(() => { if (vivo) { const g = medir(); g ? setGeo(g) : cb.current.onFin() } })
    return () => { vivo = false; document.documentElement.classList.remove('intro-activa') }
  }, [])
  useEffect(() => {
    if (!geo) return
    const ts = []
    if (fase === 'entrada') ts.push(setTimeout(() => setFase('vuelo'), 2400))
    if (fase === 'vuelo') { cb.current.onVuelo(); ts.push(setTimeout(() => setFase('listo'), 800)) }
    if (fase === 'listo') {
      document.documentElement.classList.remove('intro-activa')
      document.querySelector('[data-logo-destino] .brand-mark')?.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.35) rotate(90deg)' }, { transform: 'scale(1) rotate(90deg)' }], { duration: 650, easing: 'cubic-bezier(.23,1,.32,1)' })
      ts.push(setTimeout(() => cb.current.onFin(), 300))
    }
    return () => ts.forEach(clearTimeout)
  }, [geo, fase])
  useEffect(() => {
    if (fase !== 'entrada' || !geo) return
    const saltar = () => setFase('vuelo')
    addEventListener('pointerdown', saltar); addEventListener('keydown', saltar)
    return () => { removeEventListener('pointerdown', saltar); removeEventListener('keydown', saltar) }
  }, [fase, geo])

  if (!geo) return <div className="intro" aria-hidden="true"><div className="intro-fondo" /></div>
  const { r, escala, vw, vh, cx, dx, dy, yPulso } = geo
  const a = Math.max(24, cx - 60)
  const pulso = `M -10 ${yPulso} H ${a} l 12 -10 l 10 20 l 14 -62 l 16 94 l 12 -52 l 10 10 H ${vw + 10}`
  return (
    <div className={'intro ' + fase} aria-hidden="true">
      <div className="intro-fondo" />
      <svg className="pulso" width={vw} height={vh} viewBox={`0 0 ${vw} ${vh}`}><path d={pulso} pathLength="1" /></svg>
      <span className="intro-skip">Toca para entrar</span>
      {fase !== 'listo' && (
        <div className="intro-logo brand" style={{ left: r.left, top: r.top, height: r.height, transform: fase === 'entrada' ? `translate(${dx}px, ${dy}px) scale(${escala})` : 'none' }}>
          <CruzBloques className="brand-mark" />
          <span className="intro-txt"><b translate="no">Nova Salud<i className="brillo">Nova Salud</i></b><small>Botica en línea</small></span>
        </div>
      )}
    </div>
  )
}

/* ---------- Portada ---------- */
const ORDEN = { rel: 'Recomendados', asc: 'Menor precio', desc: 'Mayor precio', az: 'De la A a la Z' }

function Portada({ seccion, listo }) {
  const ref = useRef(null)
  const cruzRef = useRef(null)
  const { agregar, cambiar, items, sincronizar } = useCarrito()
  const [prods, setProds] = useState(null)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('Todas')
  const [orden, setOrden] = useState('rel')
  const [aviso, setAviso] = useState({ txt: '', n: 0 })
  const cargar = () => { setError(''); return api('/catalogo/productos').then((d) => { setProds(d); sincronizar(d) }).catch((e) => setError(e.message)) }
  useEffect(() => { cargar() }, [])
  useEffect(() => { if (!aviso.txt) return; const t = setTimeout(() => setAviso((a) => ({ ...a, txt: '' })), 2800); return () => clearTimeout(t) }, [aviso.n])
  useEffect(() => { if (seccion && listo) requestAnimationFrame(() => irA(seccion)) }, [seccion, listo])
  useReveal(ref, listo, [!!prods])

  // La cruz grande del inicio gira y baja despacio con el scroll.
  useEffect(() => {
    const el = cruzRef.current
    if (!el || menosMovimiento()) return
    let raf = 0
    const f = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { const y = Math.min(scrollY, 1200); el.style.transform = `translate3d(0, ${y * 0.16}px, 0) rotate(${y * 0.015}deg)` }) }
    addEventListener('scroll', f, { passive: true })
    return () => { removeEventListener('scroll', f); cancelAnimationFrame(raf) }
  }, [])

  const cats = useMemo(() => ['Todas', ...new Set((prods || []).map((p) => p.categoria))], [prods])
  const conteo = useMemo(() => (prods || []).reduce((m, p) => ({ ...m, [p.categoria]: (m[p.categoria] || 0) + 1 }), {}), [prods])
  const t = q.trim().toLowerCase()
  const lista = useMemo(() => {
    const l = (prods || []).filter((p) => (cat === 'Todas' || p.categoria === cat) && (!t || p.nombre.toLowerCase().includes(t)))
    if (orden === 'asc') return [...l].sort((a, b) => a.precioFinal - b.precioFinal)
    if (orden === 'desc') return [...l].sort((a, b) => b.precioFinal - a.precioFinal)
    if (orden === 'az') return [...l].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    return l
  }, [prods, t, cat, orden])
  const promos = (prods || []).filter((p) => p.enPromocion && !p.agotado)
  const sugeridos = t && prods ? prods.filter((p) => p.nombre.toLowerCase().includes(t)).slice(0, 3) : []
  const sumar = (p, e) => { agregar(p); volarAlCarrito(e?.currentTarget); setAviso((a) => ({ txt: `${p.nombre} agregado`, n: a.n + 1 })) }
  const enCarrito = (id) => items.find((i) => i.id === id)?.cant || 0
  const limpiar = () => { setQ(''); setCat('Todas') }

  return (
    <div ref={ref}>
      {/* Inicio */}
      <section className="hero" aria-labelledby="hero-t">
        <div className="hero-cross" aria-hidden="true" data-r>
          <div className="hero-cross-in" ref={cruzRef}>
            <img src="/img/pills.jpg" alt="" width="1600" height="1067" fetchpriority="high" />
          </div>
        </div>
        <div className="wrap hero-in">
          <h1 id="hero-t" className="words" data-r="words"><Palabras texto="Tu botica, sin hacer cola" /></h1>
          <p className="lead" data-r style={{ '--i': 3 }}>Pide tus medicamentos en línea y recógelos en tienda en 30 minutos, o recíbelos hoy en casa. Mismo precio que en mostrador.</p>
          <form className="hero-search" data-r style={{ '--i': 4 }} role="search" onSubmit={(e) => { e.preventDefault(); setCat('Todas'); irA('catalogo') }}>
            <label htmlFor="buscar-hero" className="sr">Buscar producto</label>
            <svg className="lupa" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></svg>
            <input id="buscar-hero" name="q" type="search" placeholder="¿Qué buscas? Ej. paracetamol…" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
            <button className="btn">Buscar</button>
          </form>
          {t && prods && (
            <div className="sugeridos" aria-live="polite">
              {sugeridos.length === 0 ? <p className="soft">No tenemos “{q.trim()}”. Prueba con otro nombre.</p> : sugeridos.map((p) => (
                <div key={p.id} className="sug">
                  <FotoProducto p={p} chica />
                  <span><b>{p.nombre}</b><small>{p.presentacion}</small></span>
                  <span className="num">{money(p.precioFinal)}</span>
                  <BotonAgregar p={p} cant={enCarrito(p.id)} onAdd={sumar} chico />
                </div>
              ))}
            </div>
          )}
          <ul className="hero-facts" data-r style={{ '--i': 5 }}>
            <li><Cruz className="bullet" />Recojo en 30 min</li>
            <li><Cruz className="bullet" />Delivery hoy en Lima</li>
            <li><Cruz className="bullet" />Yape, tarjeta o contra entrega</li>
          </ul>
        </div>
      </section>

      {/* Por qué Nova Salud: razones + boleta de ejemplo que se imprime */}
      <section className="porque wrap" aria-labelledby="pq-t">
        <div className="pq-text">
          <h2 id="pq-t" data-r="mask">La botica de siempre, ahora en línea</h2>
          <ul className="pq-list">
            <li data-r style={{ '--i': 1 }}><Cruz className="pq-cross" /><div><b>Mismo precio que en mostrador</b><p>No pagas nada extra por comprar en línea. Precios con IGV incluido.</p></div></li>
            <li data-r style={{ '--i': 2 }}><Cruz className="pq-cross" /><div><b>Solo lo que hay en el estante</b><p>Sin lotes vencidos ni unidades apartadas para otro cliente.</p></div></li>
            <li data-r style={{ '--i': 3 }}><Cruz className="pq-cross" /><div><b>Listo en 30 minutos</b><p>Recoges en Av. Principal 123 o te lo llevamos hoy por S/ 5.00.</p></div></li>
            <li data-r style={{ '--i': 4 }}><Cruz className="pq-cross" /><div><b>Paga como prefieras</b><p>Yape o Plin, tarjeta, o en efectivo al recibir.</p></div></li>
          </ul>
        </div>
        <Boleta />
      </section>

      {/* Cómo funciona: tres pasos que crecen, cada uno con su pantalla */}
      <section className="como wrap" id="como" aria-labelledby="como-t">
        <h2 id="como-t" data-r="mask">Cómo funciona</h2>
        <ol className="tiles">
          <li data-r style={{ '--i': 1 }}>
            <div className="tile t1" data-ui aria-hidden="true">
              <div className="ui-search"><svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></svg><span className="typed">paracet</span><i className="caret" /></div>
              <div className="ui-row"><span><b>Paracetamol 500 mg</b><small>Caja x 20 tabletas</small></span><b>S/ 6.50</b><span className="ui-add"><Cruz /></span></div>
            </div>
            <h3>Eliges</h3>
            <p>Busca por nombre o categoría y arma tu carrito. Se guarda en tu navegador.</p>
          </li>
          <li data-r style={{ '--i': 2 }}>
            <div className="tile t2" data-ui aria-hidden="true">
              <div className="ui-card">
                <div className="ui-top"><b>Pedido NS-1024</b><span className="ui-tag">Preparando</span></div>
                <ul className="ui-checks">
                  <li><i /><span>2 × Paracetamol 500 mg</span></li>
                  <li><i /><span>1 × Ibuprofeno 400 mg</span></li>
                  <li><i /><span>2 × Suero oral</span></li>
                </ul>
              </div>
            </div>
            <h3>Preparamos</h3>
            <p>La botica recibe tu pedido al instante y separa cada producto.</p>
          </li>
          <li data-r style={{ '--i': 3 }}>
            <div className="tile t3" data-ui aria-hidden="true">
              <div className="ui-ready">
                <span className="ready-cross"><Cruz /></span>
                <b>Listo para recoger</b>
                <span className="ready-code">NS-1024</span>
                <small>Av. Principal 123 · hasta las 21:00</small>
              </div>
            </div>
            <h3>Recoges o te llega</h3>
            <p>En tienda en 30 minutos y gratis, o delivery hoy mismo por S/ 5.00.</p>
          </li>
        </ol>
      </section>

      {promos.length > 0 && (
        <section className="ofertas" aria-labelledby="of-t">
          <div className="wrap of-in">
            <div data-r><h2 id="of-t">Ofertas de la semana</h2><p>20% menos en estos productos, hasta agotar stock.</p></div>
            <ul className="of-list">
              {promos.map((p, i) => (
                <li key={p.id} data-r style={{ '--i': i + 1 }}>
                  <span><b>{p.nombre}</b><small>{p.presentacion}</small></span>
                  <span className="num"><s>{money(p.precio)}</s> {money(p.precioFinal)}</span>
                  <BotonAgregar p={p} cant={enCarrito(p.id)} onAdd={sumar} chico claro />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Catálogo */}
      <section className="catalogo" id="catalogo" aria-labelledby="cat-t">
        <div className="cat-band">
          <div className="cinta" aria-hidden="true">
            <div className="cinta-in">
              {[0, 1].map((k) => <span key={k}>{['Recojo en 30 minutos', 'Delivery hoy en Lima', 'Mismo precio que en mostrador', 'Yape, Plin, tarjeta o efectivo', 'Stock real, sin lotes vencidos'].map((t) => <span key={t}><Cruz />{t}</span>)}</span>)}
            </div>
          </div>
          <div className="wrap">
            <div className="cat-head">
              <h2 id="cat-t" className="words" data-r="words"><Palabras texto="Nuestro catálogo" /></h2>
              <p data-r style={{ '--i': 2 }}>{prods ? `${prods.length} productos con stock real, listos para recoger hoy.` : 'Cargando productos…'}</p>
            </div>
            <div className="ctiles" role="group" aria-label="Categorías" data-r>
              {(prods ? cats : ['Todas', '', '', '', '', '']).map((c, i) => (
                c ? <button key={c} type="button" className={'ctile' + (cat === c ? ' on' : '')} aria-pressed={cat === c} onClick={() => setCat(c)} style={{ '--k': i }}>
                      <span className="ctile-ico"><IconoCat cat={c} /></span>
                      <span className="ctile-n">{c}</span>
                      <small className="num">{c === 'Todas' ? prods?.length : conteo[c]} {(c === 'Todas' ? prods?.length : conteo[c]) === 1 ? 'producto' : 'productos'}</small>
                    </button>
                  : <span key={i} className="ctile sk" />
              ))}
            </div>
          </div>
        </div>
        <div className="wrap">
        <div className="toolbar">
          <div className="tb-search">
            <svg className="lupa" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></svg>
            <label htmlFor="buscar" className="sr">Buscar producto</label>
            <input id="buscar" name="q" type="search" className="search" placeholder="Buscar por nombre…" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
          </div>
          <p className="tb-estado" aria-live="polite">
            {prods && <><b>{cat === 'Todas' ? 'Todos los productos' : cat}</b><span className="num"> · {lista.length} {lista.length === 1 ? 'resultado' : 'resultados'}</span></>}
            {(cat !== 'Todas' || t) && <button type="button" className="tb-limpiar" onClick={limpiar}>Quitar filtros <span aria-hidden="true">×</span></button>}
          </p>
          <label className="orden"><span className="sr">Ordenar</span>
            <select name="orden" value={orden} onChange={(e) => setOrden(e.target.value)}>
              {Object.entries(ORDEN).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
        </div>

        {error && (
          <div className="estado">
            <Cruz className="estado-cross" />
            <div>
              <h3>No pudimos cargar el catálogo</h3>
              <p>{error}</p>
              <button className="btn" onClick={cargar}>Reintentar</button>
            </div>
          </div>
        )}
        {!prods && !error && (
          <div className="grid" aria-busy="true" aria-label="Cargando catálogo">
            {[...Array(8)].map((_, i) => <div key={i} className="card sk"><div className="card-media" /><span /><span /><span /></div>)}
          </div>
        )}
        {prods && lista.length === 0 && (
          <div className="estado">
            <Cruz className="estado-cross" />
            <div>
              <h3>{t ? `No encontramos “${q.trim()}”` : 'No hay productos en esta categoría'}</h3>
              <p>Prueba con otro nombre o revisa todas las categorías.</p>
              <button className="btn sec" onClick={limpiar}>Ver todo el catálogo</button>
            </div>
          </div>
        )}
        {prods && lista.length > 0 && (
          <div className="grid" key={cat + t + orden}>
            {lista.map((p, i) => {
              const cant = enCarrito(p.id)
              return (
                <article key={p.id} className={'card' + (p.agotado ? ' off' : '') + (cant ? ' en' : '')} style={{ '--k': Math.min(i, 12) }}>
                  <div className="card-media">
                    <FotoProducto p={p} />
                    <div className="badges">
                      {p.enPromocion && <span className="badge oferta">−20%</span>}
                      {p.requiereReceta && <span className="badge receta">Con receta</span>}
                      {!p.agotado && p.disponible <= 5 && <span className="badge ultimas">Últimas {p.disponible}</span>}
                      {p.agotado && <span className="badge agotado">Agotado</span>}
                    </div>
                  </div>
                  <div className="card-body">
                    <span className="card-cat">{p.categoria}</span>
                    <h3>{p.nombre}</h3>
                    <p className="soft">{p.presentacion}</p>
                    {p.requiereReceta && <p className="card-nota">Solo recojo en tienda, con tu receta.</p>}
                  </div>
                  <div className="card-foot">
                    <span className="price num">{p.enPromocion && <s>{money(p.precio)}</s>}<b>{money(p.precioFinal)}</b></span>
                    {!p.agotado && (cant
                      ? <div className="stepper" role="group" aria-label={`Cantidad de ${p.nombre}`}>
                          <button type="button" onClick={() => cambiar(p.id, cant - 1)} aria-label={(cant === 1 ? 'Quitar ' : 'Quitar uno de ') + p.nombre}>−</button>
                          <span className="num" aria-live="polite">{cant}</span>
                          <button type="button" onClick={(e) => sumar(p, e)} disabled={cant >= p.disponible} aria-label={'Agregar uno de ' + p.nombre}>+</button>
                        </div>
                      : <BotonAgregar p={p} cant={0} onAdd={sumar} />)}
                  </div>
                </article>
              )
            })}
          </div>
        )}
        </div>
      </section>

      {/* Seguir pedido */}
      <section className="seguir wrap" id="seguir" aria-labelledby="seg-t">
        <CuponSeguir />
      </section>

      <div className={'toast' + (aviso.txt ? ' show' : '')} role="status" aria-live="polite">
        {aviso.txt && <><Cruz className="toast-cross" /><span>{aviso.txt}</span><a href="#/carrito">Ver carrito</a></>}
      </div>
    </div>
  )
}

// Boleta de ejemplo: se "imprime" al entrar en pantalla.
function Boleta() {
  const lineas = [['2', 'Paracetamol 500 mg', '13.00'], ['1', 'Ibuprofeno 400 mg', '8.90'], ['2', 'Suero oral', '7.00']]
  return (
    <figure className="boleta-wrap" data-r>
      <div className="impresora" aria-hidden="true" />
      <div className="boleta" data-ui role="img" aria-label="Ejemplo de boleta: pedido NS-1024, total S/ 28.90, listo para recoger">
        <div className="bl-head"><Cruz className="bl-cross" /><div><b translate="no">Nova Salud</b><small>Av. Principal 123, Lima</small></div></div>
        <div className="bl-meta"><span>Pedido NS-1024</span><span>Recojo en tienda</span></div>
        <ul className="bl-lines num">
          {lineas.map(([c, n, s], i) => <li key={n} style={{ '--i': i }}><span>{c} ×</span><span>{n}</span><span>S/ {s}</span></li>)}
        </ul>
        <div className="bl-total num"><span>Total</span><b>S/ 28.90</b></div>
        <div className="bl-foot">Precios con IGV · Pago con Yape</div>
        <div className="sello"><Cruz /><span>Listo para recoger</span></div>
      </div>
      <figcaption className="soft">Así se ve un pedido de ejemplo.</figcaption>
    </figure>
  )
}

// Foto del producto. Si todavía no hay foto, se dibuja su envase (caja, frasco, tubo o sobre).
const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const fotoDe = (p) => p.imagen || `/productos/${slug(p.nombre)}.jpg`
function FotoProducto({ p, chica }) {
  const [st, setSt] = useState('cargando')
  return (
    <div className={'foto' + (chica ? ' chica' : '') + (st === 'ok' ? ' ok' : '')}>
      <Envase presentacion={p.presentacion || ''} />
      {st !== 'error' && <img src={fotoDe(p)} alt={chica ? '' : p.nombre} width="600" height="600" loading="lazy" decoding="async" onLoad={() => setSt('ok')} onError={() => setSt('error')} />}
    </div>
  )
}
function Envase({ presentacion }) {
  const t = presentacion.toLowerCase()
  const tipo = /frasco|jarabe/.test(t) ? 'frasco' : /tubo|gel|crema/.test(t) ? 'tubo' : /sobre/.test(t) ? 'sobre' : 'caja'
  return (
    <svg className={'envase ' + tipo} viewBox="0 0 64 64" aria-hidden="true">
      {tipo === 'caja' && <><path d="M12 22 32 13l20 9v22l-20 9-20-9Z" /><path d="m12 22 20 9 20-9M32 31v22" /><path className="env-cruz" d="M18.5 35.5h4v-4h3v4h4v3h-4v4h-3v-4h-4z" /></>}
      {tipo === 'frasco' && <><path d="M26 8h12v7H26z" /><path d="M24 15h16v3c5 2 7 6 7 11v21a5 5 0 0 1-5 5H22a5 5 0 0 1-5-5V29c0-5 2-9 7-11Z" /><path className="env-cruz" d="M29.5 33h5v5h5v5h-5v5h-5v-5h-5v-5h5z" /></>}
      {tipo === 'tubo' && <><path d="M18 10h28l-4 36H22Z" /><path d="M27 46h10v8H27z" /><path d="M18 18h28" /><path className="env-cruz" d="M30 26h4v4h4v4h-4v4h-4v-4h-4v-4h4z" /></>}
      {tipo === 'sobre' && <><path d="M14 12h36v40H14z" /><path d="M14 19h36M14 45h36" /><path className="env-cruz" d="M30 26h4v4h4v4h-4v4h-4v-4h-4v-4h4z" /></>}
    </svg>
  )
}

function BotonAgregar({ p, cant, onAdd, chico, claro }) {
  const lleno = cant >= p.disponible
  return (
    <button type="button" className={'btn add' + (chico ? ' chico' : '') + (claro ? ' claro' : '')} disabled={lleno} onClick={(e) => onAdd(p, e)} aria-label={lleno ? `${p.nombre}: máximo disponible en tu carrito` : `Agregar ${p.nombre} al carrito`}>
      {lleno ? 'Máximo' : cant ? <>Agregar <span className="add-n">{cant}</span></> : <><Cruz className="add-cross" />Agregar</>}
    </button>
  )
}

const formatoCel = (v) => v.replace(/\D/g, '').slice(0, 9).replace(/(\d{3})(\d{1,3})?(\d{1,3})?/, (_, a, b, c) => [a, b, c].filter(Boolean).join(' '))
const normalizarCodigo = (v) => { const s = v.trim().toUpperCase(); return /^\d+$/.test(s) ? 'NS-' + s : s }

function CuponSeguir({ titulo = 'h2', codigo, celular, error }) {
  const H = titulo
  return (
    <div className="cupon" data-r>
      <div className="cupon-a">
        <Cruz className="cupon-bg" />
        <H id="seg-t">{titulo === 'h1' ? 'Seguir mi pedido' : '¿Ya hiciste tu pedido?'}</H>
        <p>Escribe tu código y el celular con el que compraste. La página se actualiza sola.</p>
        <ol className="mini" aria-hidden="true">
          <li><Cruz /><span>Recibido</span></li>
          <li><Cruz /><span>Listo</span></li>
          <li><Cruz /><span>Entregado</span></li>
          <i className="mini-bar" />
        </ol>
      </div>
      <FormSeguir codigo0={codigo} celular0={celular} errorApi={error} />
    </div>
  )
}

function FormSeguir({ codigo0 = '', celular0 = '', errorApi = '' }) {
  const [codigo, setCodigo] = useState(codigo0)
  const [celular, setCelular] = useState(formatoCel(celular0))
  const [err, setErr] = useState({})
  const enviar = (e) => {
    e.preventDefault()
    const cod = normalizarCodigo(codigo), cel = celular.replace(/\D/g, '')
    const er = { codigo: !/^NS-\d+$/.test(cod) ? 'Escribe el código como aparece en tu pedido, por ejemplo NS-1001.' : '', celular: !/^9\d{8}$/.test(cel) ? 'Ingresa el celular de 9 dígitos con el que compraste.' : '' }
    setErr(er)
    if (er.codigo || er.celular) return
    ir(`/pedido/${encodeURIComponent(cod)}?c=${cel}`)
  }
  return (
    <form className="cupon-b" onSubmit={enviar} noValidate>
      {errorApi && <div className="alert" role="alert">{errorApi}</div>}
      <label className="field"><span>Código del pedido</span>
        <input name="codigo" value={codigo} onChange={(e) => { setCodigo(e.target.value); setErr({ ...err, codigo: '' }) }} placeholder="NS-1001" autoComplete="off" spellCheck={false} autoCapitalize="characters" aria-invalid={!!err.codigo} />
        {err.codigo && <em className="err">{err.codigo}</em>}
      </label>
      <label className="field"><span>Celular con el que compraste</span>
        <input name="celular" type="tel" inputMode="numeric" value={celular} onChange={(e) => { setCelular(formatoCel(e.target.value)); setErr({ ...err, celular: '' }) }} placeholder="987 654 321" autoComplete="tel" aria-invalid={!!err.celular} />
        {err.celular && <em className="err">{err.celular}</em>}
      </label>
      <button className="btn full ver"><span>Ver mi pedido</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" /></svg></button>
    </form>
  )
}

// Íconos de línea (categorías, entrega, pago y acciones)
const ICOS = {
  todas: <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />,
  analgesicos: <><circle cx="12" cy="12" r="8" /><path d="m6.5 17.5 11-11" /></>,
  antialergicos: <path d="M12 3 19 6v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6zM12 9v6M9 12h6" />,
  antibioticos: <path d="M4.9 19.1a3.5 3.5 0 0 1 0-5L14.1 4.9a3.5 3.5 0 0 1 5 5L9.9 19.1a3.5 3.5 0 0 1-5 0zM9.5 9.5l5 5" />,
  cuidado: <path d="M9 9h6v11a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1zM11 9V6h2v3M13 6h3M12 13v4M10 15h4" />,
  gastro: <path d="M9 3v4c0 2-3 3-3 7a6 6 0 0 0 11 3c1-2 0-4-2-4s-3-2-3-4V3" />,
  hidratacion: <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11zM9.5 14.5a2.5 2.5 0 0 0 2.5 2.5" />,
  respiratorio: <path d="M12 4v8m0 0c-1 0-2 1-3 1m3-1c1 0 2 1 3 1M9 7C6 7 4 12 4 16c0 2 1 3 3 3s3-2 3-4V9c0-1-.5-2-1-2zm6 0c3 0 5 5 5 9 0 2-1 3-3 3s-3-2-3-4V9c0-1 .5-2 1-2z" />,
  vitaminas: <path d="M8 8h8v12H8zM10 4h4v4h-4zM11 12h.01M13.5 14.5h.01M11 17h.01" />,
  caja: <path d="M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8" />,
  tienda: <path d="M4 9l1.5-5h13L20 9M4 9h16M5 9v11h14V9M9.5 20v-6h5v6" />,
  moto: <><circle cx="6" cy="17" r="2.5" /><circle cx="18" cy="17" r="2.5" /><path d="M8.5 17h7M15 8h2l3.5 9M6 14.5 9 10h5l1 7M9 10V7h3" /></>,
  celular: <path d="M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 18h2" />,
  tarjeta: <path d="M3 6h18v12H3zM3 10h18M7 15h4" />,
  efectivo: <><path d="M3 7h18v10H3z" /><circle cx="12" cy="12" r="2.5" /><path d="M6 10v4M18 10v4" /></>,
  borrar: <path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13M10.5 11v5M13.5 11v5" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  reloj: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>,
  pin: <path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />,
}
const Ico = ({ n, ...p }) => <svg className="ico" viewBox="0 0 24 24" aria-hidden="true" {...p}>{ICOS[n]}</svg>
function IconoCat({ cat }) {
  const c = slug(cat)
  const n = c === 'todas' ? 'todas' : c.startsWith('analg') ? 'analgesicos' : c.startsWith('antial') ? 'antialergicos' : c.startsWith('antib') ? 'antibioticos'
    : c.startsWith('cuidado') ? 'cuidado' : c.startsWith('gastro') ? 'gastro' : c.startsWith('hidrat') ? 'hidratacion' : c.startsWith('respir') ? 'respiratorio' : c.startsWith('vitam') ? 'vitaminas' : 'caja'
  return <Ico n={n} />
}

// Barra de pasos de la compra
function Progreso({ paso }) {
  return (
    <ol className="progreso" aria-label="Pasos de la compra">
      {['Carrito', 'Tus datos', 'Pedido listo'].map((p, i) => (
        <li key={p} className={i < paso ? 'hecho' : i === paso ? 'ahora' : ''} aria-current={i === paso ? 'step' : undefined}>
          <span className="pg-m">{i < paso ? <Ico n="check" /> : <Cruz />}</span>{p}
        </li>
      ))}
    </ol>
  )
}

// Pequeña celebración: cruces que salen disparadas.
function Celebracion() {
  return (
    <div className="confeti" aria-hidden="true">
      {Array.from({ length: 18 }, (_, i) => {
        const ang = (i / 18) * Math.PI * 2, dist = 90 + (i % 3) * 45
        return <Cruz key={i} style={{ '--x': `${Math.cos(ang) * dist}px`, '--y': `${Math.sin(ang) * dist}px`, '--r': `${(i % 2 ? 1 : -1) * (90 + i * 20)}deg`, '--d': `${(i % 4) * 40}ms`, '--c': ['var(--live)', 'var(--mint)', '#fff', 'var(--teal)'][i % 4] }} />
      })}
    </div>
  )
}

/* ---------- Carrito y checkout ---------- */
const PAGOS = [
  { v: 'Yape / Plin', d: 'Se simula la confirmación del pago al instante.', i: 'celular' },
  { v: 'Tarjeta', d: 'Pago simulado: no ingreses datos reales de tarjeta.', i: 'tarjeta' },
  { v: 'Contra entrega', d: 'Pagas al recoger o al recibir tu pedido.', i: 'efectivo' },
]

function Progreso({ paso }) {
  const pasos = ['Carrito', 'Datos y pago', 'Confirmación']
  return (
    <ol className="progress" aria-label="Progreso de compra">
      {pasos.map((s, i) => (
        <li key={s} className={i < paso ? 'done' : i === paso ? 'on' : ''} aria-current={i === paso ? 'step' : undefined}>
          <span>{i < paso ? <Ic.Check size={14} /> : i + 1}</span>{s}
        </li>
      ))}
    </ol>
  )
}

function Carrito() {
  const { items, cambiar, vaciar, total, unidades, agregar } = useCarrito()
  const ref = useRef(null)
  const [f, setF] = useState({ nombre: '', celular: '', entrega: 'recojo', direccion: '', metodoPago: 'Yape / Plin', simularFallo: false })
  const [t, setT] = useState({})
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [sugeridos, setSugeridos] = useState([])
  useReveal(ref, true, [items.length > 0, sugeridos.length])
  useEffect(() => { if (!items.length) api('/catalogo/productos').then((d) => setSugeridos(d.filter((p) => !p.agotado).slice(0, 4))).catch(() => {}) }, [items.length === 0])
  const set = (k, v) => { setF({ ...f, [k]: v }); setError('') }
  const conReceta = items.some((i) => i.receta)
  const delivery = f.entrega === 'delivery' ? 5 : 0
  const err = {
    nombre: f.nombre.trim().length < 2 ? 'Escribe tu nombre.' : '',
    celular: !/^9\d{8}$/.test(f.celular.replace(/\D/g, '')) ? 'Ingresa un celular de 9 dígitos que empiece con 9.' : '',
    direccion: f.entrega === 'delivery' && f.direccion.trim().length < 5 ? 'Escribe tu dirección completa.' : '',
    entrega: conReceta && f.entrega === 'delivery' ? 'Tu carrito tiene productos con receta: solo se pueden recoger en tienda.' : '',
  }
  const ok = Object.values(err).every((e) => !e)

  if (!items.length) return (
    <div className="wrap page" ref={ref}>
      <div className="vacio" data-r>
        <div className="vacio-ilus" aria-hidden="true"><Ico n="caja" /><Cruz className="vacio-cruz" /></div>
        <div>
          <h1>Tu carrito está vacío</h1>
          <p>Agrega productos desde el catálogo para hacer tu pedido. Lo recoges en 30 minutos o te lo llevamos hoy.</p>
          <Ancla to="/catalogo" className="btn big">Ir al catálogo</Ancla>
        </div>
      </div>
      {sugeridos.length > 0 && (
        <section className="sugerencias" aria-labelledby="sug-t">
          <h2 id="sug-t" data-r="mask">Para empezar</h2>
          <div className="sug-grid">
            {sugeridos.map((p, i) => (
              <div key={p.id} className="sug-card" data-r style={{ '--i': i + 1 }}>
                <FotoProducto p={p} chica />
                <span><b>{p.nombre}</b><small>{p.presentacion}</small></span>
                <span className="num sug-p">{money(p.precioFinal)}</span>
                <button type="button" className="btn chico" onClick={(e) => { agregar(p); volarAlCarrito(e.currentTarget) }}><Cruz className="add-cross" />Agregar</button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )

  const pagar = async (e) => {
    e.preventDefault()
    setT({ nombre: true, celular: true, direccion: true, entrega: true })
    if (!ok) { requestAnimationFrame(() => document.querySelector('.panel [aria-invalid="true"], .panel .err')?.closest('.field')?.querySelector('input')?.focus()); return }
    setEnviando(true)
    try {
      const celular = f.celular.replace(/\D/g, '')
      const p = await api('/pedidos', { method: 'POST', body: { items: items.map((i) => ({ productoId: i.id, cantidad: i.cant })), cliente: { nombre: f.nombre.trim(), celular }, metodoPago: f.metodoPago, entrega: f.entrega, direccion: f.direccion.trim(), simularFallo: f.simularFallo } })
      vaciar()
      ir(`/pedido/${p.codigo}?c=${celular}&nuevo=1`)
    } catch (e2) { setError(e2.message) } finally { setEnviando(false) }
  }
  const inv = (k) => t[k] && err[k]

  return (
    <div className="wrap page" ref={ref}>
      <Progreso paso={1} />
      <div className="page-head" data-r>
        <h1 className="words" data-r="words"><Palabras texto="Tu carrito" /></h1>
        <span className="soft num">{unidades} {unidades === 1 ? 'producto' : 'productos'}</span>
      </div>
      <div className="checkout">
        <section className="lineas" aria-label="Productos en tu carrito">
          {items.map((i, k) => (
            <div key={i.id} className="line" data-r style={{ '--i': k }}>
              <FotoProducto p={i} chica />
              <div className="line-info">
                <b>{i.nombre}</b>
                <small>{i.presentacion} · {money(i.precio)} c/u</small>
                {i.receta && <small className="n-receta">Requiere receta · solo recojo</small>}
              </div>
              <div className="stepper">
                <button type="button" onClick={() => cambiar(i.id, i.cant - 1)} aria-label={(i.cant === 1 ? 'Quitar ' : 'Quitar uno de ') + i.nombre}>−</button>
                <span key={i.cant} className="num" aria-live="polite">{i.cant}</span>
                <button type="button" onClick={() => cambiar(i.id, i.cant + 1)} disabled={i.cant >= i.max} aria-label={'Agregar uno de ' + i.nombre}>+</button>
              </div>
              <b key={i.cant} className="r num line-sub">{money(i.cant * i.precio)}</b>
              <button type="button" className="quitar" onClick={() => cambiar(i.id, 0)} aria-label={'Quitar ' + i.nombre + ' del carrito'}><Ico n="borrar" /></button>
            </div>
          ))}
          {conReceta && <p className="nota">Algunos productos requieren receta médica. Preséntala al recoger tu pedido en la botica.</p>}
          <div className="ventajas" data-r>
            <span><Ico n="reloj" />Listo en 30 minutos</span>
            <span><Ico n="tienda" />Recojo gratis en Av. Principal 123</span>
            <span><Ico n="moto" />Delivery hoy por S/ 5.00</span>
          </div>
          <div className="lineas-foot">
            <Ancla to="/catalogo" className="link">← Seguir comprando</Ancla>
            <button type="button" className="link" onClick={vaciar}>Vaciar carrito</button>
          </div>
        </section>

        <form className="panel" onSubmit={pagar} noValidate data-r style={{ '--i': 2 }}>
          <h2>Tus datos</h2>
          <label className="field"><span>Nombre y apellido</span><input name="nombre" value={f.nombre} onChange={(e) => set('nombre', e.target.value)} onBlur={() => setT({ ...t, nombre: true })} autoComplete="name" aria-invalid={!!(t.nombre && err.nombre)} />{t.nombre && err.nombre && <em className="err">{err.nombre}</em>}</label>
          <label className="field"><span>Celular</span><input name="celular" type="tel" inputMode="numeric" value={f.celular} onChange={(e) => set('celular', formatoCel(e.target.value))} onBlur={() => setT({ ...t, celular: true })} placeholder="987 654 321" autoComplete="tel" aria-invalid={!!(t.celular && err.celular)} /><em className="soft">Lo usarás para seguir tu pedido.</em>{t.celular && err.celular && <em className="err">{err.celular}</em>}</label>
          <fieldset className="field"><legend>Entrega</legend>
            <div className="opts">
              <label className={'opt' + (f.entrega === 'recojo' ? ' on' : '')}><input type="radio" name="entrega" checked={f.entrega === 'recojo'} onChange={() => set('entrega', 'recojo')} /><Ico n="tienda" /><span><b>Recojo en tienda</b><small>Gratis · listo en 30 min</small></span></label>
              <label className={'opt' + (f.entrega === 'delivery' ? ' on' : '')}><input type="radio" name="entrega" checked={f.entrega === 'delivery'} onChange={() => set('entrega', 'delivery')} /><Ico n="moto" /><span><b>Delivery</b><small>S/ 5.00 · hoy mismo</small></span></label>
            </div>
            {err.entrega && <em className="err">{err.entrega}</em>}
          </fieldset>
          {f.entrega === 'delivery' && <label className="field aparece"><span>Dirección de entrega</span><input name="direccion" value={f.direccion} onChange={(e) => set('direccion', e.target.value)} onBlur={() => setT({ ...t, direccion: true })} autoComplete="street-address" aria-invalid={!!(t.direccion && err.direccion)} />{t.direccion && err.direccion && <em className="err">{err.direccion}</em>}</label>}
          <fieldset className="field"><legend>Método de pago</legend>
            <div className="opts col">
              {PAGOS.map((p) => <label key={p.v} className={'opt' + (f.metodoPago === p.v ? ' on' : '')}><input type="radio" name="pago" checked={f.metodoPago === p.v} onChange={() => set('metodoPago', p.v)} /><Ico n={p.i} /><span><b>{p.v}</b><small>{p.d}</small></span></label>)}
            </div>
          </fieldset>
          {f.metodoPago !== 'Contra entrega' && <label className="check demo"><input type="checkbox" checked={f.simularFallo} onChange={(e) => set('simularFallo', e.target.checked)} /> Demo: simular que el banco rechaza el pago</label>}
          <div className="totals num">
            <div><span>Productos ({unidades})</span><span>{money(total)}</span></div>
            <div><span>{f.entrega === 'delivery' ? 'Delivery (se paga al recibir)' : 'Recojo en tienda'}</span><span>{delivery ? money(delivery) : 'Gratis'}</span></div>
            <div className="grand"><span>Total</span><span key={total + delivery} className="total-n">{money(total + delivery)}</span></div>
            <small className="soft">Precios incluyen IGV.</small>
          </div>
          {error && <div className="alert" role="alert">{error}</div>}
          <button className={'btn big full pagar' + (enviando ? ' cargando' : '')} disabled={enviando}>
            {enviando ? <><span className="spin" aria-hidden="true" />Procesando…</> : f.metodoPago === 'Contra entrega' ? 'Confirmar pedido' : `Pagar ${money(total)} (simulado)`}
          </button>
        </form>
      </div>
    </div>
  )
}

/* ---------- Seguimiento ---------- */
const PASOS = ['Pendiente', 'Preparado', 'Entregado']

function Seguimiento({ codigo: codInicial = '', celularInicial = '', recien = false }) {
  const ref = useRef(null)
  const [pedido, setPedido] = useState(null)
  const [error, setError] = useState('')
  const [actualizado, setActualizado] = useState(null)
  const consultar = async (cod, cel) => {
    try { setPedido(await api(`/pedidos/seguimiento/${encodeURIComponent(normalizarCodigo(cod))}?celular=${cel.replace(/\D/g, '')}`)); setError(''); setActualizado(new Date()) } catch (e) { setError(e.message); setPedido(null) }
  }
  useEffect(() => { if (codInicial && celularInicial) consultar(codInicial, celularInicial) }, [codInicial, celularInicial])
  // Mientras el pedido esté en curso, el estado se actualiza solo cada 8 s.
  useEffect(() => {
    if (!pedido || ['Entregado', 'Cancelado'].includes(pedido.estado)) return
    const id = setInterval(() => consultar(pedido.codigo, celularInicial), 8000)
    return () => clearInterval(id)
  }, [pedido?.codigo, pedido?.estado])
  useReveal(ref, true, [!!pedido, !!error])

  // Sin pedido todavía: el cupón de búsqueda (con el error si los datos no coinciden)
  if (!codInicial || (error && !pedido)) return (
    <div className="wrap page" ref={ref}>
      <CuponSeguir titulo="h1" codigo={codInicial} celular={celularInicial} error={error} key={error} />
      <div className="ayuda" data-r style={{ '--i': 1 }}>
        <div><Ico n="caja" /><p><b>¿Dónde está mi código?</b>Aparece al terminar tu compra, por ejemplo NS-1001.</p></div>
        <div><Ico n="celular" /><p><b>Usa el mismo celular</b>El que escribiste al hacer el pedido, sin espacios ni prefijo.</p></div>
        <div><Ico n="reloj" /><p><b>Se actualiza solo</b>Deja la página abierta y verás cada cambio de estado.</p></div>
      </div>
    </div>
  )

  if (!pedido) return <div className="wrap page"><div className="track sk-panel" aria-busy="true" aria-label="Cargando pedido"><Cruz className="estado-cross" /></div></div>

  const paso = PASOS.indexOf(pedido.estado)
  const cancelado = pedido.estado === 'Cancelado'
  const recojo = pedido.entrega === 'recojo'
  const titulo = cancelado ? 'Pedido cancelado' : paso === 0 ? 'Recibimos tu pedido' : paso === 1 ? (recojo ? '¡Listo para recoger!' : '¡Va en camino!') : '¡Pedido entregado!'
  const mensaje = cancelado ? 'La botica canceló este pedido. Si pagaste, se te devolverá el monto.' : paso === 0 ? 'La botica ya lo está separando. Te avisamos aquí cuando esté listo.' : paso === 1 ? (recojo ? 'Acércate a Av. Principal 123 con tu código.' : 'El repartidor va hacia tu dirección.') : 'Gracias por comprar en Nova Salud.'
  const etiquetas = [['Recibido', 'La botica recibió tu pedido'], [recojo ? 'Listo para recoger' : 'En camino', recojo ? 'Acércate con tu código' : 'El repartidor va hacia ti'], ['Entregado', pedido.boleta ? `Boleta ${pedido.boleta}` : '¡Gracias por tu compra!']]
  return (
    <div className="wrap page" ref={ref}>
      {recien && <Progreso paso={3} />}
      <section className={'track' + (cancelado ? ' cancelado' : '')} aria-labelledby="ped-t">
        <div className="track-head" data-r>
          {recien && !cancelado && <Celebracion />}
          <div className="track-ico"><Cruz /></div>
          <div className="track-tit">
            <span className="track-cod num">Pedido {pedido.codigo}</span>
            <h1 id="ped-t">{recien && paso === 0 ? '¡Pedido recibido!' : titulo}</h1>
            <p>{recien && paso === 0 ? `Guarda tu código ${pedido.codigo} junto con tu celular. ${pedido.metodo_pago !== 'Contra entrega' ? 'Pago confirmado (simulado).' : ''}` : mensaje}</p>
          </div>
          <span className={'estado-tag ' + (cancelado ? 'red' : pedido.estado === 'Entregado' ? 'green' : 'amber')}>{pedido.estado}</span>
        </div>

        {!cancelado && (
          <ol className="track-bar" style={{ '--p': Math.max(0, paso) / 2 }} data-r>
            <i className="track-fill" />
            {etiquetas.map(([b, s], i) => (
              <li key={b} className={(i <= paso ? 'done' : '') + (i === paso && pedido.estado !== 'Entregado' ? ' now' : '')} style={{ '--k': i }}>
                <span className="track-dot">{i < paso || pedido.estado === 'Entregado' ? <Ico n="check" /> : <Cruz />}</span>
                <b>{b}</b><small>{s}</small>
              </li>
            ))}
          </ol>
        )}

        <div className="track-grid">
          <div className="track-items" data-r style={{ '--i': 1 }}>
            <h2>Tu pedido</h2>
            {pedido.items.map((i) => (
              <div key={i.productoId} className="ti">
                <FotoProducto p={{ nombre: i.nombre, presentacion: '' }} chica />
                <span><b>{i.nombre}</b><small className="num">{i.cantidad} × {money(i.precio)}</small></span>
                <b className="num">{money(i.cantidad * i.precio)}</b>
              </div>
            ))}
            <div className="ti-total num"><span>Total</span><b>{money(pedido.total)}</b></div>
          </div>
          <div className="track-info" data-r style={{ '--i': 2 }}>
            <h2>Detalles</h2>
            <p><Ico n={recojo ? 'tienda' : 'moto'} /><span><b>{recojo ? 'Recojo en tienda' : 'Delivery'}</b>{recojo ? 'Av. Principal 123, Lima' : 'A la dirección que indicaste'}</span></p>
            <p><Ico n="reloj" /><span><b>Horario</b>Lun a Sáb de 8:00 a 21:00</span></p>
            <p><Ico n={pedido.metodo_pago === 'Tarjeta' ? 'tarjeta' : pedido.metodo_pago === 'Contra entrega' ? 'efectivo' : 'celular'} /><span><b>Pago</b>{pedido.metodo_pago}</span></p>
            {!['Entregado', 'Cancelado'].includes(pedido.estado) && <p className="vivo"><span className="vivo-dot" aria-hidden="true" /><span>Se actualiza solo{actualizado ? ` · última revisión ${actualizado.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}` : ''}</span></p>}
            <div className="track-acc">
              <a className="btn" href="#/">Volver a la tienda</a>
              <a className="btn sec" href="https://www.google.com/maps/search/?api=1&query=Av.+Principal+123,+Lima" target="_blank" rel="noreferrer"><Ico n="pin" />Cómo llegar</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

/* ---------- Pie ---------- */
// ¿Está abierta la botica ahora? (Lun a Sáb de 8:00 a 21:00, hora de Lima)
function estadoTienda() {
  const ahora = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Lima' }))
  const d = ahora.getDay(), h = ahora.getHours() + ahora.getMinutes() / 60
  if (d >= 1 && d <= 6 && h >= 8 && h < 21) return { abierto: true, txt: 'Abierto ahora · cierra a las 21:00' }
  if (d >= 1 && d <= 6 && h < 8) return { abierto: false, txt: 'Cerrado · abre hoy a las 8:00' }
  if (d === 6 || d === 0) return { abierto: false, txt: 'Cerrado · abre el lunes a las 8:00' }
  return { abierto: false, txt: 'Cerrado · abre mañana a las 8:00' }
}

function Pie({ ruta }) {
  const ref = useRef(null)
  const [estado, setEstado] = useState(estadoTienda)
  useEffect(() => { const id = setInterval(() => setEstado(estadoTienda()), 60000); return () => clearInterval(id) }, [])
  useReveal(ref, true, [ruta])
  return (
    <footer className="foot" ref={ref}>
      <div className="wrap">
        <div className="foot-cta">
          <div>
            <h2 className="words" data-r="words"><Palabras texto="¿Necesitas algo hoy?" /></h2>
            <p className={'abierto' + (estado.abierto ? ' si' : '')} data-r style={{ '--i': 2 }}><span className="dot" aria-hidden="true" />{estado.txt}</p>
          </div>
          <div className="foot-btns" data-r style={{ '--i': 3 }}>
            <Ancla to="/catalogo" className="btn claro">Ver el catálogo</Ancla>
            <a href="#/seguimiento" className="btn linea">Seguir mi pedido</a>
          </div>
        </div>

        <div className="foot-grid">
          <div className="foot-brand" data-r>
            <CruzBloques gap={0.06} className="foot-cross" />
            <p>Botica de barrio en Lima. Pides en línea, recoges en 30 minutos o te lo llevamos hoy.</p>
          </div>
          <nav className="foot-col" data-r style={{ '--i': 1 }} aria-label="Tienda">
            <h2>Tienda</h2>
            <Ancla to="/catalogo">Catálogo</Ancla><Ancla to="/como">Cómo funciona</Ancla><a href="#/carrito">Carrito</a>
          </nav>
          <nav className="foot-col" data-r style={{ '--i': 2 }} aria-label="Tu pedido">
            <h2>Tu pedido</h2>
            <a href="#/seguimiento">Seguir mi pedido</a><Ancla to="/seguir">Buscar con código</Ancla>
          </nav>
          <div className="foot-col" data-r style={{ '--i': 3 }}>
            <h2>Visítanos</h2>
            <p>Av. Principal 123, Lima</p>
            <p>Lun a Sáb de 8:00 a 21:00</p>
            <a href="https://www.google.com/maps/search/?api=1&query=Av.+Principal+123,+Lima" target="_blank" rel="noreferrer">Cómo llegar ↗</a>
          </div>
        </div>

        <div className="foot-legal">
          <p>Proyecto académico: los pagos son simulados y no se realiza ningún cobro real.</p>
          <p>Foto de blísteres: dominio público (CC0), vía Wikimedia Commons.</p>
          <button type="button" className="arriba" onClick={() => scrollTo({ top: 0, behavior: menosMovimiento() ? 'auto' : 'smooth' })}>
            Volver arriba <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6" /></svg>
          </button>
        </div>
      </div>
      <p className="foot-word" aria-hidden="true" data-r="letters" translate="no">
        {'Nova Salud'.split('').map((l, i) => <span key={i} style={{ '--i': i }}>{l === ' ' ? ' ' : l}</span>)}
      </p>
    </footer>
  )
}
