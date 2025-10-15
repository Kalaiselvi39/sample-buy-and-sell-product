import {get, post, put, param, requestBody, RestBindings, Request} from '@loopback/rest';
import {inject} from '@loopback/core';
import {CONFIG} from '../application';
import {ProxyService} from '../services/proxy.service';

export class SellerGatewayController {
  constructor(
    @inject(CONFIG.SELLER_SERVICE_URL) private sellerServiceUrl: string,
    @inject('services.ProxyService') private proxyService: ProxyService
  ) {}

  @get('/seller/products')
  async listProducts(@inject(RestBindings.Http.REQUEST) req: Request) {
    const target = `${this.sellerServiceUrl}/seller/products`;
    return this.proxyService.forwardRequest(
      req.method!,
      target,
      undefined,
      req.headers,
      req.query
    );
  }

  @get('/seller/products/{id}')
  async getProduct(
    @param.path.string('id') id: string,
    @inject(RestBindings.Http.REQUEST) req: Request
  ) {
    const target = `${this.sellerServiceUrl}/seller/products/${id}`;
    return this.proxyService.forwardRequest(
      req.method!,
      target,
      undefined,
      req.headers,
      req.query
    );
  }

  @put('/seller/products/{id}')
  async updateProduct(
    @param.path.string('id') id: string,
    @requestBody() body: any,
    @inject(RestBindings.Http.REQUEST) req: Request
  ) {
    const target = `${this.sellerServiceUrl}/seller/products/${id}`;
    return this.proxyService.forwardRequest(
      req.method!,
      target,
      body,
      req.headers,
      req.query
    );
  }


  @post('/seller/products')
async createProduct(
  @requestBody() body: any,
  @inject(RestBindings.Http.REQUEST) req: Request
) {
  const target = `${this.sellerServiceUrl}/seller/products`;
  console.log('[SellerGatewayController] Forwarding POST to Seller:', target);
  return this.proxyService.forwardRequest(
    req.method!,
    target,
    body
  );
}

}
