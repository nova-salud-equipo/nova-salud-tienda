import { money } from './api.js'

// Paleta de la tienda (mismos valores que los tokens de index.css).
const C = {
  deep: '#072E2A', teal: '#0E6B63', tealD: '#0A524C', live: '#5EE0B5',
  onDeepSoft: '#A6C6BE', ink: '#0B2421', soft: '#475D58', line: '#CBD9D3',
  ground: '#F3F6F4', panel: '#E5EDE9', mint: '#D3E9E2', blanco: '#FFFFFF',
  amber: '#8A4B08', amberL: '#FAEBD2', green: '#17663A', greenL: '#DDF1E4',
  red: '#B42318', redL: '#FBE4E1',
}
const ESTADOS = {
  pendiente: [C.amberL, C.amber],
  preparado: [C.mint, C.tealD],
  entregado: [C.greenL, C.green],
  cancelado: [C.redL, C.red],
}
// Cruz de cinco bloques del logo (CruzBloques en App.jsx).
const CRUZ = [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]]
const M = 16 // margen lateral (mm)
const W = 210 - M * 2 // ancho útil
const DER = M + W
const LIMITE = 272 // lo que pase de aquí va a la página siguiente (deja sitio al pie)
const PIE = 'Nova Salud · Botica en línea · Av. Principal 123, Lima · Lun a Sáb de 8:00 a 21:00'

const informado = (valor) => valor !== null && valor !== undefined && valor !== ''
// Intl usa espacios especiales (U+202F) que las fuentes estándar del PDF no tienen.
const fechaLima = (fecha) => fecha
  .toLocaleString('es-PE', { timeZone: 'America/Lima', dateStyle: 'medium', timeStyle: 'short' })
  .replace(/[  ]/g, ' ')

// Solo usa el pedido de seguimiento; nunca lee el carrito ni datos fiscales.
export async function crearComprobante(pedido) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  doc.setProperties({ title: `Comprobante ${pedido.codigo} · Nova Salud`, author: 'Nova Salud', subject: 'Comprobante de pedido (demostración)' })
  doc.setLineHeightFactor(1.35)

  const fuente = (tam, estilo = 'normal', color = C.ink) => {
    doc.setFont('helvetica', estilo)
    doc.setFontSize(tam)
    doc.setTextColor(color)
  }
  const lh = (tam) => tam * 0.3528 * 1.35 // alto de línea en mm
  const partir = (txt, ancho) => doc.splitTextToSize(String(txt), ancho)
  const derecha = { align: 'right' }
  const cruz = (x, y, lado, color) => {
    doc.setFillColor(color)
    for (const [cx, cy] of CRUZ) doc.rect(x + cx * lado, y + cy * lado, lado, lado, 'F')
  }

  // Encabezado reducido para las páginas 2 en adelante.
  const encabezadoContinuacion = () => {
    doc.setFillColor(C.deep)
    doc.rect(0, 0, 210, 15, 'F')
    cruz(M, 4, 2.4, C.live)
    fuente(10.5, 'bold', C.blanco)
    doc.text('Nova Salud', M + 10, 9.6)
    fuente(8, 'normal', C.onDeepSoft)
    doc.text(`Comprobante ${pedido.codigo} · continuación`, DER, 9.6, derecha)
    return 26
  }
  let y = 0
  const espacio = (alto) => {
    if (y + alto > LIMITE) { doc.addPage(); y = encabezadoContinuacion() }
  }

  /* ---------- Encabezado ---------- */
  doc.setFillColor(C.deep)
  doc.rect(0, 0, 210, 42, 'F')
  doc.setFillColor(C.teal)
  doc.rect(0, 42, 210, 1.4, 'F')
  cruz(M, 13, 4.6, C.live)
  fuente(19, 'bold', C.blanco)
  doc.text('Nova Salud', M + 19, 20)
  fuente(9, 'normal', C.onDeepSoft)
  doc.text('Botica en línea', M + 19, 26)
  fuente(7.5, 'bold', C.onDeepSoft)
  doc.text('COMPROBANTE DE PEDIDO', DER, 15.5, derecha)
  fuente(17, 'bold', C.blanco)
  doc.text(String(pedido.codigo), DER, 23.5, derecha)
  fuente(8, 'normal', C.onDeepSoft)
  doc.text(`Generado el ${fechaLima(new Date())}`, DER, 29.5, derecha)
  y = 53

  /* ---------- Aviso de demostración ---------- */
  const avisos = ['Los pagos de esta tienda son simulados.']
  if (!pedido.boleta) avisos.push('La boleta oficial se emite al entregar el pedido.')
  fuente(8.5)
  const cuerpoAviso = partir(avisos.join(' '), W - 12)
  const altoAviso = 10.5 + (cuerpoAviso.length - 1) * lh(8.5) + 4
  doc.setFillColor(C.amberL)
  doc.rect(M, y, W, altoAviso, 'F')
  doc.setFillColor(C.amber)
  doc.rect(M, y, 1.2, altoAviso, 'F')
  fuente(8.5, 'bold', C.amber)
  doc.text('DOCUMENTO DE DEMOSTRACIÓN · SIN VALIDEZ TRIBUTARIA', M + 6, y + 6)
  fuente(8.5, 'normal', C.amber)
  doc.text(cuerpoAviso, M + 6, y + 10.5)
  y += altoAviso + 8

  /* ---------- Datos del pedido ---------- */
  const fecha = pedido.fecha || pedido.created_at
  const fechaPedido = informado(fecha) ? new Date(fecha) : null
  const entrega = pedido.entrega === 'recojo' ? 'Recojo en tienda' : pedido.entrega === 'delivery' ? 'Delivery' : 'No registrada'
  const filas = [
    [
      { e: 'Cliente', v: pedido.cliente?.nombre || pedido.cliente_nombre || pedido.nombre || 'No registrado', fuerte: true },
      { e: 'Fecha del pedido', v: fechaPedido && !Number.isNaN(fechaPedido.getTime()) ? fechaLima(fechaPedido) : 'No registrada' },
      { e: 'Estado', v: pedido.estado || 'No registrado', pill: true },
    ],
    [
      { e: 'Método de pago', v: pedido.metodo_pago || 'No registrado' },
      { e: 'Entrega', v: entrega },
      ...(pedido.boleta ? [{ e: 'N.° de boleta', v: pedido.boleta, fuerte: true }] : []),
    ],
  ]
  if (pedido.entrega === 'delivery' && pedido.direccion) filas.push([{ e: 'Dirección de entrega', v: pedido.direccion, completa: true }])

  const pad = 6
  const separacion = 6
  const colW = (W - pad * 2 - separacion * 2) / 3
  fuente(10, 'bold')
  const lineasFilas = filas.map((fila) => fila.map((c) => (c.pill ? [c.v] : partir(c.v, c.completa ? W - pad * 2 : colW))))
  const altosFilas = lineasFilas.map((fila) => 5.4 + (Math.max(...fila.map((l) => l.length)) - 1) * lh(10) + 1.5)
  const altoPanel = pad + 2.6 + altosFilas.reduce((a, b) => a + b, 0) + (filas.length - 1) * 4.5 + pad - 1.5
  doc.setFillColor(C.ground)
  doc.setDrawColor(C.line)
  doc.setLineWidth(0.3)
  doc.rect(M, y, W, altoPanel, 'FD')
  let yy = y + pad + 2.6
  filas.forEach((fila, f) => {
    fila.forEach((c, i) => {
      const x = M + pad + i * (colW + separacion)
      fuente(7, 'bold', C.soft)
      doc.text(c.e.toUpperCase(), x, yy)
      if (c.pill) {
        const [fondo, tinta] = ESTADOS[String(c.v).toLowerCase()] || [C.panel, C.soft]
        fuente(8.5, 'bold', tinta)
        const ancho = doc.getTextWidth(c.v) + 6
        doc.setFillColor(fondo)
        doc.roundedRect(x, yy + 1.7, ancho, 5.6, 2.8, 2.8, 'F')
        doc.text(c.v, x + 3, yy + 5.65)
      } else {
        fuente(10, c.fuerte ? 'bold' : 'normal', C.ink)
        doc.text(lineasFilas[f][i], x, yy + 5.4)
      }
    })
    yy += altosFilas[f] + 4.5
  })
  y += altoPanel + 11

  /* ---------- Detalle de productos ---------- */
  const COL = { cant: M + 116, unit: M + 146, sub: DER - 4 }
  const anchoNombre = COL.cant - 16 - (M + 4)
  const cabeceraTabla = () => {
    doc.setFillColor(C.teal)
    doc.rect(M, y, W, 8, 'F')
    fuente(7.5, 'bold', C.blanco)
    doc.text('PRODUCTO', M + 4, y + 5.2)
    doc.text('CANT.', COL.cant, y + 5.2, derecha)
    doc.text('P. UNITARIO', COL.unit, y + 5.2, derecha)
    doc.text('SUBTOTAL', COL.sub, y + 5.2, derecha)
    y += 8
  }
  espacio(30)
  fuente(11.5, 'bold', C.ink)
  doc.text('Detalle de productos', M, y)
  const nItems = pedido.items.length
  fuente(8.5, 'normal', C.soft)
  doc.text(`${nItems} ${nItems === 1 ? 'producto' : 'productos'}`, DER, y, derecha)
  y += 4
  cabeceraTabla()
  pedido.items.forEach((item, i) => {
    fuente(9.5, 'normal', C.ink)
    const nombre = partir(item.nombre, anchoNombre)
    const alto = 6.3 + (nombre.length - 1) * lh(9.5) + 3.2
    if (y + alto > LIMITE) { doc.addPage(); y = encabezadoContinuacion(); cabeceraTabla() }
    if (i % 2) {
      doc.setFillColor(C.ground)
      doc.rect(M, y, W, alto, 'F')
    }
    const base = y + 6.3
    fuente(9.5, 'normal', C.ink)
    doc.text(nombre, M + 4, base)
    doc.text(String(item.cantidad), COL.cant, base, derecha)
    doc.text(money(item.precio), COL.unit, base, derecha)
    fuente(9.5, 'bold', C.ink)
    doc.text(money(Math.round(item.cantidad * item.precio * 100) / 100), COL.sub, base, derecha)
    y += alto
    doc.setDrawColor(C.line)
    doc.setLineWidth(0.2)
    doc.line(M, y, DER, y)
  })

  /* ---------- Totales y notas ---------- */
  const subtotal = Math.round(pedido.items.reduce((suma, item) => suma + item.cantidad * item.precio, 0) * 100) / 100
  const lineasTotal = [['Subtotal de productos', money(subtotal)]]
  if (pedido.entrega === 'delivery') {
    // No deducir el envío del total ni volver a sumarlo: la API define su alcance.
    const cargo = pedido.costo_delivery
    lineasTotal.push(['Delivery (se paga al recibir)', informado(cargo) ? money(cargo) : 'No registrado'])
  } else if (pedido.entrega === 'recojo') {
    lineasTotal.push(['Recojo en tienda', 'Sin costo'])
  }
  const notas = pedido.entrega === 'delivery'
    ? ['El delivery se paga al recibir el pedido y no se vuelve a sumar al total.']
    : pedido.entrega === 'recojo'
      ? ['Recoge tu pedido en Av. Principal 123, Lima, de lunes a sábado de 8:00 a 21:00.', `Ten a la mano tu código ${pedido.codigo}.`]
      : []
  notas.push('Gracias por comprar en Nova Salud.')

  const anchoCaja = 80
  const xCaja = DER - anchoCaja
  const anchoNotas = xCaja - M - 10
  fuente(8.5)
  const lineasNotas = partir(notas.join(' '), anchoNotas)
  const altoCaja = lineasTotal.length * 7 + 4 + 14
  y += 8
  espacio(Math.max(altoCaja, 8 + lineasNotas.length * lh(8.5)))

  fuente(7, 'bold', C.soft)
  doc.text('NOTAS', M, y + 4)
  fuente(8.5, 'normal', C.soft)
  doc.text(lineasNotas, M, y + 9.5)

  let yt = y + 4
  for (const [etiqueta, valor] of lineasTotal) {
    fuente(9, 'normal', C.soft)
    doc.text(etiqueta, xCaja + 4, yt)
    fuente(9, 'bold', C.ink)
    doc.text(valor, DER - 4, yt, derecha)
    yt += 7
  }
  doc.setFillColor(C.deep)
  doc.rect(xCaja, yt - 2, anchoCaja, 14, 'F')
  fuente(8, 'bold', C.onDeepSoft)
  doc.text('TOTAL DEL PEDIDO', xCaja + 4, yt + 6.6)
  fuente(15, 'bold', C.blanco)
  doc.text(informado(pedido.total) ? money(pedido.total) : 'No registrado', DER - 4, yt + 7.4, derecha)

  /* ---------- Pie de página ---------- */
  const paginas = doc.getNumberOfPages()
  for (let p = 1; p <= paginas; p++) {
    doc.setPage(p)
    doc.setDrawColor(C.line)
    doc.setLineWidth(0.3)
    doc.line(M, 281, DER, 281)
    fuente(7.5, 'normal', C.soft)
    doc.text(PIE, M, 286.5)
    doc.text(`Página ${p} de ${paginas}`, DER, 286.5, derecha)
  }
  return doc
}

export async function descargarComprobante(pedido) {
  const doc = await crearComprobante(pedido)
  const codigo = String(pedido.codigo).replace(/[^a-zA-Z0-9_-]/g, '_')
  await doc.save(`comprobante-${codigo}.pdf`, { returnPromise: true })
}
