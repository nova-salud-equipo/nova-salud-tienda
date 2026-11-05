import { money } from './api.js'

const informado = (valor) => valor !== null && valor !== undefined && valor !== ''

// Solo usa el pedido de seguimiento; nunca lee el carrito ni datos fiscales.
export async function crearComprobante(pedido) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  const margen = 18
  const ancho = 174
  let y = 20
  const texto = (contenido, negrita = false) => {
    doc.setFont('helvetica', negrita ? 'bold' : 'normal')
    for (const linea of doc.splitTextToSize(String(contenido), ancho)) {
      if (y > 275) { doc.addPage(); y = 20 }
      doc.text(linea, margen, y)
      y += 6
    }
  }
  doc.setFontSize(10)
  // Cruz de cinco bloques de Tom (CruzBloques), con el color --teal actual.
  doc.setFillColor('#0E6B63')
  for (const [x, fila] of [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]]) {
    doc.rect(margen + x * 7, y + fila * 7, 7, 7, 'F')
  }
  y += 30
  texto('Nova Salud', true)
  texto('Comprobante de pedido de demostración', true)
  texto('SIN VALIDEZ TRIBUTARIA. Los pagos son simulados.')
  if (!pedido.boleta) texto('La boleta oficial se emite al entregar el pedido.')
  y += 4
  texto(`Pedido: ${pedido.codigo}`)
  texto(`Cliente: ${pedido.cliente?.nombre || pedido.cliente_nombre || pedido.nombre || 'No informado por la API'}`)
  const fecha = pedido.fecha || pedido.created_at
  const fechaPedido = informado(fecha) ? new Date(fecha) : null
  texto(`Fecha del pedido: ${fechaPedido && !Number.isNaN(fechaPedido.getTime()) ? fechaPedido.toLocaleString('es-PE', { timeZone: 'America/Lima' }) : 'No informada por la API'}`)
  texto(`PDF generado: ${new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })}`)
  if (pedido.boleta) texto(`Número de boleta: ${pedido.boleta}`)
  texto(`Estado: ${pedido.estado || 'No informado'}`)
  texto(`Método de pago: ${pedido.metodo_pago || 'No informado por la API'}`)
  texto(`Entrega: ${pedido.entrega === 'recojo' ? 'Recojo en tienda' : pedido.entrega === 'delivery' ? 'Delivery' : 'No informada por la API'}`)
  if (pedido.entrega === 'delivery' && pedido.direccion) texto(`Dirección: ${pedido.direccion}`)
  y += 5
  texto('Detalle de productos', true)
  for (const item of pedido.items) {
    y += 3
    texto(item.nombre, true)
    texto(`Cantidad: ${item.cantidad} | Precio unitario: ${money(item.precio)} | Subtotal: ${money(Math.round(item.cantidad * item.precio * 100) / 100)}`)
  }
  y += 6
  const subtotal = Math.round(pedido.items.reduce((suma, item) => suma + item.cantidad * item.precio, 0) * 100) / 100
  texto(`Subtotal de productos: ${money(subtotal)}`)
  if (pedido.entrega === 'delivery') {
    // No deducir el envío del total ni volver a sumarlo: la API define su alcance.
    const cargo = pedido.costo_delivery
    texto(`Delivery (se paga al recibir): ${informado(cargo) ? money(cargo) : 'importe no informado por la API'}`)
  } else if (pedido.entrega === 'recojo') {
    texto('Recojo en tienda: sin cargo de delivery')
  }
  texto(`Total registrado por la API: ${informado(pedido.total) ? money(pedido.total) : 'No informado'}`, true)
  if (pedido.entrega === 'delivery') texto('El delivery se paga al recibir; no se ha agregado nuevamente al total registrado.')
  return doc
}

export async function descargarComprobante(pedido) {
  const doc = await crearComprobante(pedido)
  const codigo = String(pedido.codigo).replace(/[^a-zA-Z0-9_-]/g, '_')
  await doc.save(`comprobante-${codigo}.pdf`, { returnPromise: true })
}
