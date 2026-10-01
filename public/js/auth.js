// Gestión de Autenticación y Token JWT

const API_BASE = '/api';

const Auth = {
  getToken() {
    return localStorage.getItem('gallolete_token');
  },
  
  getUser() {
    const userStr = localStorage.getItem('gallolete_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  setSession(token, user) {
    localStorage.setItem('gallolete_token', token);
    localStorage.setItem('gallolete_user', JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem('gallolete_token');
    localStorage.removeItem('gallolete_user');
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  async fetchApi(url, options = {}) {
    options.headers = {
      ...this.getAuthHeaders(),
      ...(options.headers || {})
    };

    try {
      const response = await fetch(`${API_BASE}${url}`, options);
      const data = await response.json();
      
      if (response.status === 401 || response.status === 403) {
        if (data.mensaje && data.mensaje.includes('Token')) {
          this.clearSession();
          window.location.reload();
        }
      }
      return data;
    } catch (error) {
      console.error('API Error:', error);
      return { ok: false, mensaje: 'Error de conexión con el servidor.' };
    }
  }
};
