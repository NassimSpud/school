import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/+$/, '');

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// User API endpoints
export const fetchUsers = async () => {
    const response = await api.get('/api/admin/users');
    return response.data;
};

export const fetchUserById = async (id) => {
    const response = await api.get(`/api/admin/users/${id}`);
    return response.data;
};

// Student Attendance API endpoints
export const fetchStudentAttendance = async (classId) => {
    const response = await api.get(`/api/attendance/${classId}`);
    return response.data;
};

export const updateAttendance = async (attendanceData) => {
    const response = await api.post('/api/attendance/update', attendanceData);
    return response.data;
};

export default api;
