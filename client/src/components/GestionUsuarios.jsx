import React, { useState, useEffect } from 'react';
import { X, User, Shield, Users, Save, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useToast } from './Toast';

const GestionUsuarios = ({ isOpen, onClose }) => {
  const toast = useToast();
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
      toast.success("Rol de usuario actualizado correctamente");
    } catch (err) {
      toast.error("Error al actualizar rol: " + (err.response?.data?.error || err.message));
    } finally {
      setUpdating(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full h-full md:h-auto max-w-2xl md:max-h-[80vh] overflow-hidden flex flex-col p-4 md:p-8 relative rounded-none md:rounded-xl pb-24 md:pb-8">
        <button onClick={onClose} className="absolute top-4 right-4 md:top-6 md:right-6 text-text-muted hover:text-slate-900 dark:hover:text-white bg-black/20 md:bg-transparent rounded-full p-2 md:p-0 z-10">
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
                <div key={u.UsuarioId} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-black/[0.03] dark:bg-white/5 border border-border rounded-xl hover:bg-black/[0.06] dark:bg-white/10 transition-all gap-4 md:gap-0">
                  <div className="flex items-center gap-4 w-full md:w-auto">
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
                        <option value="CALIDAD">Calidad</option>
                        <option value="SISTEMAS">Sistemas</option>
                        <option value="ADMIN">Admin (Gestión)</option>
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-border flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-black/[0.06] dark:bg-white/10 hover:bg-black/[0.10] dark:bg-white/20 rounded-lg transition-all">
            Cerrar Panel
          </button>
        </div>
      </div>
    </div>
  );
};

export default GestionUsuarios;
