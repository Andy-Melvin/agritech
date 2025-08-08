import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const IS_DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';
const commonHeaders = {
  'Content-Type': 'application/json',
};

const unauthorizedAxiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: commonHeaders,
});

const authorizedAxiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: commonHeaders,
});

authorizedAxiosInstance.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('access_token');
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const unauthorizedAPI = unauthorizedAxiosInstance;
export const authorizedAPI = authorizedAxiosInstance;

// In demo mode, short-circuit all API requests with mocked responses
if (IS_DEMO_MODE) {
  const demoUser = {
    name: 'Demo User',
    email: 'demo@example.com',
    phone: '+1234567890',
    role: 'demo',
  };

  const mockAdapter = async (config: AxiosRequestConfig): Promise<AxiosResponse> => {
    // small artificial delay for realism
    await new Promise((r) => setTimeout(r, 300));

    const url = (config.url || '').toString();
    const method = (config.method || 'get').toLowerCase();

    // Auth endpoints
    if (method === 'post' && /\/auth\/login$/.test(url)) {
      return {
        data: {
          access_token: 'demo-access-token',
          refresh_token: 'demo-refresh-token',
          user: demoUser,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    }

    if (method === 'post' && /\/auth\/register/.test(url)) {
      return {
        data: {
          message: 'Registered (demo) successfully',
          user: demoUser,
        },
        status: 201,
        statusText: 'Created',
        headers: {},
        config,
      };
    }

    if (method === 'post' && /\/auth\/(reset|forgot|verify)/.test(url)) {
      return {
        data: { message: 'OK (demo)' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    }

    // Dashboard data
    if (method === 'get' && /\/dashboard\/?$/.test(url)) {
      return {
        data: {
          fields: [
            { id: 1, name: 'Demo Field A' },
            { id: 2, name: 'Demo Field B' },
          ],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    }

    // Field details
    if (method === 'get' && /\/fields\//.test(url)) {
      return {
        data: {
          field: {
            id: 1,
            name: 'Demo Field A',
            long: '30.0605',
            lat: '-1.9441',
            size: '10 ha',
            temperature: '24°C',
            moisture: '55%',
            humidity: '68%',
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    }

    // Pests detect
    if (method === 'post' && /\/pests\/detect$/.test(url)) {
      return {
        data: {
          data: {
            predictions: [
              {
                name: 'Healthy plant',
                class: '4 Healthy plant',
                confidence_score: 0.92,
                tips: [
                  'Water consistently and avoid overwatering.',
                  'Provide at least 6 hours of sunlight daily.',
                ],
              },
            ],
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    }

    // Default mock response for any other endpoint
    return {
      data: {},
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    };
  };

  unauthorizedAxiosInstance.defaults.adapter = mockAdapter;
  authorizedAxiosInstance.defaults.adapter = mockAdapter;
}
