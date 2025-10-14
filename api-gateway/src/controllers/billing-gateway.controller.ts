import {get, post, param, RestBindings, Request} from '@loopback/rest';
import {inject} from '@loopback/core';
import {CONFIG} from '../application';
import {ProxyService} from '../services/proxy.service';

export class BillingGatewayController {
  constructor(
    @inject(CONFIG.BILLING_SERVICE_URL) private billingServiceUrl: string,
    @inject('services.ProxyService') private proxyService: ProxyService,
  ) {}

  // -------------------- MONTHLY CSV --------------------
  @get('/billing/csv-invoices/download/monthly')
  async downloadMonthlyCsv(
    @param.query.number('month') month: number,
    @param.query.number('year') year: number,
    @inject(RestBindings.Http.REQUEST) req: Request,
  ) {
    if (!month || !year) {
      throw new Error('month and year query parameters are required');
    }
    const target = `${this.billingServiceUrl}/billing/csv-invoices/download?month=${month}&year=${year}`;
    return this.proxyService.forwardRequest(req, target);
  }

  // -------------------- DATE RANGE CSV --------------------
  @get('/billing/csv-invoices/download/range')
  async downloadRangeCsv(
    @param.query.string('startDate') startDate: string,
    @param.query.string('endDate') endDate: string,
    @inject(RestBindings.Http.REQUEST) req: Request,
  ) {
    if (!startDate || !endDate) {
      throw new Error('startDate and endDate query parameters are required');
    }
    const target = `${this.billingServiceUrl}/billing/csv-invoices/download?startDate=${startDate}&endDate=${endDate}`;
    return this.proxyService.forwardRequest(req, target);
  }

  // -------------------- GENERIC PROXY (optional) --------------------
//   @get('/billing/{path}')
//   async proxyBillingGet(
//     @param.path.string('path') path: string,
//     @inject(RestBindings.Http.REQUEST) req: Request,
//   ) {
//     const target = `${this.billingServiceUrl}/${path}`;
//     return this.proxyService.forwardRequest(req, target);
//   }

//   @post('/billing/{path}')
//   async proxyBillingPost(
//     @param.path.string('path') path: string,
//     @inject(RestBindings.Http.REQUEST) req: Request,
//   ) {
//     const target = `${this.billingServiceUrl}/${path}`;
//     return this.proxyService.forwardRequest(req, target);
//   }
}
