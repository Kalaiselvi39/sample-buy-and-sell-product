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

  /**
   * Generate CSV for a specific month/year
   */
  @get('/billing/csv-invoices/download/monthly')
  async downloadMonthlyCsv(
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
    response.setHeader(
      'Content-Disposition',
      `attachment; filename=${path.basename(filePath)}`,
    );
    return createReadStream(filePath);
  }

  /**
   * Generate CSV for a custom date range
   */
  @get('/billing/csv-invoices/download/range')
  async downloadRangeCsv(
    @param.query.string('startDate') startDate: string,
    @param.query.string('endDate') endDate: string,
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ) {
    if (!startDate || !endDate) {
      throw new HttpErrors.BadRequest('startDate and endDate query parameters are required');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new HttpErrors.BadRequest('Invalid date format. Use YYYY-MM-DD');
    }

    if (start > end) {
      throw new HttpErrors.BadRequest('startDate cannot be later than endDate');
    }

    const filePath = await this.billingService.generateCsvForDateRange(start, end);

    if (!existsSync(filePath)) {
      throw new HttpErrors.NotFound('CSV file not found');
    }

    response.setHeader('Content-Type', 'text/csv');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename=${path.basename(filePath)}`,
    );
    return createReadStream(filePath);
  }
}
