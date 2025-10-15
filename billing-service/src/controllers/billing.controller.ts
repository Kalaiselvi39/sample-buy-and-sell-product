import {
  get,
  param,
  HttpErrors,
  Response,
  RestBindings,
} from '@loopback/rest';
import {inject} from '@loopback/core';
import {BillingService} from '../services/billing.service';
import {createReadStream, existsSync} from 'fs';
import path from 'path';

export class BillingController {
  constructor(
    @inject('services.BillingService')
    private billingService: BillingService,
  ) {}

  // -------------------- MONTHLY REPORT --------------------
  @get('/billing/csv-invoices/download/monthly')
  async downloadMonthlyInvoice(
    @param.query.number('month') month: number,
    @param.query.number('year') year: number,
    @param.query.string('format') format: 'csv' | 'pdf' = 'csv',
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ) {
    if (!month || !year) {
      throw new HttpErrors.BadRequest('month and year are required');
    }

    const files = await this.billingService.generateMonthlyReport(month, year);
    const filePath = format === 'pdf' ? files.pdf : files.csv;

    if (!existsSync(filePath)) {
      throw new HttpErrors.NotFound('File not found');
    }

    response.setHeader(
      'Content-Type',
      format === 'pdf' ? 'application/pdf' : 'text/csv',
    );
    response.setHeader(
      'Content-Disposition',
      `attachment; filename=${path.basename(filePath)}`,
    );

    return createReadStream(filePath);
  }

  // -------------------- RANGE REPORT --------------------
  @get('/billing/csv-invoices/download/range')
  async downloadRangeInvoice(
    @param.query.string('startDate') startDate: string,
    @param.query.string('endDate') endDate: string,
    @param.query.string('format') format: 'csv' | 'pdf' = 'csv',
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ) {
    if (!startDate || !endDate) {
      throw new HttpErrors.BadRequest('startDate and endDate are required');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new HttpErrors.BadRequest('Invalid date format');
    }
    if (start > end) {
      throw new HttpErrors.BadRequest('startDate cannot be later than endDate');
    }

    const files = await this.billingService.generateRangeReport(start, end);
    const filePath = format === 'pdf' ? files.pdf : files.csv;

    if (!existsSync(filePath)) {
      throw new HttpErrors.NotFound('File not found');
    }

    response.setHeader(
      'Content-Type',
      format === 'pdf' ? 'application/pdf' : 'text/csv',
    );
    response.setHeader(
      'Content-Disposition',
      `attachment; filename=${path.basename(filePath)}`,
    );

    return createReadStream(filePath);
  }
}
