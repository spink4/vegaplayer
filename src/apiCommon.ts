import {
  BASE_URL,
  AXIOS_DEFAULT_TIMEOUT,
  SOFTWARE_VERSION_CODE,
  DEBUG,
  DEBUG_API_COMMS,
} from './appGlobals';

interface HttpResponse<T = any> {
  data: T;
  status: number;
  headers: any;
}

interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
}

/**
 * HTTP client using fetch API for React Native
 */
class HttpClient {
  private baseURL: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseURL = BASE_URL;
    this.timeout = AXIOS_DEFAULT_TIMEOUT;
    this.defaultHeaders = {
      'Content-type': 'application/json',
      'x-app-version': SOFTWARE_VERSION_CODE,
    };
  }

  private async request<T = any>(
    method: string,
    url: string,
    data?: any,
    config?: RequestConfig,
  ): Promise<HttpResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      config?.timeout || this.timeout,
    );

    const fullUrl = `${this.baseURL}${url}`;

    if (DEBUG && DEBUG_API_COMMS) {
      console.log(`[API] ${method} ${fullUrl}`);
      if (data) {
        console.log('[API] Request body:', JSON.stringify(data));
      }
    }

    try {
      const response = await fetch(fullUrl, {
        method,
        headers: {
          ...this.defaultHeaders,
          ...config?.headers,
        },
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseData = await response.json();

      if (DEBUG && DEBUG_API_COMMS) {
        console.log(`[API] Response ${response.status}:`, responseData);
      }

      return {
        data: responseData,
        status: response.status,
        headers: response.headers,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (DEBUG && DEBUG_API_COMMS) {
        console.error(`[API] Error ${method} ${fullUrl}:`, error);
        if (error instanceof Error) {
          console.error('[API] Error message:', error.message);
          console.error('[API] Error name:', error.name);
        }
      }

      throw error;
    }
  }

  async get<T = any>(
    url: string,
    config?: RequestConfig,
  ): Promise<HttpResponse<T>> {
    return this.request<T>('GET', url, undefined, config);
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig,
  ): Promise<HttpResponse<T>> {
    return this.request<T>('POST', url, data, config);
  }
}

const http = new HttpClient();

export default http;
