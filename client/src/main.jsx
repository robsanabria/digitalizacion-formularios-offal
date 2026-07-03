import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import PrintView from './PrintView.jsx'
import { ToastProvider } from './components/Toast'

// Aplicar el tema guardado (claro por defecto) antes de renderizar, para evitar parpadeo.
try {
  if (localStorage.getItem('theme') === 'dark') document.documentElement.classList.add('dark');
} catch { /* noop */ }

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
