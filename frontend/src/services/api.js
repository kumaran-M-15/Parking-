import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/admin-login';
    }
    return Promise.reject(error);
  }
);

export const parkingAPI = {
  // Office management
  getOffices: () => api.get('/offices'),
  createOffice: (officeData) => api.post('/offices', officeData),

  // Parking requests
  createParkingRequest: (requestData) => api.post('/parking-requests', requestData),
  getParkingRequests: (status) => api.get(`/parking-requests${status ? `?status=${status}` : ''}`),
  getUserRequests: (empId) => api.get(`/parking-requests/user/${empId}`),

  // Admin operations
  adminLogin: (credentials) => api.post('/admin/login', credentials),
  approveRejectRequest: (approvalData) => api.post('/admin/approve-request', approvalData),
  getDashboard: () => api.get('/admin/dashboard'),

  // OTP operations
  sendOTP: (email) => api.post('/send-otp', { email }),
  verifyOTP: (email, otp) => api.post('/verify-otp', { email, otp }),
};

export default api;