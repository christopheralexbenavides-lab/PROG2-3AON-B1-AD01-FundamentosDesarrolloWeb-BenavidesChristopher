/**
 * Programación II - Instituto Superior Tecnológico Cordillera
 * Sistema de Mantenimiento Automotriz - Frontend CRUD & Control de Roles
 */

// 1. Usuarios Predefinidos
const USUARIOS = [
  { id: 1, email: "cliente1@taller.com", pass: "123456", nombre: "Juan Pérez", rol: "Cliente", activo: true },
  { id: 2, email: "cliente2@taller.com", pass: "123456", nombre: "Maria López", rol: "Cliente", activo: true },
  { id: 3, email: "admin@taller.com", pass: "admin123", nombre: "Carlos Ramos (Admin)", rol: "Administrador", activo: true },
  { id: 4, email: "bloqueado@taller.com", pass: "123456", nombre: "Usuario Inactivo", rol: "Cliente", activo: false }
];

// Estados válidos
const ESTADOS = ["Pendiente", "En revisión", "En proceso", "Finalizado", "Cancelado"];

// Variables de estado global
let currentUser = null;
let solicitudes = JSON.parse(localStorage.getItem("solicitudes_mantenimiento")) || [
  {
    id: 101,
    clienteId: 1,
    clienteNombre: "Juan Pérez",
    telefono: "0991112223",
    placa: "PBX-1234",
    marca: "Toyota",
    modelo: "Yaris",
    anio: 2018,
    km: 45000,
    servicio: "Mantenimiento Preventivo",
    fecha: "2026-11-15",
    horario: "Mañana (08:00 - 12:00)",
    grua: false,
    observaciones: "Ruido leve en motor",
    estado: "Pendiente"
  }
];

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
  guardarEnLocalStorage();
  setupEventListeners();
  renderApp();
});

function guardarEnLocalStorage() {
  localStorage.setItem("solicitudes_mantenimiento", JSON.stringify(solicitudes));
}

// 2. Configuración de Eventos y Manejo del DOM
function setupEventListeners() {
  document.getElementById("form-login").addEventListener("submit", handleLogin);
  document.getElementById("form-solicitud").addEventListener("submit", handleRegistroSolicitud);
}

function showSection(sectionId) {
  const secciones = document.querySelectorAll(".content-section");
  secciones.forEach(sec => sec.style.display = "none");
  
  const target = document.getElementById(`sec-${sectionId}`);
  if (target) target.style.display = "block";

  // Control de rendering por sección
  if (sectionId === "mis-mantenimientos" && currentUser) {
    renderMisSolicitudes();
  } else if (sectionId === "admin" && currentUser?.rol === "Administrador") {
    renderAdminSolicitudes();
  } else if (sectionId === "solicitud") {
    prepararFormularioSolicitud();
  }
}

// 3. Control de Autenticación y Roles
function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const pass = document.getElementById("login-password").value.trim();

  // Caso de Prueba 2: Validar Credenciales
  const user = USUARIOS.find(u => u.email === email && u.pass === pass);

  if (!user) {
    Swal.fire("Error de Autenticación", "Credenciales incorrectas.", "error");
    return;
  }

  if (!user.activo) {
    Swal.fire("Acceso Denegado", "Esta cuenta se encuentra deshabilitada.", "warning");
    return;
  }

  currentUser = user;
  const modalElem = document.getElementById("loginModal");
  const modal = bootstrap.Modal.getInstance(modalElem);
  modal.hide();
  document.getElementById("form-login").reset();

  Swal.fire("Bienvenido", `Sesión iniciada como ${user.nombre}`, "success");
  renderApp();

  // Redirección inicial según rol (Caso de Prueba 1)
  if (currentUser.rol === "Cliente") {
    showSection("mis-mantenimientos");
  } else {
    showSection("admin");
  }
}

function logout() {
  currentUser = null;
  renderApp();
  showSection("inicio");
  Swal.fire("Sesión Cerrada", "Ha salido del sistema.", "info");
}

function renderApp() {
  const navSolicitud = document.getElementById("nav-solicitud");
  const navMisMantenimientos = document.getElementById("nav-mis-mantenimientos");
  const navAdmin = document.getElementById("nav-admin");
  const btnLoginModal = document.getElementById("btn-login-modal");
  const btnLogout = document.getElementById("btn-logout");
  const userDisplay = document.getElementById("user-display");

  if (currentUser) {
    btnLoginModal.style.display = "none";
    btnLogout.style.display = "inline-block";
    userDisplay.textContent = `${currentUser.nombre} (${currentUser.rol})`;

    navSolicitud.style.display = "block";

    if (currentUser.rol === "Cliente") {
      navMisMantenimientos.style.display = "block";
      navAdmin.style.display = "none";
    } else if (currentUser.rol === "Administrador") {
      navMisMantenimientos.style.display = "block";
      navAdmin.style.display = "block";
    }
  } else {
    btnLoginModal.style.display = "inline-block";
    btnLogout.style.display = "none";
    userDisplay.textContent = "";

    navSolicitud.style.display = "none";
    navMisMantenimientos.style.display = "none";
    navAdmin.style.display = "none";
  }
}

function handleSolicitudDirecta() {
  if (!currentUser) {
    Swal.fire("Atención", "Debe iniciar sesión para solicitar un mantenimiento.", "info");
    const modal = new bootstrap.Modal(document.getElementById("loginModal"));
    modal.show();
  } else {
    showSection("solicitud");
  }
}

// 4. Validaciones de Formulario (Caso de Prueba 3)
function validarSolicitud(data) {
  // Expresión regular para placas de Ecuador (ej: PBA-1234 o PBX-123)
  const regexPlaca = /^[A-Z]{3}-\d{3,4}$/;
  // Expresión regular para teléfono móvil (10 dígitos)
  const regexTelefono = /^09\d{8}$/;

  if (!regexTelefono.test(data.telefono)) {
    return "El teléfono debe contener 10 dígitos y comenzar con 09.";
  }

  if (!regexPlaca.test(data.placa)) {
    return "La placa debe cumplir el formato ecuatoriano válido (Ej: PBX-1234).";
  }

  const anioActual = new Date().getFullYear();
  if (isNaN(data.anio) || data.anio < 1990 || data.anio > anioActual) {
    return `El año del vehículo debe estar entre 1990 y ${anioActual}.`;
  }

  if (isNaN(data.km) || data.km < 0 || data.km > 500000) {
    return "El kilometraje debe ser un número válido entre 0 y 500,000 KM.";
  }

  if (!data.fecha) {
    return "Debe seleccionar una fecha para el mantenimiento.";
  }

  const fechaSeleccionada = new Date(data.fecha);
  const fechaHoy = new Date();
  fechaHoy.setHours(0, 0, 0, 0);

  if (fechaSeleccionada < fechaHoy) {
    return "La fecha seleccionada no puede ser anterior al día de hoy.";
  }

  return null;
}

// 5. Registro de Solicitudes (Caso de Prueba 4)
function prepararFormularioSolicitud() {
  const divClienteSelect = document.getElementById("div-cliente-select");
  const selectCliente = document.getElementById("sol-cliente");

  if (currentUser?.rol === "Administrador") {
    divClienteSelect.style.display = "block";
    selectCliente.innerHTML = "";
    
    // Filtrar únicamente los clientes
    const clientes = USUARIOS.filter(u => u.rol === "Cliente");
    for (const c of clientes) {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = `${c.nombre} (${c.email})`;
      selectCliente.appendChild(opt);
    }
  } else {
    divClienteSelect.style.display = "none";
  }
}

function handleRegistroSolicitud(e) {
  e.preventDefault();

  let idCliente = currentUser.id;
  let nombreCliente = currentUser.nombre;

  if (currentUser.rol === "Administrador") {
    const selectCliente = document.getElementById("sol-cliente");
    idCliente = parseInt(selectCliente.value);
    const clienteObj = USUARIOS.find(u => u.id === idCliente);
    if (clienteObj) nombreCliente = clienteObj.nombre;
  }

  const radioHorario = document.querySelector('input[name="horario"]:checked');

  const nuevaSolicitud = {
    id: Date.now(),
    clienteId: idCliente,
    clienteNombre: nombreCliente,
    telefono: document.getElementById("sol-telefono").value.trim(),
    placa: document.getElementById("sol-placa").value.trim().toUpperCase(),
    marca: document.getElementById("sol-marca").value.trim(),
    modelo: document.getElementById("sol-modelo").value.trim(),
    anio: parseInt(document.getElementById("sol-anio").value),
    km: parseInt(document.getElementById("sol-km").value),
    servicio: document.getElementById("sol-servicio").value,
    fecha: document.getElementById("sol-fecha").value,
    horario: radioHorario ? radioHorario.value : "Mañana",
    grua: document.getElementById("sol-grua").checked,
    observaciones: document.getElementById("sol-observaciones").value.trim(),
    estado: "Pendiente"
  };

  const error = validarSolicitud(nuevaSolicitud);
  if (error) {
    Swal.fire("Error en Formulario", error, "error");
    return;
  }

  solicitudes.push(nuevaSolicitud);
  guardarEnLocalStorage();

  document.getElementById("form-solicitud").reset();
  Swal.fire("Solicitud Guardada", "El turno ha sido registrado correctamente.", "success");

  if (currentUser.rol === "Cliente") {
    showSection("mis-mantenimientos");
  } else {
    showSection("admin");
  }
}

// 6. Consultas e Interfaz de Clientes
function renderMisSolicitudes() {
  const tbody = document.getElementById("tbody-mis-solicitudes");
  tbody.innerHTML = "";

  // filter(): Filtrar solo los registros pertenecientes al cliente actual
  const misMants = solicitudes.filter(s => s.clienteId === currentUser.id);

  if (misMants.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center">No registra solicitudes actualmente.</td></tr>`;
    return;
  }

  // map(): Mapear objetos a filas HTML
  misMants.forEach(s => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${s.id}</td>
      <td>${s.marca} ${s.modelo} (${s.anio})</td>
      <td><span class="badge bg-secondary">${s.placa}</span></td>
      <td>${s.servicio}</td>
      <td>${s.fecha}<br><small class="text-muted">${s.horario}</small></td>
      <td><span class="badge ${obtenerClaseEstado(s.estado)}">${s.estado}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// 7. Módulo CRUD y Control Administrativo (Casos de Prueba 5 y 6)
function renderAdminSolicitudes() {
  // Caso de Prueba 5: Bloqueo directo si no es admin
  if (currentUser?.rol !== "Administrador") {
    Swal.fire("Acceso Denegado", "No posee privilegios de administrador.", "error");
    showSection("inicio");
    return;
  }

  const tbody = document.getElementById("tbody-admin-solicitudes");
  tbody.innerHTML = "";

  if (solicitudes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center">No existen registros en el sistema.</td></tr>`;
    return;
  }

  solicitudes.forEach(s => {
    const tr = document.createElement("tr");

    // Opciones del selector de estado
    const opcionesEstado = ESTADOS.map(est => 
      `<option value="${est}" ${s.estado === est ? 'selected' : ''}>${est}</option>`
    ).join("");

    tr.innerHTML = `
      <td>${s.id}</td>
      <td>${s.clienteNombre}</td>
      <td>${s.marca} ${s.modelo}<br><span class="badge bg-secondary">${s.placa}</span></td>
      <td>${s.servicio}</td>
      <td>${s.fecha}<br><small class="text-muted">${s.horario}</small></td>
      <td>
        <select class="form-select form-select-sm" onchange="cambiarEstado(${s.id}, this.value)">
          ${opcionesEstado}
        </select>
      </td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="eliminarSolicitud(${s.id})">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function cambiarEstado(id, nuevoEstado) {
  // find(): Buscar la solicitud requerida
  const sol = solicitudes.find(s => s.id === id);
  if (sol) {
    sol.estado = nuevoEstado;
    guardarEnLocalStorage();
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Estado actualizado correctamente',
      showConfirmButton: false,
      timer: 2000
    });
  }
}

function eliminarSolicitud(id) {
  // SweetAlert2 confirmación antes de eliminar
  Swal.fire({
    title: '¿Confirmar eliminación?',
    text: `La solicitud #${id} será eliminada permanentemente.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      solicitudes = solicitudes.filter(s => s.id !== id);
      guardarEnLocalStorage();
      renderAdminSolicitudes();
      Swal.fire('Eliminado', 'La solicitud ha sido removida.', 'success');
    }
  });
}

function obtenerClaseEstado(estado) {
  switch (estado) {
    case "Pendiente": return "badge-pendiente";
    case "En revisión": return "badge-en-revision";
    case "En proceso": return "badge-en-proceso";
    case "Finalizado": return "badge-finalizado";
    case "Cancelado": return "badge-cancelado";
    default: return "bg-secondary";
  }
}