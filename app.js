class Usuario {
    constructor(nombre, usuario, contrasena) {
        this.nombre = nombre;
        this.usuario = usuario;
        this.contrasena = contrasena;
    }

    static crearCuenta(nombre, usuario, contrasena, rol) {
        if (localStorage.getItem(usuario)) {
            throw new Error('El usuario ya existe');
        }
        if (rol === 'administrador') {
            return new Administrador(nombre, usuario, contrasena);
        } else {
            return new UsuarioRegular(nombre, usuario, contrasena);
        }
    }

    registrar() {
        localStorage.setItem(this.usuario, JSON.stringify(this));
    }

    static iniciarSesion(usuario, contrasena) {
        const user = JSON.parse(localStorage.getItem(usuario));
        if (user && user.contrasena === contrasena) {
            return user.rol === 'administrador' ? new Administrador(user.nombre, user.usuario, user.contrasena) : new UsuarioRegular(user.nombre, user.usuario, user.contrasena);
        }
        return null;
    }
}

class UsuarioRegular extends Usuario {
    constructor(nombre, usuario, contrasena) {
        super(nombre, usuario, contrasena);
        this.rol = 'usuario';
    }

    crearReserva(reserva) {
        let reservas = JSON.parse(localStorage.getItem('reservas')) || [];
        reservas.push({ ...reserva, usuario: this.usuario });
        localStorage.setItem('reservas', JSON.stringify(reservas));
    }
}

class Administrador extends Usuario {
    constructor(nombre, usuario, contrasena) {
        super(nombre, usuario, contrasena);
        this.rol = 'administrador';
    }

    crearReserva(reserva) {
        let reservas = JSON.parse(localStorage.getItem('reservas')) || [];
        reservas.push(reserva);
        localStorage.setItem('reservas', JSON.stringify(reservas));
    }

    eliminarReserva(id) {
        let reservas = JSON.parse(localStorage.getItem('reservas')) || [];
        reservas = reservas.filter(reserva => reserva.id !== id);
        localStorage.setItem('reservas', JSON.stringify(reservas));
    }

    actualizarReserva(id, nuevaReserva) {
        let reservas = JSON.parse(localStorage.getItem('reservas')) || [];
        reservas = reservas.map(reserva => reserva.id === id ? { ...reserva, ...nuevaReserva } : reserva);
        localStorage.setItem('reservas', JSON.stringify(reservas));
    }
}

class Auth {
    static iniciarSesion(usuario, contrasena) {
        const user = Usuario.iniciarSesion(usuario, contrasena);
        if (user) {
            localStorage.setItem('sesion', JSON.stringify(user));
            return user;
        }
        return null;
    }

    static cerrarSesion() {
        localStorage.removeItem('sesion');
    }

    static obtenerUsuarioActual() {
        return JSON.parse(localStorage.getItem('sesion'));
    }
}

// Funciones para manipular el DOM
document.getElementById('formRegistro').addEventListener('submit', function(evento) {
    evento.preventDefault();
    const nombre = document.getElementById('nombre').value;
    const usuario = document.getElementById('usuario').value;
    const contrasena = document.getElementById('contrasena').value;
    const rol = document.getElementById('rol').value;

    try {
        const nuevoUsuario = Usuario.crearCuenta(nombre, usuario, contrasena, rol);
        nuevoUsuario.registrar();
        alert('Usuario registrado exitosamente');
    } catch (error) {
        alert(error.message);
    }
});

document.getElementById('formInicioSesion').addEventListener('submit', function(evento) {
    evento.preventDefault();
    const usuario = document.getElementById('usuarioLogin').value;
    const contrasena = document.getElementById('contrasenaLogin').value;

    const usuarioAutenticado = Auth.iniciarSesion(usuario, contrasena);
    if (usuarioAutenticado) {
        mostrarReservas();
        document.getElementById('userAuth').style.display = 'none';
        document.getElementById('panelReservas').style.display = 'block';
    } else {
        alert('Usuario o contraseña incorrectos');
    }
});

document.getElementById('btnCerrarSesion').addEventListener('click', function() {
    Auth.cerrarSesion();
    document.getElementById('userAuth').style.display = 'block';
    document.getElementById('panelReservas').style.display = 'none';
});

document.getElementById('btnCrearReserva').addEventListener('click', function() {
    const usuario = Auth.obtenerUsuarioActual();
    if (usuario) {
        const reserva = {
            id: Date.now(),
            descripcion: prompt('Ingrese la descripción de la reserva:')
        };

        if (usuario.rol === 'administrador') {
            new Administrador(usuario.nombre, usuario.usuario, usuario.contrasena).crearReserva(reserva);
        } else {
            new UsuarioRegular(usuario.nombre, usuario.usuario, usuario.contrasena).crearReserva(reserva);
        }

        mostrarReservas();
    } else {
        alert('Debe iniciar sesión para crear una reserva');
    }
});

function mostrarReservas() {
    const usuario = Auth.obtenerUsuarioActual();
    const reservas = JSON.parse(localStorage.getItem('reservas')) || [];
    const listaReservas = document.getElementById('listaReservas');
    listaReservas.innerHTML = '';

    reservas.forEach(reserva => {
        const li = document.createElement('li');
        li.textContent = reserva.descripcion;

        if (usuario.rol === 'administrador') {
            const btnEliminar = document.createElement('button');
            btnEliminar.textContent = 'Eliminar';
            btnEliminar.addEventListener('click', function() {
                new Administrador(usuario.nombre, usuario.usuario, usuario.contrasena).eliminarReserva(reserva.id);
                mostrarReservas();
            });

            const btnActualizar = document.createElement('button');
            btnActualizar.textContent = 'Actualizar';
            btnActualizar.addEventListener('click', function() {
                const nuevaDescripcion = prompt('Ingrese la nueva descripción de la reserva:', reserva.descripcion);
                if (nuevaDescripcion) {
                    new Administrador(usuario.nombre, usuario.usuario, usuario.contrasena).actualizarReserva(reserva.id, { descripcion: nuevaDescripcion });
                    mostrarReservas();
                }
            });

            li.appendChild(btnActualizar);
            li.appendChild(btnEliminar);
        }

        listaReservas.appendChild(li);
    });
}

window.onload = function() {
    const usuario = Auth.obtenerUsuarioActual();
    if (usuario) {
        document.getElementById('userAuth').style.display = 'none';
        document.getElementById('panelReservas').style.display = 'block';
        mostrarReservas();
    }
};