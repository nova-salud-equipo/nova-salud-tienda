# nova-salud-tienda

Tienda web pública de la botica **Nova Salud**. Los clientes ven el catálogo, arman su carrito, hacen un pedido con **pago simulado** y siguen su estado. Cada pedido aparece al instante en el ERP interno.

| Repo | Qué es |
|---|---|
| [nova-salud-api](https://github.com/nova-salud-equipo/nova-salud-api) | Reglas de negocio y base de datos |
| [nova-salud-erp](https://github.com/nova-salud-equipo/nova-salud-erp) | Panel interno para el personal |
| **nova-salud-tienda** (este) | Tienda web pública |

## Tecnologías
React 18 + Vite 5. Sin login para el cliente: se identifica con su nombre y celular.

## Cómo ejecutarlo
1. Ten la API funcionando (ver su README).
2. `npm install`
3. Copia `.env.example` como `.env` y pon la URL de la API en `VITE_API_URL`.
4. `npm run dev` → http://localhost:5174

## Funciones
- Catálogo con búsqueda, categorías, ofertas y aviso de últimas unidades (solo stock vendible: sin lotes vencidos ni unidades reservadas).
- Carrito guardado en el navegador.
- Checkout con recojo en tienda o delivery, y pago Yape/Plin, tarjeta o contra entrega, todos **simulados**. La opción "simular rechazo del banco" sirve para mostrar el caso de error en la demo.
- Productos con receta: solo recojo en tienda.
- Seguimiento con código (`NS-1001`) y celular, con actualización automática.

La tienda solo usa rutas públicas de la API y nunca ve costos, lotes ni datos de otros clientes.

## Variables de entorno
| Variable | Para qué sirve |
|---|---|
| `VITE_API_URL` | URL de la API, sin `/api` al final |

## Despliegue sugerido
Vercel o Netlify: build `npm run build`, carpeta `dist`, y `VITE_API_URL` con la URL pública de la API. Agrega el dominio resultante a `CORS_ORIGINS` en la API.
