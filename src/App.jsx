import { useEffect, useMemo, useRef, useState } from 'react'
import { api, money } from './api.js'
import { useCarrito } from './carrito.jsx'
import * as Ic from './iconos.jsx'
import { Cursor, FondoFiguras, Scroll, useEfectos } from './efectos.jsx'

// Navegación simple con #: funciona en cualquier hosting estático.
function useRuta() {
  const [h, setH] = useState(location.hash || '#/')
  useEffect(() => { const f = () => { setH(location.hash || '#/'); window.scrollTo(0, 0) }; addEventListener('hashchange', f); return () => removeEventListener('hashchange', f) }, [])
  return h.slice(1)
}
const ir = (r) => { location.hash = r }
const irACatalogo = () => document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })

export default function App() {
  const ruta = useRuta()
  const { unidades } = useCarrito()
  useEfectos()
  // El botón del carrito "salta" cuando se agrega un producto.
  const [salto, setSalto] = useState(0)
  const prev = useRef(unidades)
  useEffect(() => { if (unidades > prev.current) setSalto((n) => n + 1); prev.current = unidades }, [unidades])
  let pagina
  if (ruta.startsWith('/carrito')) pagina = <Carrito />
  else if (ruta.startsWith('/pedido/')) { const [cod, qs] = ruta.slice(8).split('?'); pagina = <Seguimiento codigo={decodeURIComponent(cod)} celularInicial={new URLSearchParams(qs).get('c') || ''} recien={new URLSearchParams(qs).get('nuevo') === '1'} /> }
  else if (ruta.startsWith('/seguimiento')) pagina = <Seguimiento />
  else pagina = <Catalogo />
  const activa = ruta.startsWith('/seguimiento') || ruta.startsWith('/pedido/') ? 'seg' : ruta.startsWith('/carrito') ? 'car' : 'cat'

  return (
    <>
      <Cursor />
      <Scroll />
      <div className="topbar">
        <div className="wrap topbar-in">
          <span><Ic.Reloj size={14} /> Lun a Sáb · 8:00 a 21:00</span>
          <span className="hide-sm"><Ic.Camion size={14} /> Delivery en Lima el mismo día</span>
          <span><Ic.Telefono size={14} /> (01) 555-0123</span>
        </div>
      </div>
      <header className="top">
        <div className="wrap top-in">
          <a href="#/" className="brand" aria-label="Nova Salud, inicio">
            <Ic.Logo />
            <span><b>Nova Salud</b><small>Botica y farmacia</small></span>
          </a>
          <nav className="top-nav" aria-label="Principal">
            <a href="#/" className={'nav-link hide-sm' + (activa === 'cat' ? ' on' : '')}>Catálogo</a>
            <a href="#/seguimiento" className={'nav-link' + (activa === 'seg' ? ' on' : '')}><Ic.Paquete size={18} /><span className="hide-sm">Seguir mi pedido</span></a>
            <a key={salto} href="#/carrito" className={'cart-btn' + (salto ? ' bump' : '')} aria-label={`Carrito, ${unidades} productos`}>
              <Ic.Carro size={19} /><span className="hide-sm">Carrito</span>
              {unidades > 0 && <span className="pill">{unidades}</span>}
            </a>
          </nav>
        </div>
      </header>
      <main>{pagina}</main>
      <Pie />
    </>
  )
}

function Pie() {
  return (
    <footer className="foot">
      <div className="wrap foot-grid">
        <div className="foot-brand">
          <div className="brand light"><Ic.Logo size={36} /><span><b>Nova Salud</b><small>Botica y farmacia</small></span></div>
          <p>Medicamentos y productos de cuidado personal con la atención cercana de tu botica de siempre, ahora también en línea.</p>
        </div>
        <div>
          <h4>Tienda</h4>
          <a href="#/">Catálogo</a>
          <a href="#/carrito">Mi carrito</a>
          <a href="#/seguimiento">Seguir mi pedido</a>
        </div>
        <div>
          <h4>Atención</h4>
          <p><Ic.Ubicacion size={16} /> Av. Principal 123, Lima</p>
          <p><Ic.Reloj size={16} /> Lun a Sáb, 8:00 a 21:00</p>
          <p><Ic.Telefono size={16} /> (01) 555-0123</p>
          <p><Ic.Correo size={16} /> contacto@novasalud.pe</p>
        </div>
        <div>
          <h4>Compra segura</h4>
          <p><Ic.Escudo size={16} /> Productos con registro sanitario</p>
          <p><Ic.Receta size={16} /> Venta con receta según normativa</p>
          <p><Ic.Tienda size={16} /> Recojo en tienda gratis</p>
        </div>
      </div>
      <div className="foot-bottom">
        <div className="wrap foot-bottom-in">
          <span>© {new Date().getFullYear()} Nova Salud. Todos los derechos reservados.</span>
          <span>Proyecto académico: los pagos son simulados y no se realiza ningún cobro real.</span>
        </div>
      </div>
    </footer>
  )
}

const BENEFICIOS = [
  { i: Ic.Reloj, t: 'Listo en 30 minutos', d: 'Pide en línea y recoge sin hacer cola.' },
  { i: Ic.Camion, t: 'Delivery el mismo día', d: 'Llevamos tu pedido a tu casa en Lima.' },
  { i: Ic.Escudo, t: 'Productos garantizados', d: 'Solo stock vigente, nunca lotes vencidos.' },
  { i: Ic.Estetoscopio, t: 'Asesoría farmacéutica', d: 'Te orientamos al recoger tu pedido.' },
]

const OFERTAS = 'Ofertas'
const ORDENES = { rel: 'Más relevantes', asc: 'Menor precio', desc: 'Mayor precio', az: 'Nombre (A-Z)' }

function Catalogo() {
  const { agregar, items, sincronizar, alergiaAine, setAlergiaAine } = useCarrito()
  const [prods, setProds] = useState(null)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('Todas')
  const [orden, setOrden] = useState('rel')
  const [ocultarAine, setOcultarAine] = useState(false)
  const [aviso, setAviso] = useState(null) // { t: texto, warn: true si es advertencia }
  const cargar = () => api('/catalogo/productos').then((d) => { setProds(d); sincronizar(d); setError('') }).catch((e) => setError(e.message))
  useEffect(() => { cargar() }, [])
  useEffect(() => { if (!aviso) return; const t = setTimeout(() => setAviso(null), aviso.warn ? 5000 : 2500); return () => clearTimeout(t) }, [aviso])
  const cats = useMemo(() => ['Todas', ...((prods || []).some((p) => p.enPromocion) ? [OFERTAS] : []), ...new Set((prods || []).map((p) => p.categoria))], [prods])
  const lista = useMemo(() => {
    const t = q.trim().toLowerCase()
    const xs = (prods || []).filter((p) => (cat === 'Todas' || p.categoria === cat || (cat === OFERTAS && p.enPromocion)) && (!t || p.nombre.toLowerCase().includes(t)) &&
      !(alergiaAine && ocultarAine && p.contieneAine))
    if (orden === 'asc') xs.sort((a, b) => a.precioFinal - b.precioFinal)
    else if (orden === 'desc') xs.sort((a, b) => b.precioFinal - a.precioFinal)
    else if (orden === 'az') xs.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    return xs
  }, [prods, q, cat, orden, alergiaAine, ocultarAine])
  const ocultos = alergiaAine && ocultarAine ? (prods || []).filter((p) => p.contieneAine).length : 0
  const promos = (prods || []).filter((p) => p.enPromocion && !p.agotado)

  return (
    <>
      <section className="hero spot">
        <div className="hero-glow" aria-hidden="true" />
        <FondoFiguras />
        <div className="wrap hero-in">
          <div className="hero-txt" data-reveal>
            <span className="eyebrow"><Ic.Check size={14} /> Tu botica de confianza, ahora en línea</span>
            <h1>Tus medicamentos, <em>sin hacer cola</em></h1>
            <p>Pide en línea y recógelo en tienda en minutos, o recíbelo en casa. Los mismos precios que en mostrador.</p>
            <div className="hero-cta">
              <button className="btn big light" onClick={irACatalogo}>Ver catálogo <Ic.FlechaDer size={18} /></button>
              <a className="btn big ghost" href="#/seguimiento"><Ic.Paquete size={18} /> Seguir mi pedido</a>
            </div>
            <ul className="hero-pay">
              <li><Ic.Movil size={16} /> Yape / Plin</li>
              <li><Ic.Tarjeta size={16} /> Tarjeta</li>
              <li><Ic.Billete size={16} /> Contra entrega</li>
            </ul>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="hero-circle" />
            <div className="float f1"><span className="fi teal"><Ic.Pastilla size={22} /></span><div><b>Analgésicos</b><small>Alivio rápido</small></div></div>
            <div className="float f2"><span className="fi lime"><Ic.Hoja size={22} /></span><div><b>Vitaminas</b><small>Para toda la familia</small></div></div>
            <div className="float f3"><span className="fi green"><Ic.Check size={22} /></span><div><b>Pedido listo</b><small>Recógelo en tienda</small></div></div>
            <svg className="hero-cross" viewBox="0 0 120 120"><path d="M45 10h30v35h35v30H75v35H45V75H10V45h35z" /></svg>
          </div>
        </div>
      </section>

      <div className="wrap">
        <section className="benefits" data-reveal>
          {BENEFICIOS.map(({ i: B, t, d }) => (
            <div key={t} className="benefit"><span className="b-ico"><B size={22} /></span><div><b>{t}</b><p>{d}</p></div></div>
          ))}
        </section>
      </div>

      <div className="wrap" id="catalogo">
        {promos.length > 0 && (
          <section className="promo-band" data-reveal>
            <span className="promo-badge">-20%</span>
            <div><b>Ofertas de la semana</b><p>{promos.map((p) => p.nombre).join(' · ')}</p></div>
            <button className="btn sm light" onClick={() => { setQ(''); setCat(OFERTAS) }}>Ver ofertas</button>
          </section>
        )}

        <div className="sec-head" data-reveal>
          <div><h2>Catálogo de productos</h2><p className="muted">Busca por nombre o filtra por categoría.</p></div>
        </div>

        <div className="filtros">
          <div className="filtros-row">
            <label className="search">
              <Ic.Buscar size={18} />
              <input placeholder="¿Qué estás buscando? Ej. paracetamol" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar producto" />
              {q && <button type="button" className="search-x" onClick={() => setQ('')} aria-label="Borrar búsqueda">×</button>}
            </label>
            <label className="sort">
              <span className="hide-sm">Ordenar por</span>
              <select value={orden} onChange={(e) => setOrden(e.target.value)} aria-label="Ordenar productos">
                {Object.entries(ORDENES).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
              </select>
            </label>
          </div>
          <div className="chips" role="group" aria-label="Categorías">
            {cats.map((c) => <button key={c} className={'chip' + (cat === c ? ' on' : '')} aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>)}
          </div>
          <div className={'alergia' + (alergiaAine ? ' on' : '')}>
            <label className="check">
              <input type="checkbox" checked={alergiaAine} onChange={(e) => setAlergiaAine(e.target.checked)} />
              <span><b><Ic.Alerta size={15} /> Soy alérgico/a a los AINEs</b><small>Ibuprofeno, naproxeno, aspirina, diclofenaco y otros antiinflamatorios. Te avisaremos en cada producto que los contenga.</small></span>
            </label>
            {alergiaAine && <label className="check sub"><input type="checkbox" checked={ocultarAine} onChange={(e) => setOcultarAine(e.target.checked)} /> Ocultar los productos con AINE</label>}
          </div>
          {prods && <p className="muted s">{lista.length} {lista.length === 1 ? 'producto' : 'productos'}{cat !== 'Todas' && ` en ${cat}`}{ocultos > 0 && ` · ${ocultos} con AINE ocultos`}</p>}
        </div>

        {error && <div className="empty"><span className="empty-ico red"><Ic.Alerta size={28} /></span><b>No pudimos cargar el catálogo</b><p className="muted">{error}</p><button className="btn sec" onClick={cargar}>Reintentar</button></div>}
        {!prods && !error && <div className="grid">{[...Array(8)].map((_, i) => <div key={i} className="card sk" />)}</div>}
        {prods && lista.length === 0 && <div className="empty"><span className="empty-ico"><Ic.Buscar size={28} /></span><b>No encontramos “{q}”</b><p className="muted">Prueba con otro nombre o revisa todas las categorías.</p><button className="btn sec" onClick={() => { setQ(''); setCat('Todas') }}>Ver todo el catálogo</button></div>}

        <div className="grid">
          {lista.map((p, n) => {
            const enCarrito = items.find((i) => i.id === p.id)?.cant || 0
            const lleno = enCarrito >= p.disponible
            const { Icono, color } = Ic.temaCategoria(p.categoria)
            const riesgo = alergiaAine && p.contieneAine
            return (
              <article key={p.id} className={'card prod tilt' + (p.agotado ? ' off' : '') + (riesgo ? ' riesgo' : '')} data-reveal style={{ '--i': n % 4 }}>
                <div className={'prod-img ' + color} aria-hidden="true">
                  <Icono size={46} strokeWidth={1.5} />
                  <div className="prod-tags">
                    {p.enPromocion && <span className="tag solid-green">-20%</span>}
                    {p.agotado && <span className="tag solid-dark">Agotado</span>}
                  </div>
                </div>
                <span className="prod-cat">{p.categoria}</span>
                <h3>{p.nombre}</h3>
                <p className="muted s">{p.presentacion}</p>
                <div className="prod-flags">
                  {p.contieneAine && <span className="tag red" title="Antiinflamatorio no esteroideo"><Ic.Alerta size={12} /> Contiene AINE</span>}
                  {p.requiereReceta && <span className="tag amber"><Ic.Receta size={12} /> Requiere receta</span>}
                  {!p.agotado && p.disponible <= 5 && <span className="tag red">¡Últimas {p.disponible}!</span>}
                </div>
                {riesgo && <p className="aine-aviso" role="note"><Ic.Alerta size={15} /> No recomendado: indicaste que eres alérgico/a a los AINEs.</p>}
                <div className="prod-bot">
                  <div className="price">{p.enPromocion && <s>{money(p.precio)}</s>}<b>{money(p.precioFinal)}</b></div>
                  {!p.agotado && (
                    <button className={'btn add' + (enCarrito ? ' in' : '')} disabled={lleno} onClick={() => { agregar(p); setAviso(riesgo ? { t: `${p.nombre} contiene un AINE y marcaste que eres alérgico/a. Consulta con el químico farmacéutico antes de consumirlo.`, warn: true } : { t: `${p.nombre} agregado al carrito` }) }} aria-label={`Agregar ${p.nombre} al carrito`}>
                      {lleno ? 'Máximo' : enCarrito ? <><Ic.Check size={16} /> {enCarrito}</> : <><Ic.Mas size={16} /> Agregar</>}
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </div>

      <section className="how">
        <div className="wrap">
          <h2 data-reveal>¿Cómo comprar?</h2>
          <ol className="how-steps">
            <li data-reveal style={{ '--i': 0 }}><span>1</span><b>Elige tus productos</b><p>Busca en el catálogo y agrégalos a tu carrito.</p></li>
            <li data-reveal style={{ '--i': 1 }}><span>2</span><b>Confirma tu pedido</b><p>Escoge recojo o delivery y tu método de pago.</p></li>
            <li data-reveal style={{ '--i': 2 }}><span>3</span><b>Recibe o recoge</b><p>Sigue el estado de tu pedido con tu código y celular.</p></li>
          </ol>
        </div>
      </section>

      <section className="wrap">
        <div className="cta spot" data-reveal>
          <FondoFiguras />
          <div className="cta-txt">
            <h2>¿Tienes una receta médica?</h2>
            <p>Arma tu pedido en línea y preséntala al recoger. Nuestro químico farmacéutico la valida en el momento.</p>
          </div>
          <div className="cta-act">
            <button className="btn big light" onClick={irACatalogo}>Empezar a comprar <Ic.FlechaDer size={18} /></button>
            <span><Ic.Telefono size={16} /> ¿Dudas? Llámanos al (01) 555-0123</span>
          </div>
        </div>
      </section>

      {aviso && <div className={'toast' + (aviso.warn ? ' warn' : '')} role={aviso.warn ? 'alert' : 'status'}>{aviso.warn ? <Ic.Alerta size={18} /> : <Ic.Check size={18} />} <span>{aviso.t}</span> <a href="#/carrito">Ver carrito</a></div>}
    </>
  )
}

const PAGOS = [
  { v: 'Yape / Plin', i: Ic.Movil, d: 'Se simula la confirmación del pago al instante.' },
  { v: 'Tarjeta', i: Ic.Tarjeta, d: 'Pago simulado: no ingreses datos reales de tarjeta.' },
  { v: 'Contra entrega', i: Ic.Billete, d: 'Pagas al recoger o al recibir tu pedido.' },
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
  const { items, cambiar, vaciar, total, unidades, alergiaAine, setAlergiaAine } = useCarrito()
  const [f, setF] = useState({ nombre: '', celular: '', entrega: 'recojo', direccion: '', metodoPago: 'Yape / Plin', simularFallo: false })
  const [t, setT] = useState({})
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const set = (k, v) => { setF({ ...f, [k]: v }); setError('') }
  const conReceta = items.some((i) => i.receta)
  const conAine = items.filter((i) => i.aine)
  const delivery = f.entrega === 'delivery' ? 5 : 0
  const err = {
    nombre: f.nombre.trim().length < 2 ? 'Escribe tu nombre.' : '',
    celular: !/^9\d{8}$/.test(f.celular.replace(/\D/g, '')) ? 'Ingresa un celular de 9 dígitos que empiece con 9.' : '',
    direccion: f.entrega === 'delivery' && f.direccion.trim().length < 5 ? 'Escribe tu dirección completa.' : '',
    entrega: conReceta && f.entrega === 'delivery' ? 'Tu carrito tiene productos con receta: solo se pueden recoger en tienda.' : '',
  }
  const ok = Object.values(err).every((e) => !e)

  if (!items.length) return (
    <div className="wrap narrow"><div className="empty big"><span className="empty-ico"><Ic.Carro size={30} /></span><b>Tu carrito está vacío</b><p className="muted">Agrega productos desde el catálogo para hacer tu pedido.</p><a className="btn" href="#/">Ir al catálogo</a></div></div>
  )

  const pagar = async (e) => {
    e.preventDefault()
    setT({ nombre: true, celular: true, direccion: true, entrega: true })
    if (!ok) return
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
    <div className="wrap page">
      <div className="page-head">
        <a href="#/" className="back"><Ic.Flecha size={16} /> Seguir comprando</a>
        <h1>Finalizar compra</h1>
        <Progreso paso={1} />
      </div>
      <div className="checkout">
        <form className="card form" onSubmit={pagar} noValidate data-reveal>
          <section>
            <h2 className="step-t"><span>1</span> Tus datos</h2>
            <div className="field-row">
              <label className={'field' + (inv('nombre') ? ' bad' : '')}><span>Nombre y apellido</span><input value={f.nombre} onChange={(e) => set('nombre', e.target.value)} onBlur={() => setT({ ...t, nombre: true })} autoComplete="name" placeholder="Ej. María Pérez" aria-invalid={!!inv('nombre')} />{inv('nombre') && <em className="err">{err.nombre}</em>}</label>
              <label className={'field' + (inv('celular') ? ' bad' : '')}><span>Celular</span><input inputMode="numeric" value={f.celular} onChange={(e) => set('celular', e.target.value)} onBlur={() => setT({ ...t, celular: true })} placeholder="987 654 321" autoComplete="tel" aria-invalid={!!inv('celular')} />{inv('celular') ? <em className="err">{err.celular}</em> : <em className="muted">Lo usarás para seguir tu pedido.</em>}</label>
            </div>
          </section>

          <fieldset className="field">
            <legend className="step-t"><span>2</span> Entrega</legend>
            <div className="opts">
              <label className={'opt' + (f.entrega === 'recojo' ? ' on' : '')}><input type="radio" name="entrega" checked={f.entrega === 'recojo'} onChange={() => set('entrega', 'recojo')} /><span className="opt-ico"><Ic.Tienda size={20} /></span><span><b>Recojo en tienda</b><small>Gratis · listo en 30 min</small></span></label>
              <label className={'opt' + (f.entrega === 'delivery' ? ' on' : '')}><input type="radio" name="entrega" checked={f.entrega === 'delivery'} onChange={() => set('entrega', 'delivery')} /><span className="opt-ico"><Ic.Camion size={20} /></span><span><b>Delivery</b><small>S/ 5.00 · hoy mismo</small></span></label>
            </div>
            {err.entrega && <div className="alert sm" role="alert"><Ic.Alerta size={16} /> {err.entrega}</div>}
            {f.entrega === 'delivery' && <label className={'field' + (inv('direccion') ? ' bad' : '')}><span>Dirección de entrega</span><input value={f.direccion} onChange={(e) => set('direccion', e.target.value)} onBlur={() => setT({ ...t, direccion: true })} autoComplete="street-address" placeholder="Calle, número, distrito y referencia" aria-invalid={!!inv('direccion')} />{inv('direccion') && <em className="err">{err.direccion}</em>}</label>}
            {f.entrega === 'recojo' && <p className="muted s"><Ic.Ubicacion size={14} /> Av. Principal 123, Lima · Lun a Sáb de 8:00 a 21:00</p>}
          </fieldset>

          <fieldset className="field">
            <legend className="step-t"><span>3</span> Método de pago</legend>
            <div className="opts col">
              {PAGOS.map(({ v, i: P, d }) => <label key={v} className={'opt' + (f.metodoPago === v ? ' on' : '')}><input type="radio" name="pago" checked={f.metodoPago === v} onChange={() => set('metodoPago', v)} /><span className="opt-ico"><P size={20} /></span><span><b>{v}</b><small>{d}</small></span></label>)}
            </div>
            {f.metodoPago !== 'Contra entrega' && <label className="check demo"><input type="checkbox" checked={f.simularFallo} onChange={(e) => set('simularFallo', e.target.checked)} /> Demo: simular que el banco rechaza el pago</label>}
          </fieldset>

          {error && <div className="alert" role="alert"><Ic.Alerta size={18} /> {error}</div>}
          <button className="btn big full" disabled={enviando}>{enviando ? <><span className="spin" /> Procesando…</> : f.metodoPago === 'Contra entrega' ? 'Confirmar pedido' : `Pagar ${money(total)} (simulado)`}</button>
          <p className="secure"><Ic.Escudo size={14} /> Tus datos solo se usan para gestionar este pedido.</p>
        </form>

        <aside className="card summary" data-reveal style={{ '--i': 1 }}>
          <div className="row-h"><h2>Resumen <span className="muted count">({unidades} {unidades === 1 ? 'producto' : 'productos'})</span></h2><button type="button" className="link danger" onClick={vaciar}><Ic.Basura size={15} /> Vaciar</button></div>
          <div className="lines">
            {items.map((i) => (
              <div key={i.id} className="line">
                <div className="line-info"><b>{i.nombre}</b><small>{i.presentacion} · {money(i.precio)} c/u</small>{(i.receta || i.aine) && <span className="line-tags">{i.aine && <span className="tag red"><Ic.Alerta size={12} /> Contiene AINE</span>}{i.receta && <span className="tag amber"><Ic.Receta size={12} /> Receta</span>}</span>}</div>
                <div className="line-act">
                  <div className="qty">
                    <button type="button" onClick={() => cambiar(i.id, i.cant - 1)} aria-label={'Quitar uno de ' + i.nombre}>{i.cant === 1 ? <Ic.Basura size={15} /> : <Ic.Menos size={15} />}</button>
                    <span>{i.cant}</span>
                    <button type="button" onClick={() => cambiar(i.id, i.cant + 1)} disabled={i.cant >= i.max} aria-label={'Agregar uno de ' + i.nombre}><Ic.Mas size={15} /></button>
                  </div>
                  <b>{money(i.cant * i.precio)}</b>
                </div>
              </div>
            ))}
          </div>
          {conAine.length > 0 && (alergiaAine
            ? <div className="alert sm" role="alert"><Ic.Alerta size={16} /> <span>Indicaste que eres alérgico/a a los AINEs y tu carrito tiene {conAine.map((i) => i.nombre).join(', ')}. Te recomendamos retirarlos o consultar con nuestro químico farmacéutico.</span></div>
            : <p className="nota"><Ic.Alerta size={16} /> <span>{conAine.length === 1 ? 'Un producto contiene' : 'Algunos productos contienen'} AINEs (antiinflamatorios). No los consumas si eres alérgico/a. <button type="button" className="link" onClick={() => setAlergiaAine(true)}>Soy alérgico/a</button></span></p>)}
          {conReceta && <p className="nota"><Ic.Info size={16} /> Algunos productos requieren receta médica. Preséntala al recoger tu pedido en la botica.</p>}
          <div className="totals">
            <div><span>Subtotal</span><span>{money(total)}</span></div>
            <div><span>Entrega</span><span>{delivery > 0 ? `${money(delivery)} (al recibir)` : 'Gratis'}</span></div>
            <div className="grand"><span>Total</span><span>{money(total + delivery)}</span></div>
            <small className="muted">Precios incluyen IGV.</small>
          </div>
        </aside>
      </div>
    </div>
  )
}

const PASOS = ['Pendiente', 'Preparado', 'Entregado']

function Seguimiento({ codigo: codInicial = '', celularInicial = '', recien = false }) {
  const [codigo, setCodigo] = useState(codInicial)
  const [celular, setCelular] = useState(celularInicial)
  const [pedido, setPedido] = useState(null)
  const [error, setError] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const consultar = async (cod = codigo, cel = celular) => {
    try { setPedido(await api(`/pedidos/seguimiento/${encodeURIComponent(cod.trim())}?celular=${cel.replace(/\D/g, '')}`)); setError('') } catch (e) { setError(e.message); setPedido(null) }
  }
  useEffect(() => { if (codInicial && celularInicial) consultar(codInicial, celularInicial) }, [codInicial, celularInicial])
  // Mientras el pedido esté en curso, el estado se actualiza solo cada 8 s.
  useEffect(() => {
    if (!pedido || ['Entregado', 'Cancelado'].includes(pedido.estado)) return
    const id = setInterval(() => consultar(pedido.codigo, celular), 8000)
    return () => clearInterval(id)
  }, [pedido?.codigo, pedido?.estado])
  const copiar = () => { navigator.clipboard?.writeText(pedido.codigo).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 2000) }).catch(() => {}) }

  const paso = pedido ? PASOS.indexOf(pedido.estado) : -1
  return (
    <div className="wrap narrow">
      {recien && <Progreso paso={3} />}
      {recien && pedido && (
        <div className="ok-box" data-reveal>
          <span className="ok-ico"><Ic.Check size={28} /></span>
          <h1>¡Pedido recibido!</h1>
          <p>{pedido.metodo_pago !== 'Contra entrega' ? 'Pago confirmado (simulado). ' : ''}Guarda tu código junto con tu celular para seguir tu pedido.</p>
          <button type="button" className="code" onClick={copiar} title="Copiar código">{pedido.codigo} {copiado ? <Ic.Check size={16} /> : <Ic.Copiar size={16} />}</button>
          {copiado && <small>Código copiado</small>}
        </div>
      )}
      {!codInicial && (
        <form className="card" onSubmit={async (e) => { e.preventDefault(); setBuscando(true); await consultar(); setBuscando(false) }}>
          <div className="form-head"><span className="empty-ico"><Ic.Paquete size={26} /></span><div><h1>Seguir mi pedido</h1><p className="muted">Ingresa el código que recibiste y el celular con el que compraste.</p></div></div>
          <label className="field"><span>Código del pedido</span><input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="NS-1001" /></label>
          <label className="field"><span>Celular con el que compraste</span><input inputMode="numeric" value={celular} onChange={(e) => setCelular(e.target.value)} placeholder="987 654 321" /></label>
          <button className="btn big full" disabled={!codigo.trim() || !celular.trim() || buscando}>{buscando ? <><span className="spin" /> Buscando…</> : 'Consultar estado'}</button>
        </form>
      )}
      {error && <div className="alert" role="alert"><Ic.Alerta size={18} /> {error}</div>}
      {pedido && (
        <section className="card" data-reveal style={{ '--i': 1 }}>
          <div className="row-h"><div><small className="muted">Pedido</small><h2>{pedido.codigo}</h2></div><span className={'tag lg ' + (pedido.estado === 'Cancelado' ? 'red' : pedido.estado === 'Entregado' ? 'green' : 'amber')}>{pedido.estado}</span></div>
          {pedido.estado === 'Cancelado' ? <p className="nota"><Ic.Info size={16} /> Este pedido fue cancelado por la botica. Si pagaste, se te devolverá el monto. Escríbenos para más información.</p> : (
            <ol className="steps">
              {PASOS.map((s, i) => (
                <li key={s} className={i < paso ? 'done' : i === paso ? 'done now' : ''}>
                  <span className="dot">{i <= paso ? <Ic.Check size={14} /> : i + 1}</span>
                  <div>
                    <b>{s === 'Pendiente' ? 'Recibido' : s === 'Preparado' ? (pedido.entrega === 'recojo' ? 'Listo para recoger' : 'En camino') : 'Entregado'}</b>
                    <small>{s === 'Pendiente' ? 'La botica recibió tu pedido' : s === 'Preparado' ? (pedido.entrega === 'recojo' ? 'Acércate con tu código' : 'El repartidor va hacia ti') : pedido.boleta ? `Boleta ${pedido.boleta}` : '¡Gracias por tu compra!'}</small>
                  </div>
                </li>
              ))}
            </ol>
          )}
          <div className="lines">
            {pedido.items.map((i) => <div key={i.productoId} className="line simple"><span>{i.cantidad} × {i.nombre}{i.contieneAine && <> <span className="tag red"><Ic.Alerta size={12} /> AINE</span></>}</span><b>{money(i.cantidad * i.precio)}</b></div>)}
            <div className="line simple grand"><span>Total</span><b>{money(pedido.total)}</b></div>
          </div>
          <div className="meta">
            <span>{pedido.entrega === 'recojo' ? <><Ic.Tienda size={16} /> Recojo en tienda · Av. Principal 123</> : <><Ic.Camion size={16} /> Delivery</>}</span>
            <span><Ic.Tarjeta size={16} /> {pedido.metodo_pago}</span>
          </div>
          {!['Entregado', 'Cancelado'].includes(pedido.estado) && <p className="muted s live"><span className="pulse" /> Esta página se actualiza sola.</p>}
          <a className="btn sec" href="#/"><Ic.Flecha size={16} /> Volver a la tienda</a>
        </section>
      )}
    </div>
  )
}
