import axios, { AxiosError, AxiosInstance } from 'axios';
import { logger } from './logger';

export class HttpClient {
  private static instance: AxiosInstance;

  public static getInstance(baseURL: string): AxiosInstance {
    if (!HttpClient.instance) {
      HttpClient.instance = axios.create({
        baseURL,
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Add request interceptor
      HttpClient.instance.interceptors.request.use(
        (config) => {
          logger.info(`[HTTP Request] ${config.method?.toUpperCase()} ${config.url}`);
          return config;
        },
        (error) => {
          logger.error('[HTTP Request Error]', error);
          return Promise.reject(error);
        }
      );

      // Add response interceptor
      HttpClient.instance.interceptors.response.use(
        (response) => {
          logger.info(`[HTTP Response] ${response.status} ${response.config.url}`);
          return response;
        },
        (error: AxiosError) => {
          if (error.response) {
            logger.error(
              `[HTTP Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}: ${error.response.status} - ${JSON.stringify(error.response.data)}`
            );
          } else {
            logger.error('[HTTP Error]', error.message);
          }
          return Promise.reject(error);
        }
      );
    }

    return HttpClient.instance;
  }
}
