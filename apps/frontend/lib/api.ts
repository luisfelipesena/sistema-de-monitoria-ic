import { env } from '@/config/env';
import { type AppType } from '@sistema-de-monitoria-ic/backend';
import axios from 'axios';
import { hc } from 'hono/client';

const getBaseUrl = () => {
  return env.VITE_API_URL || '/';
};

// Standard Axios instance (useful for direct calls if needed)
export const axiosInstance = axios.create({
  baseURL: `${getBaseUrl()}/api`,
  withCredentials: true, // Send cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Hono RPC client - Provides type safety based on backend routes
export const apiClient = hc<AppType>(getBaseUrl());

// You can use either axiosInstance for traditional REST calls
// or apiClient for type-safe RPC-style calls with Hono.
// For auth, apiClient offers great type safety for request/response shapes.
