import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { SourceTextModule } from 'node:vm'

// Proporciona las variables que Vite inyecta al ejecutar la aplicación.
const api = new SourceTextModule(await readFile(new URL('../src/api.js', import.meta.url), 'utf8'), {
  initializeImportMeta(meta) { meta.env = {} },
})
await api.link(() => { throw new Error('Import inesperado') })
await api.evaluate()
const modulo = new SourceTextModule(await readFile(new URL('../src/comprobante.js', import.meta.url), 'utf8'), {
  importModuleDynamically: (nombre) => import(nombre),
})
await modulo.link(() => api)
await modulo.evaluate()
const pedido = {
  codigo: 'NS-1001', cliente: { nombre: 'Ana Prueba' }, fecha: '2026-11-04T15:00:00Z',
  estado: 'Pendiente', entrega: 'recojo', metodo_pago: 'Yape / Plin', total: 25,
  items: [{ productoId: 1, nombre: 'Producto de prueba', cantidad: 2, precio: 12.5 }],
}

test('genera un PDF con logo, cliente, productos, importes y aviso de demostración', async () => {
  const doc = await modulo.namespace.crearComprobante(pedido)
  const pdf = doc.output()
  assert.ok(pdf.startsWith('%PDF-'))
  for (const texto of ['Ana Prueba', 'NS-1001', 'Producto de prueba', 'Cantidad: 2', 'S/ 12.50', 'S/ 25.00', 'Yape / Plin', 'SIN VALIDEZ TRIBUTARIA', 'Nova Salud']) assert.ok(pdf.includes(texto), texto)
  assert.equal((pdf.match(/ re\n/g) || []).length, 5, 'Logo vectorial de cinco bloques')
})

test('incluye boleta y separa delivery sin duplicar el total de la API', async () => {
  const doc = await modulo.namespace.crearComprobante({ ...pedido, entrega: 'delivery', costo_delivery: 5, total: 30, boleta: 'B001-10' })
  const pdf = doc.output()
  assert.ok(pdf.includes('B001-10'))
  assert.ok(pdf.includes('Delivery \\(se paga al recibir\\): S/ 5.00'))
  assert.ok(pdf.includes('Total registrado por la API: S/ 30.00'))
  assert.ok(!pdf.includes('S/ 35.00'))
})

test('no inventa cliente, fecha ni cargo de delivery cuando faltan en la API', async () => {
  const doc = await modulo.namespace.crearComprobante({ ...pedido, cliente: undefined, fecha: undefined, entrega: 'delivery' })
  const pdf = doc.output()
  assert.ok(pdf.includes('Cliente: No informado por la API'))
  assert.ok(pdf.includes('Fecha del pedido: No informada por la API'))
  assert.ok(pdf.includes('importe no informado por la API'))
})

test('distribuye pedidos largos en varias páginas', async () => {
  const doc = await modulo.namespace.crearComprobante({ ...pedido, items: Array.from({ length: 100 }, () => pedido.items[0]), total: 2500 })
  assert.ok(doc.getNumberOfPages() > 1)
  assert.ok(doc.output().includes('S/ 2500.00'))
})
