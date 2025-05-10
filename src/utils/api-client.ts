import axios from 'axios';
import { logger } from './logger';

const log = logger.child({
  context: 'apiClient',
});


export const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
});


apiClient.interceptors.response.use(
  (response) => response,
  (error) => {

    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      'Um erro inesperado ocorreu';

    log.error({ error: errorMessage }, 'API Error');
    return Promise.reject(error);
  }
);
