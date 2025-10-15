import {injectable, BindingScope} from '@loopback/core';
import axios, {AxiosRequestConfig, AxiosError} from 'axios';
import {HttpErrors} from '@loopback/rest';

@injectable({scope: BindingScope.TRANSIENT})
export class ProxyService {
  constructor() {}

  // Forward HTTP request safely to another service.

  async forwardRequest(
    method: string,
    targetUrl: string,
    body?: any,
    headers?: any,
    params?: any,
  ): Promise<any> {
    console.log(`\n[ProxyService] → Forwarding ${method} request`);
    console.log(`[Target] ${targetUrl}`);
    if (body) console.log(`[Body]`, JSON.stringify(body, null, 2));

    // Only include safe headers
    const safeHeaders = {
      'Content-Type': 'application/json',
      ...(headers?.authorization && {Authorization: headers.authorization}),
      ...(headers?.accept && {Accept: headers.accept}),
    };

    const config: AxiosRequestConfig = {
      method: method as any,
      url: targetUrl,
      headers: safeHeaders,
      data: body,
      params,
      timeout: 30000,
      validateStatus: () => true, 
    };

    try {
      const response = await axios(config);

      // Directly pass through successful responses
      if (response.status >= 200 && response.status < 400) {
        return response.data;
      }

      // Handle backend 
      const message =
        response.data?.message ||
        response.statusText ||
        'Backend service error';
      throw this.mapHttpError(response.status, message);

    } catch (err: any) {
      console.error('[ProxyService] Error during forwarding:', err.message);

      if (axios.isAxiosError(err)) {
        return this.handleAxiosError(err);
      }

      // Unknown error (non-Axios)
      throw new HttpErrors.InternalServerError('Unexpected proxy error');
    }
  }

  //Map HTTP status codes to LoopBack HttpErrors
  
  private mapHttpError(status: number, message: string): HttpErrors.HttpError {
    switch (status) {
      case 400: return new HttpErrors.BadRequest(message);
      case 401: return new HttpErrors.Unauthorized(message);
      case 403: return new HttpErrors.Forbidden(message);
      case 404: return new HttpErrors.NotFound(message);
      case 408: return new HttpErrors.RequestTimeout(message);
      case 502: return new HttpErrors.BadGateway(message);
      case 504: return new HttpErrors.GatewayTimeout(message);
      default:  return new HttpErrors.InternalServerError(message);
    }
  }

  // Handle Axios-specific errors

  private handleAxiosError(err: AxiosError): never {
    if (err.code === 'ECONNABORTED') {
      throw new HttpErrors.GatewayTimeout('Request to backend timed out');
    }

    if (err.response) {
      const status = err.response.status;
      const message =
        (err.response.data as any)?.message ||
        err.response.statusText ||
        'Backend service error';
      throw this.mapHttpError(status, message);
    }

    // Connection refused or unknown host
    throw new HttpErrors.BadGateway('Failed to reach backend service');
  }
}
