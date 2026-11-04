import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { CarritoProvider } from './carrito.jsx'
import './styles.css'

// Las entradas animadas solo se activan si hay JS y el usuario no pidió menos movimiento.
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) document.documentElement.classList.add('js')

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CarritoProvider>
      <App />
    </CarritoProvider>
  </React.StrictMode>
)
