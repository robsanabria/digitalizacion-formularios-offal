import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

/**
 * Toggle de tema claro/oscuro. Agrega/quita la clase `dark` en <html> y persiste
 * la elección en localStorage. El modo claro es el predeterminado.
 */
export default function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch { /* noop */ }
  }, [dark]);

  return (
    <button
      onClick={() => setDark(d => !d)}
      title={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="mt-auto flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-text-muted hover:bg-black/[0.04] dark:hover:bg-white/5 hover:text-primary transition-all"
    >
      {dark ? <Sun size={20} /> : <Moon size={20} />}
      <span>{dark ? 'Modo claro' : 'Modo oscuro'}</span>
    </button>
  );
}
