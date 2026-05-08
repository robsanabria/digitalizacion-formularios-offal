import React, { useState, useEffect } from 'react';
import { X, User, Shield, Users, Save, Loader2 } from 'lucide-react';
import axios from 'axios';

const GestionUsuarios = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/users');
      setUsers(res.data);
    } catch (err) {
      console.error("Error al cargar usuarios", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setUpdating(userId);
    try {
      await axios.put(`/api/users/${userId}/role`, { rol: newRole });
      setUsers(users.map(u => u.UsuarioId === userId ? { ...u, Rol: newRole } : u));
    } catch (err) {
      alert("Error al actualizar rol");
    } finally {
      setUpdating(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col p-8 relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-text-muted hover:text-white">
          <X size={24} />
        </button>

        <header className="mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Users className="text-primary" size={28} />
            Gestión de Usuarios
          </h2>
          <p className="text-text-muted mt-1">Asigna roles para controlar los accesos al sistema</p>
        </header>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="animate-spin text-primary" size={40} />
              <p>Cargando lista de usuarios...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {users.map((u) => (
                <div key={u.UsuarioId} className="flex items-center justify-between p-4 bg-white/5 border border-border rounded-xl hover:bg-white/10 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                      {u.NombreUsuario.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold">{u.NombreUsuario}</p>
                      <p className="text-xs text-text-muted">{u.Email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {updating === u.UsuarioId ? (
                      <Loader2 className="animate-spin text-primary" size={20} />
                    ) : (
                      <select 
                        className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary transition-all"
                        value={u.Rol}
                        onChange={(e) => handleRoleChange(u.UsuarioId, e.target.value)}
                      >
                        <option value="SOLICITANTE">Solicitante</option>
                        <option value="CALIDAD">Calidad</option>
                        <option value="SISTEMAS">Sistemas (Admin)</option>
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-border flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all">
            Cerrar Panel
          </button>
        </div>
      </div>
    </div>
  );
};

export default GestionUsuarios;
