import {injectable, BindingScope} from '@loopback/core';
import {Request} from '@loopback/rest';
import axios, {AxiosRequestConfig} from 'axios';

@injectable({scope: BindingScope.TRANSIENT})
export class ProxyService {
  constructor() {}

  async forwardRequest(req: Request, targetUrl: string) {
    const startTime = Date.now();

    const log = (msg: string, extra?: any) => {
      console.log(`[ProxyService][${((Date.now() - startTime)/1000).toFixed(3)}s] ${msg}`, extra || '');
    };

    log(`Forwarding request: ${req.method} ${req.url} → ${targetUrl}`);

    // Make sure the body exists for POST/PUT/PATCH
    const bodyData = req.body ?? {};
    log('Request body:', bodyData);

    // Clean headers: avoid passing host/content-length which can break the request
    const {host, 'content-length': _, ...headers} = req.headers;

    const axiosConfig: AxiosRequestConfig = {
      method: req.method as any,
      url: targetUrl,
      headers,
      timeout: 15000, // 15 seconds
      data: ['POST', 'PUT', 'PATCH'].includes(req.method ?? '') ? bodyData : undefined,
      params: req.method === 'GET' ? req.query : undefined,
    };

    try {
      const response = await axios(axiosConfig);
      log(`Response received with status ${response.status}`, response.data);
      return response.data;
    } catch (err: any) {
      if (err.response) {
        log(`Backend responded with status ${err.response.status}`, err.response.data);
      } else if (err.code === 'ECONNABORTED') {
        log('Request timed out');
      } else {
        log('Error forwarding request:', err.message);
      }
      throw err;
    }
  }
}
