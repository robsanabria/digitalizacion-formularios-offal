const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'No autenticado' });
        }
        if (!allowedRoles.includes(req.user.Rol)) {
            return res.status(403).json({ 
                error: 'No autorizado', 
                detalle: `Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}` 
            });
        }
        next();
    };
};

module.exports = { checkRole };
