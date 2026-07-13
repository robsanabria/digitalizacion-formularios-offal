import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import PrintView from './PrintView.jsx'
import { ToastProvider } from './components/Toast'

// Aplicar el tema antes de renderizar, para evitar parpadeo.
// Identidad Offal: navy (oscuro) por defecto; solo modo claro si el usuario lo eligió.
try {
  if (localStorage.getItem('theme') !== 'light') document.documentElement.classList.add('dark');
} catch { document.documentElement.classList.add('dark'); }

// Ruta interna de impresión (la usa Puppeteer para generar el PDF).
const isPrint = window.location.pathname.startsWith('/print/');

createRoot(document.getElementById('root')).render(
  isPrint ? (
    <PrintView />
  ) : (
    <StrictMode>
      <ToastProvider>
        <App />
      </ToastProvider>
    </StrictMode>
  ),
)
