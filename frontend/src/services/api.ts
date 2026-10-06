import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';
import type { AnalysisResponse } from '../types/analysis';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    }
    return Promise.reject(error);
  }
);

export const analysisService = {
  analyze: async (drugName: string, foodName: string, doseLevel = 'standard'): Promise<AnalysisResponse> => {
    // Try both /api/interactions/analyze and /analyze for maximum resilience
    try {
      const response = await api.post<AnalysisResponse>('/api/interactions/analyze', {
        drug_name: drugName,
        food_name: foodName,
        dose_level: doseLevel,
      });
      return response.data;
    } catch {
      const fallback = await api.post<AnalysisResponse>('/analyze', {
        drug_name: drugName,
        food_name: foodName,
        dose_level: doseLevel,
      });
      return fallback.data;
    }
  },

  getSuggestions: async (query: string): Promise<string[]> => {
    const response = await api.get<string[]>('/suggestions', {
      params: { q: query },
    });
    return response.data;
  },

  getBenchmarkPairings: async () => {
    try {
      const res = await api.get('/api/interactions/pairings');
      return res.data;
    } catch {
      return null;
    }
  },

  getResearchScreening: async () => {
    try {
      const res = await api.get('/api/interactions/screening');
      return res.data;
    } catch {
      return null;
    }
  },

  searchDrugs: async (query: string) => {
    try {
      const res = await api.get('/api/drugs/search', { params: { q: query } });
      return res.data;
    } catch {
      return [];
    }
  },

  searchFoods: async (query: string) => {
    try {
      const res = await api.get('/api/foods/search', { params: { q: query } });
      return res.data;
    } catch {
      return [];
    }
  },

  getHistory: async () => {
    try {
      const res = await api.get('/api/history');
      return res.data;
    } catch {
      // LocalStorage fallback
      const saved = localStorage.getItem('local_history');
      return saved ? JSON.parse(saved) : [];
    }
  },

  deleteHistoryItem: async (id: number) => {
    try {
      await api.delete(`/api/history/${id}`);
    } catch {
      // LocalStorage update
      const saved = localStorage.getItem('local_history');
      if (saved) {
        const arr = JSON.parse(saved).filter((item: any) => item.id !== id);
        localStorage.setItem('local_history', JSON.stringify(arr));
      }
    }
  },

  healthCheck: async () => {
    const response = await api.get('/');
    return response.data;
  },
};

export const authService = {
  login: async (email: string, password: string) => {
    const res = await api.post('/api/auth/login', { email, password });
    if (res.data.access_token) {
      localStorage.setItem('auth_token', res.data.access_token);
      localStorage.setItem('user_data', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  register: async (email: string, password: string, fullName?: string) => {
    const res = await api.post('/api/auth/register', { email, password, full_name: fullName });
    if (res.data.access_token) {
      localStorage.setItem('auth_token', res.data.access_token);
      localStorage.setItem('user_data', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  },

  getCurrentUser: () => {
    const raw = localStorage.getItem('user_data');
    return raw ? JSON.parse(raw) : null;
  }
};

export const cypService = {
  getAllEnzymes: async () => {
    try {
      const res = await api.get('/api/enzymes');
      return res.data;
    } catch {
      // Fallback try with /api/v1/enzymes
      const res = await api.get('/api/v1/enzymes');
      return res.data;
    }
  },

  getEnzymeDetail: async (symbol: string) => {
    try {
      const res = await api.get(`/api/enzymes/${symbol}`);
      return res.data;
    } catch {
      const res = await api.get(`/api/v1/enzymes/${symbol}`);
      return res.data;
    }
  },

  simulateClash: async (drugName: string, foodName: string) => {
    try {
      const res = await api.post('/api/enzymes/simulate', {
        drug_name: drugName,
        food_name: foodName,
      });
      return res.data;
    } catch {
      const res = await api.post('/api/v1/enzymes/simulate', {
        drug_name: drugName,
        food_name: foodName,
      });
      return res.data;
    }
  },
};

export default api;
