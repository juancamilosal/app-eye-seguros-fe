const apiUrl = 'https://api.eyeseguros.com/';

export const environment = {
  production: false,
  clientes: apiUrl + 'items/clientes',
  polizas: apiUrl + 'items/polizas',
  aseguradoras: apiUrl + 'items/aseguradoras',
  lista_tarea: apiUrl + 'items/lista_tareas',
  seguridad: {
    login: apiUrl + 'auth/login',
    logout: apiUrl + 'auth/logout',
    refresh: apiUrl + 'auth/refresh',
    me: apiUrl + 'users/me',
  },
};
