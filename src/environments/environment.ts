const apiUrl = 'https://api.eyeseguros.com/';

export const environment = {
  production: true,
  clientes: apiUrl + 'items/clientes',
  polizas: apiUrl + 'items/polizas',
  aseguradoras: apiUrl + 'items/aseguradoras',
  asesores: apiUrl + 'items/asesores',
  asesores_aseguradoras: apiUrl + 'items/asesores_aseguradoras',
  lista_tarea: apiUrl + 'items/lista_tareas',
  seguridad: {
    login: apiUrl + 'auth/login',
    logout: apiUrl + 'auth/logout',
    refresh: apiUrl + 'auth/refresh',
    me: apiUrl + 'users/me',
  },
};
