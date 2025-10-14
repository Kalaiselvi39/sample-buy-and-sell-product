import {get, put, param, RestBindings, Request, post} from '@loopback/rest';
import {inject} from '@loopback/core';
import {CONFIG} from '../application';
import {ProxyService} from '../services/proxy.service';

export class SellerGatewayController {
  constructor(
    @inject(CONFIG.SELLER_SERVICE_URL) private sellerServiceUrl: string,
    @inject('services.ProxyService') private proxyService: ProxyService,
  ) {}

  // POST: create product
  @post('/seller/products')
  async createSellerProduct(@inject(RestBindings.Http.REQUEST) req: Request) {
    const target = `${this.sellerServiceUrl}/seller/products`;
    return this.proxyService.forwardRequest(req, target);
  }

  // GET: list products
  @get('/seller/products')
  async listSellerProducts(@inject(RestBindings.Http.REQUEST) req: Request) {
    const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    const target = `${this.sellerServiceUrl}/seller/products${query}`;
    return this.proxyService.forwardRequest(req, target);
  }

  // GET: single product by id
  @get('/seller/products/{id}')
  async getSellerProduct(
    @param.path.string('id') id: string,
    @inject(RestBindings.Http.REQUEST) req: Request,
  ) {
    const target = `${this.sellerServiceUrl}/seller/products/${id}`;
    return this.proxyService.forwardRequest(req, target);
  }

  // PUT: update product
  @put('/seller/products/{id}')
  async updateSellerProduct(
    @param.path.string('id') id: string,
    @inject(RestBindings.Http.REQUEST) req: Request,
  ) {
    const target = `${this.sellerServiceUrl}/seller/products/${id}`;
    return this.proxyService.forwardRequest(req, target);
  }
}
