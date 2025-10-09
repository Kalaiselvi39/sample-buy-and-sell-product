import {get, param, HttpErrors, Response, RestBindings} from '@loopback/rest';
import {inject} from '@loopback/core';
import {BillingService} from '../services/billing.service';
import {createReadStream, existsSync} from 'fs';
import path from 'path';

export class BillingController {
  constructor(
    @inject('services.BillingService')
    private billingService: BillingService,
  ) {}

// Download a single CSV report for all buyers for a given month
 
  @get('/billing/csv-invoices/download')
  async downloadCsv(
    @param.query.number('month') month: number,
    @param.query.number('year') year: number,
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ) {
    if (!month || !year) {
      throw new HttpErrors.BadRequest('month and year query parameters are required');
    }

    const filePath = await this.billingService.generateMonthlyCsv(month, year);

    if (!existsSync(filePath)) {
      throw new HttpErrors.NotFound('CSV file not found');
    }

    response.setHeader('Content-Type', 'text/csv');
    response.setHeader('Content-Disposition', `attachment; filename=${path.basename(filePath)}`);
    return createReadStream(filePath);
  }
}
