import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// User API endpoints
export const fetchUsers = async () => {
    try {
        const response = await api.get('/api/admin/users');
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const fetchUserById = async (id) => {
    try {
        const response = await api.get(`/api/admin/users/${id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Student Attendance API endpoints
export const fetchStudentAttendance = async (classId) => {
    try {
        const response = await api.get(`/api/attendance/${classId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const updateAttendance = async (attendanceData) => {
    try {
        const response = await api.post('/api/attendance/update', attendanceData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export default api;
