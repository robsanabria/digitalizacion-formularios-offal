import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import PrintView from './PrintView.jsx'
import { ToastProvider } from './components/Toast'

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
