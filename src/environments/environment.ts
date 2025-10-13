const apiUrl = 'http://directus-tckww440wkcsos0o0csk8kwk.92.113.149.220.sslip.io/';

export const environment = {
  production: true,
  clientes: apiUrl + 'items/clientes',
  polizas: apiUrl + 'items/polizas',
  seguridad: {
    login: apiUrl + 'auth/login',
    logout: apiUrl + 'auth/logout',
    refresh: apiUrl + 'auth/refresh',
    me: apiUrl + 'users/me',
  },
};
