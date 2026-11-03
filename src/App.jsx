import { useEffect, useMemo, useState } from 'react'
import Tema from './Tema.jsx'
import ImagenProducto from './ImagenProducto.jsx'
import { api, money } from './api.js'
import { useCarrito } from './carrito.jsx'

// Navegación simple con #: funciona en cualquier hosting estático.
function useRuta() {
  const [h, setH] = useState(location.hash || '#/')
  useEffect(() => { const f = () => { setH(location.hash || '#/'); window.scrollTo(0, 0) }; addEventListener('hashchange', f); return () => removeEventListener('hashchange', f) }, [])
  return h.slice(1)
}
const ir = (r) => { location.hash = r }

export default function App() {
  const ruta = useRuta()
  const { unidades } = useCarrito()
  let pagina
  if (ruta.startsWith('/carrito')) pagina = <Carrito />
  else if (ruta.startsWith('/pedido/')) { const [cod, qs] = ruta.slice(8).split('?'); pagina = <Seguimiento codigo={decodeURIComponent(cod)} celularInicial={new URLSearchParams(qs).get('c') || ''} recien={new URLSearchParams(qs).get('nuevo') === '1'} /> }
  else if (ruta.startsWith('/seguimiento')) pagina = <Seguimiento />
  else pagina = <Catalogo />

  return (
    <>
      <header className="top">
        <div className="wrap top-in">
          <a href="#/" className="brand" aria-label="Nova Salud, ir al catálogo"><span className="brand-logo-frame"><img className="brand-logo" src="/images/nova-salud-logo.png" alt="Nova Salud" /></span></a>
          <nav className="top-nav"><Tema /><a href="#/">Catálogo</a>
            <a href="#/seguimiento">Seguir mi pedido</a>
            <a href="#/carrito" className="cart-btn" aria-label={`Carrito, ${unidades} productos`}>Carrito {unidades > 0 && <span className="pill">{unidades}</span>}</a>
          </nav>
        </div>
      </header>
      <main>{pagina}</main>
      <footer className="foot">
        <div className="wrap foot-in">
          <div><b>Nova Salud</b><p>Av. Principal 123, Lima · Lun a Sáb de 8:00 a 21:00</p></div>
          <p className="muted">Proyecto académico: los pagos son simulados y no se realiza ningún cobro real.</p>
        </div>
      </footer>
    </>
  )
}

function Catalogo() {
  const { agregar, items, sincronizar } = useCarrito()
  const [prods, setProds] = useState(null)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('Todas')
  const [aviso, setAviso] = useState('')
  const cargar = () => api('/catalogo/productos').then((d) => { setProds(d); sincronizar(d); setError('') }).catch((e) => setError(e.message))
  useEffect(() => { cargar() }, [])
  useEffect(() => { if (!aviso) return; const t = setTimeout(() => setAviso(''), 2500); return () => clearTimeout(t) }, [aviso])
  const cats = useMemo(() => ['Todas', ...new Set((prods || []).map((p) => p.categoria))], [prods])
  const lista = useMemo(() => {
    const t = q.trim().toLowerCase()
    return (prods || []).filter((p) => (cat === 'Todas' || p.categoria === cat) && (!t || p.nombre.toLowerCase().includes(t)))
  }, [prods, q, cat])
  const promos = (prods || []).filter((p) => p.enPromocion && !p.agotado)

  return (
    <>
      <section className="hero">
        <div className="wrap hero-in">
          <div>
            <p className="eyebrow">TU BOTICA, MÁS CERCA</p><h1><span>Cuidarte empieza</span><br /><span className="hero-accent">por algo simple.</span></h1>
            <p>Encuentra lo que necesitas para tu bienestar. Explora el catálogo, prepara tu pedido y elige cómo recibirlo.</p>
            <div className="hero-tags"><span>Recojo en 30 min</span><span>Delivery en Lima</span><span>Yape, tarjeta o contra entrega</span></div>
            <a className="btn hero-cta" href="#catalogo" onClick={(event) => { event.preventDefault(); document.getElementById('catalogo')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }) }}>Explorar productos <span aria-hidden="true">↗</span></a>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="art-orbit"></div>
            <div className="art-cross">+</div>
            <div className="art-label"><span>✦</span> Un poco más de bienestar</div>
            <div className="art-pill"></div>
            <div className="art-dot"></div>
          </div>
        </div>
      </section>
      <div className="wrap" id="catalogo">
        {promos.length > 0 && (
          <section className="promo-band">
            <b>Ofertas de la semana:</b> {promos.map((p) => p.nombre).join(' · ')} · Consulta el precio especial de cada producto
          </section>
        )}
        <div className="catalog-heading"><div><p className="eyebrow">BIENESTAR A TU ALCANCE</p><h2>Explora nuestra botica</h2></div><span className="muted">{lista.length} productos</span></div><div className="filtros">
          <input className="search" placeholder="¿Qué estás buscando? Ej. paracetamol" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar producto" />
          <div className="chips">{cats.map((c) => <button key={c} className={'chip' + (cat === c ? ' on' : '')} onClick={() => setCat(c)}>{c}</button>)}</div>
        </div>
        {error && <div className="empty"><b>No pudimos cargar el catálogo</b><p>{error}</p><button className="btn sec" onClick={cargar}>Reintentar</button></div>}
        {!prods && !error && <div className="grid">{[...Array(8)].map((_, i) => <div key={i} className="card sk" />)}</div>}
        {prods && lista.length === 0 && <div className="empty"><b>No encontramos “{q}”</b><p>Prueba con otro nombre o revisa todas las categorías.</p><button className="btn sec" onClick={() => { setQ(''); setCat('Todas') }}>Ver todo el catálogo</button></div>}
        <div className="grid">
          {lista.map((p, indice) => {
            const enCarrito = items.find((i) => i.id === p.id)?.cant || 0
            const lleno = enCarrito >= p.disponible
            return (
              <article key={p.id} style={{ '--entrada': `${Math.min(indice, 7) * 65}ms` }} className={'card prod' + (p.agotado ? ' off' : '')}>
                <ImagenProducto producto={p} />
                <div className="prod-tags">
                  {p.enPromocion && <span className="tag green">{p.precio > p.precioFinal ? `−${Math.round((1 - p.precioFinal / p.precio) * 100)}%` : "Oferta"}</span>}
                  {p.requiereReceta && <span className="tag amber">Requiere receta</span>}
                  {!p.agotado && p.disponible <= 5 && <span className="tag red">¡Últimas {p.disponible}!</span>}
                </div>
                <h3>{p.nombre}</h3>
                <p className="muted">{p.presentacion}</p>
                <div className="prod-bot">
                  <div className="price">{p.enPromocion && <s>{money(p.precio)}</s>}<b>{money(p.precioFinal)}</b></div>
                  {p.agotado ? <span className="tag">Agotado</span> : (
                    <button className="btn" disabled={lleno} onClick={() => { agregar(p); setAviso(`${p.nombre} agregado al carrito`) }}>{lleno ? 'Máximo' : enCarrito ? `Agregar (${enCarrito})` : 'Agregar'}</button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </div>
      {aviso && <div className="toast" role="status">{aviso} · <a href="#/carrito">Ver carrito</a></div>}
    </>
  )
}

const PAGOS = [
  { v: 'Yape / Plin', d: 'Se simula la confirmación del pago al instante.' },
  { v: 'Tarjeta', d: 'Pago simulado: no ingreses datos reales de tarjeta.' },
  { v: 'Contra entrega', d: 'Pagas al recoger o al recibir tu pedido.' },
]

function Carrito() {
  const { items, cambiar, vaciar, total } = useCarrito()
  const [f, setF] = useState({ nombre: '', celular: '', entrega: 'recojo', direccion: '', metodoPago: 'Yape / Plin', simularFallo: false })
  const [t, setT] = useState({})
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
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
    <div className="wrap narrow"><div className="empty big"><b>Tu carrito está vacío</b><p>Agrega productos desde el catálogo para hacer tu pedido.</p><a className="btn" href="#/">Ir al catálogo</a></div></div>
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

  return (
    <div className="wrap checkout">
      <section className="card">
        <div className="row-h"><h2>Tu carrito</h2><button className="link" onClick={vaciar}>Vaciar</button></div>
        {items.map((i) => (
          <div key={i.id} className="line">
            <div><b>{i.nombre}</b><small>{i.presentacion} · {money(i.precio)} c/u {i.receta && <span className="tag amber">Receta</span>}</small></div>
            <div className="qty">
              <button onClick={() => cambiar(i.id, i.cant - 1)} aria-label={'Quitar uno de ' + i.nombre}>−</button>
              <span>{i.cant}</span>
              <button onClick={() => cambiar(i.id, i.cant + 1)} disabled={i.cant >= i.max} aria-label={'Agregar uno de ' + i.nombre}>+</button>
            </div>
            <b className="r">{money(i.cant * i.precio)}</b>
          </div>
        ))}
        {conReceta && <p className="nota">Algunos productos requieren receta médica. Preséntala al recoger tu pedido en la botica.</p>}
        <a href="#/" className="link">← Seguir comprando</a>
      </section>

      <form className="card" onSubmit={pagar} noValidate>
        <h2>Datos del pedido</h2>
        <label className="field"><span>Nombre y apellido</span><input value={f.nombre} onChange={(e) => set('nombre', e.target.value)} onBlur={() => setT({ ...t, nombre: true })} autoComplete="name" />{t.nombre && err.nombre && <em className="err">{err.nombre}</em>}</label>
        <label className="field"><span>Celular</span><input inputMode="numeric" value={f.celular} onChange={(e) => set('celular', e.target.value)} onBlur={() => setT({ ...t, celular: true })} placeholder="987 654 321" autoComplete="tel" /><em className="muted">Lo usarás para seguir tu pedido.</em>{t.celular && err.celular && <em className="err">{err.celular}</em>}</label>
        <fieldset className="field"><legend>Entrega</legend>
          <div className="opts">
            <label className={'opt' + (f.entrega === 'recojo' ? ' on' : '')}><input type="radio" name="entrega" checked={f.entrega === 'recojo'} onChange={() => set('entrega', 'recojo')} /><span><b>Recojo en tienda</b><small>Gratis · listo en 30 min</small></span></label>
            <label className={'opt' + (f.entrega === 'delivery' ? ' on' : '')}><input type="radio" name="entrega" checked={f.entrega === 'delivery'} onChange={() => set('entrega', 'delivery')} /><span><b>Delivery</b><small>S/ 5.00 · hoy mismo</small></span></label>
          </div>
          {err.entrega && <em className="err">{err.entrega}</em>}
        </fieldset>
        {f.entrega === 'delivery' && <label className="field"><span>Dirección de entrega</span><input value={f.direccion} onChange={(e) => set('direccion', e.target.value)} onBlur={() => setT({ ...t, direccion: true })} autoComplete="street-address" />{t.direccion && err.direccion && <em className="err">{err.direccion}</em>}</label>}
        <fieldset className="field"><legend>Método de pago</legend>
          <div className="opts col">
            {PAGOS.map((p) => <label key={p.v} className={'opt' + (f.metodoPago === p.v ? ' on' : '')}><input type="radio" name="pago" checked={f.metodoPago === p.v} onChange={() => set('metodoPago', p.v)} /><span><b>{p.v}</b><small>{p.d}</small></span></label>)}
          </div>
        </fieldset>
        {f.metodoPago !== 'Contra entrega' && <label className="check demo"><input type="checkbox" checked={f.simularFallo} onChange={(e) => set('simularFallo', e.target.checked)} /> Demo: simular que el banco rechaza el pago</label>}
        <div className="totals">
          <div><span>Productos</span><span>{money(total)}</span></div>
          {delivery > 0 && <div><span>Delivery (se paga al recibir)</span><span>{money(delivery)}</span></div>}
          <div className="grand"><span>Total</span><span>{money(total + delivery)}</span></div>
          <small className="muted">Precios incluyen IGV.</small>
        </div>
        {error && <div className="alert" role="alert">{error}</div>}
        <button className="btn big full" disabled={enviando}>{enviando ? 'Procesando…' : f.metodoPago === 'Contra entrega' ? 'Confirmar pedido' : `Pagar ${money(total)} (simulado)`}</button>
      </form>
    </div>
  )
}

const PASOS = ['Pendiente', 'Preparado', 'Entregado']

function Seguimiento({ codigo: codInicial = '', celularInicial = '', recien = false }) {
  const [codigo, setCodigo] = useState(codInicial)
  const [celular, setCelular] = useState(celularInicial)
  const [pedido, setPedido] = useState(null)
  const [error, setError] = useState('')
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

  const paso = pedido ? PASOS.indexOf(pedido.estado) : -1
  return (
    <div className="wrap narrow">
      {recien && pedido && (
        <div className="ok-box"><b>¡Pedido recibido!</b><p>Tu código es <b>{pedido.codigo}</b>. Guárdalo junto con tu celular para seguir tu pedido. {pedido.metodo_pago !== 'Contra entrega' && 'Pago confirmado (simulado).'}</p></div>
      )}
      {!codInicial && (
        <form className="card" onSubmit={(e) => { e.preventDefault(); consultar() }}>
          <h2>Seguir mi pedido</h2>
          <label className="field"><span>Código del pedido</span><input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="NS-1001" /></label>
          <label className="field"><span>Celular con el que compraste</span><input inputMode="numeric" value={celular} onChange={(e) => setCelular(e.target.value)} /></label>
          <button className="btn full" disabled={!codigo.trim() || !celular.trim()}>Consultar</button>
        </form>
      )}
      {error && <div className="alert" role="alert">{error}</div>}
      {pedido && (
        <section className="card">
          <div className="row-h"><h2>Pedido {pedido.codigo}</h2><span className={'tag ' + (pedido.estado === 'Cancelado' ? 'red' : pedido.estado === 'Entregado' ? 'green' : 'amber')}>{pedido.estado}</span></div>
          {pedido.estado === 'Cancelado' ? <p className="nota">Este pedido fue cancelado por la botica. Si pagaste, se te devolverá el monto. Escríbenos para más información.</p> : (
            <ol className="steps">
              {PASOS.map((s, i) => (
                <li key={s} className={i <= paso ? 'done' : ''}>
                  <b>{s === 'Pendiente' ? 'Recibido' : s === 'Preparado' ? (pedido.entrega === 'recojo' ? 'Listo para recoger' : 'En camino') : 'Entregado'}</b>
                  <small>{s === 'Pendiente' ? 'La botica recibió tu pedido' : s === 'Preparado' ? (pedido.entrega === 'recojo' ? 'Acércate con tu código' : 'El repartidor va hacia ti') : pedido.boleta ? `Boleta ${pedido.boleta}` : '¡Gracias por tu compra!'}</small>
                </li>
              ))}
            </ol>
          )}
          {pedido.items.map((i) => <div key={i.productoId} className="line simple"><span>{i.cantidad} × {i.nombre}</span><b>{money(i.cantidad * i.precio)}</b></div>)}
          <div className="line simple grand"><span>Total</span><b>{money(pedido.total)}</b></div>
          <p className="muted">{pedido.entrega === 'recojo' ? 'Recojo en tienda · Av. Principal 123' : 'Delivery'} · {pedido.metodo_pago}</p>
          {!['Entregado', 'Cancelado'].includes(pedido.estado) && <p className="muted s">Esta página se actualiza sola.</p>}
          <a className="btn sec" href="#/">Volver a la tienda</a>
        </section>
      )}
    </div>
  )
}
