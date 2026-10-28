import apiClient from './client';

export const authApi = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  getMe: () => apiClient.get('/auth/me'),
};

export const departmentApi = {
  getAll: () => apiClient.get('/departments'),
  getById: (id) => apiClient.get(`/departments/${id}`),
  create: (dept) => apiClient.post('/departments', dept),
  update: (id, dept) => apiClient.put(`/departments/${id}`, dept),
  delete: (id) => apiClient.delete(`/departments/${id}`),
};

export const userApi = {
  getAll: (role) => apiClient.get('/users', { params: { role } }),
  updateStatus: (id, status) => apiClient.patch(`/users/${id}/status`, { status }),
  getAdminStats: () => apiClient.get('/users/admin/stats'),
  getDoctors: () => apiClient.get('/users/doctors'),
  getPatients: () => apiClient.get('/users/patients'),
  getPatientById: (id) => apiClient.get(`/users/patients/${id}`),
};

export const documentApi = {
  upload: (formData) => apiClient.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getMyDocuments: () => apiClient.get('/documents/my'),
  getPatientDocuments: (patientId) => apiClient.get(`/documents/patient/${patientId}`),
  download: (id) => apiClient.get(`/documents/${id}/download`, { responseType: 'blob' }),
  archive: (id) => apiClient.patch(`/documents/${id}/archive`),
};

export const consentApi = {
  create: (consentData) => apiClient.post('/consents', consentData),
  getById: (id) => apiClient.get(`/consents/${id}`),
  sign: (id, payload) => apiClient.post(`/consents/${id}/sign`, payload),
  reject: (id, payload) => apiClient.post(`/consents/${id}/reject`, payload),
  revoke: (id, payload) => apiClient.post(`/consents/${id}/revoke`, payload),
  askQuestion: (id, payload) => apiClient.post(`/consents/${id}/ask`, payload),
  getMyConsents: () => apiClient.get('/consents/my'),
  getDoctorConsents: () => apiClient.get('/consents/doctor'),
  getAllConsents: (status) => apiClient.get('/consents/all', { params: { status } }),
};

export const aiApi = {
  askInquiry: (payload) => apiClient.post('/ai/ask', payload),
  searchGlossary: (query, category) => apiClient.get('/ai/glossary', { params: { query, category } }),
  getCategories: () => apiClient.get('/ai/glossary/categories'),
};

export const appointmentApi = {
  create: (data) => apiClient.post('/appointments', data),
  getMyAppointments: () => apiClient.get('/appointments/my'),
  getDoctorAppointments: () => apiClient.get('/appointments/doctor'),
  getAllAppointments: (status) => apiClient.get('/appointments/all', { params: { status } }),
  updateStatus: (id, payload) => apiClient.patch(`/appointments/${id}/status`, payload),
};
