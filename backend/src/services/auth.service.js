const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');

const login = async (username, password) => {
    const user = await userRepository.findByUsername(username);
    console.log('user', user);
    if (!user) {
        throw new Error('Usuario no encontrado');
    }

    // Intentar comparar con bcrypt
    let isMatch = false;
    try {
        isMatch = await bcrypt.compare(password, user.clave);
    } catch (e) {
        // Si bcrypt falla (por ejemplo, clave no está hasheada), fallback a comparación directa
        isMatch = user.clave === password;
    }
    // Si bcrypt.compare devuelve false, también fallback a comparación directa
    if (!isMatch) {
        isMatch = user.clave === password;
    }
    if (!isMatch) {
        throw new Error('Contraseña incorrecta');
    }

    // Determinar rol basado en nivel_app según regla:
    // MUNICIPAL o ADMIN -> admin
    // Otros -> cuadrilla
    const appRole = (user.nivel_app === 'MUNICIPAL' || user.nivel_app === 'ADMIN')
        ? 'admin'
        : 'cuadrilla';

    const token = jwt.sign(
        {
            id: user.unica,
            username: user.usuario,
            role: appRole,
            crewId: user.unica
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );

    return {
        token,
        user: {
            id: user.unica,
            name: `${user.nombre} ${user.apellido}`,
            username: user.usuario,
            role: appRole,
            nivel_app: user.nivel_app,
            niveles: user.niveles,
            crewId: user.unica
        }
    };
};

module.exports = {
    login
};
