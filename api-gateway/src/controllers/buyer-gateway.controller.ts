import {get, post, put, param, RestBindings, Request} from '@loopback/rest';
import {inject} from '@loopback/core';
import {CONFIG} from '../application';
import {ProxyService} from '../services/proxy.service';

export class BuyerGatewayController {
  constructor(
    @inject(CONFIG.BUYER_SERVICE_URL) private buyerServiceUrl: string,
    @inject(CONFIG.SELLER_SERVICE_URL) private sellerServiceUrl: string,
    @inject('services.ProxyService') private proxyService: ProxyService,
  ) {}

  // -------------------- PRODUCTS --------------------
  @get('/buyer/products')
  async listProducts(@inject(RestBindings.Http.REQUEST) req: Request) {
    const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    const target = `${this.sellerServiceUrl}/seller/products${query}`;
    return this.proxyService.forwardRequest(req, target);
  }

  @get('/buyer/products/{id}')
  async getProduct(
    @param.path.string('id') id: string,
    @inject(RestBindings.Http.REQUEST) req: Request,
  ) {
    const target = `${this.sellerServiceUrl}/seller/products/${id}`;
    return this.proxyService.forwardRequest(req, target);
  }

  @put('/buyer/products/{id}')
  async updateProduct(
    @param.path.string('id') id: string,
    @inject(RestBindings.Http.REQUEST) req: Request,
  ) {
    const target = `${this.sellerServiceUrl}/seller/products/${id}`;
    return this.proxyService.forwardRequest(req, target);
  }

  // -------------------- BUYS --------------------
  @post('/buyer/buys')
  async createBuy(@inject(RestBindings.Http.REQUEST) req: Request) {
    console.log("--------------------------------------from buyer gateway controller----------------------------------------")
    const target = `${this.buyerServiceUrl}/buyer/buys`;
    console.log("target",target);
    return this.proxyService.forwardRequest(req, target);
  }

  @get('/buyer/buys')
  async listBuys(@inject(RestBindings.Http.REQUEST) req: Request) {
    const target = `${this.buyerServiceUrl}/buyer/buys`;
    return this.proxyService.forwardRequest(req, target);
  }

  @get('/buyer/buys/{id}')
  async getBuyById(
    @param.path.string('id') id: string,
    @inject(RestBindings.Http.REQUEST) req: Request,
  ) {
    const target = `${this.buyerServiceUrl}/buyer/buys/${id}`;
    return this.proxyService.forwardRequest(req, target);
  }
}
