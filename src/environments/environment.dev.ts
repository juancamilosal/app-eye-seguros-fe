const apiUrl = 'http://directus-tckww440wkcsos0o0csk8kwk.92.113.149.220.sslip.io/';

export const environment = {
  production: false,

  clientes: apiUrl + 'items/clientes',
  crearCliente: apiUrl + 'items/clientes',
  listarClientes: apiUrl + 'items/clientes',
  authLogin: apiUrl + 'auth/login',
  authMe: apiUrl + 'users/me',
};