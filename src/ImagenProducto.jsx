import { useState } from 'react'

// Las claves son los IDs que entrega la API. Las rutas parten de public/.
const IMAGENES = {
  // '1': '/images/productos/producto-1.webp',
}

export default function ImagenProducto({ producto }) {
  const ruta = IMAGENES[producto.id] || producto.imagen
  const [fallida, setFallida] = useState(null)
  return <div className="prod-img">
    {ruta && ruta !== fallida
      ? <img src={ruta} alt={producto.nombre} loading="lazy" onError={() => setFallida(ruta)} />
      : <span aria-hidden="true">{producto.nombre.slice(0, 2)}</span>}
  </div>
}
