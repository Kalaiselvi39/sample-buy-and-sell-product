import {get, RestBindings, Request} from '@loopback/rest';
import {inject} from '@loopback/core';
import {CONFIG} from '../application';
import {ProxyService} from '../services/proxy.service';

export class BillingGatewayController {
  constructor(
    @inject(CONFIG.BILLING_SERVICE_URL) private billingServiceUrl: string,
    @inject('services.ProxyService') private proxyService: ProxyService
  ) {}

  // -------------------- DOWNLOAD MONTHLY REPORT --------------------
  @get('/billing/csv-invoices/download/monthly')
  async downloadMonthlyReport(@inject(RestBindings.Http.REQUEST) req: Request) {
    const target = `${this.billingServiceUrl}/billing/csv-invoices/download/monthly`;
    return this.proxyService.forwardRequest(
      req.method!,
      target,
      undefined,
      req.headers,
      req.query
    );
  }

  // -------------------- DOWNLOAD RANGE REPORT --------------------
  @get('/billing/csv-invoices/download/range')
  async downloadRangeReport(@inject(RestBindings.Http.REQUEST) req: Request) {
    const target = `${this.billingServiceUrl}/billing/csv-invoices/download/range`;
    return this.proxyService.forwardRequest(
      req.method!,
      target,
      undefined,
      req.headers,
      req.query
    );
  }
}
