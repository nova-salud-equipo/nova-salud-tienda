# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Público general de Lima que necesita medicamentos o productos de botica. Llegan sobre todo para comprar algo concreto (por nombre) sin hacer cola, y luego vuelven para seguir su pedido con código y celular. No se registran: se identifican solo con nombre y celular.

## Product Purpose
Tienda web pública de la botica **Nova Salud** (botica real). El cliente ve el catálogo con stock vendible, arma su carrito, hace su pedido con recojo en tienda o delivery y sigue su estado. Cada pedido aparece al instante en el ERP interno del personal. Éxito: el cliente encuentra lo que busca, confía en el precio y el stock, y completa el pedido sin dudas.

## Positioning
Es la misma botica del barrio, en línea: mismo precio que en mostrador, stock real (sin lotes vencidos ni unidades reservadas) y recojo en tienda en unos 30 minutos.

## Operating Context
- Uso frecuente desde el celular.
- Flujo: catálogo (búsqueda, categorías, ofertas, últimas unidades) → carrito guardado en el navegador → checkout → seguimiento con código (`NS-1001`) y celular, con actualización automática cada 8 s.
- La tienda solo usa rutas públicas de `nova-salud-api`; nunca ve costos, lotes ni datos de otros clientes.

## Capabilities and Constraints
- React 18 + Vite, navegación por hash (`#/`, `#/carrito`, `#/seguimiento`, `#/pedido/:codigo`), hosting estático.
- Entrega: recojo en tienda (gratis) o delivery (S/ 5.00). Productos con receta: solo recojo en tienda.
- Pago: Yape/Plin, tarjeta o contra entrega. En el código actual los pagos son **simulados** e incluyen la opción demo "simular rechazo del banco"; esa copy debe mantenerse mientras el pago siga siendo simulado.
- Ofertas: 20% de descuento sobre productos en promoción.
- Precios incluyen IGV.
- No hay imágenes reales de productos en la API.

## Brand Commitments
- Nombre: **Nova Salud**, "Botica en línea". Español peruano, trato de tú.
- Color de marca: verde azulado (teal). Se puede ajustar a una versión más oscura, más clara o más cálida, pero **no cambiar de tono** (nada de morado, azul, etc.).
- Dirección: Av. Principal 123, Lima · Lun a Sáb de 8:00 a 21:00.

## Evidence on Hand
- No hay logo, fotos de productos, testimonios, cifras de clientes ni premios. No inventarlos.

## Product Principles
1. Encontrar y pedir rápido: la búsqueda y el catálogo son lo primero.
2. Confianza antes que adorno: precio, stock, receta y costo de delivery siempre claros.
3. Sin sorpresas en el checkout: cada regla (receta, delivery) se explica antes de pagar.
4. Pensado para el celular.

## Accessibility & Inclusion
Público general, incluye personas mayores: texto legible, buen contraste, objetivos táctiles amplios y respeto a `prefers-reduced-motion`.
