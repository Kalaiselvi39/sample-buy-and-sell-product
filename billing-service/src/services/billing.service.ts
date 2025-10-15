import {injectable, BindingScope} from '@loopback/core';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import PDFDocument from 'pdfkit';
import {createObjectCsvWriter} from 'csv-writer';

interface Purchase {
  buyerId: number;
  productId: number;
  quantity: number;
  purchasedAt: string;
}

interface Product {
  id: number;
  name?: string;
  title?: string;
  product_name?: string;
  price: number | string;
}

interface DetailedPurchase extends Purchase {
  productName: string;
  unitPrice: number;
  totalPrice: number;
}

@injectable({scope: BindingScope.TRANSIENT})
export class BillingService {
  private sellerApiUrl = 'http://127.0.0.1:4001';
  private buyerApiUrl = 'http://127.0.0.1:4000';

  //monthly report
  async generateMonthlyReport(month: number, year: number) {
    const {data: purchases} = await axios.get<Purchase[]>(
      `${this.buyerApiUrl}/buyer/buys?month=${month}&year=${year}`
    );

    if (!purchases.length) throw new Error('No purchases found for this month');

    const fileBase = `monthly_report_${year}_${month}`;
    const folderPath = path.join(__dirname, '../../../billing_reports');
    fs.mkdirSync(folderPath, {recursive: true});

    const csvPath = path.join(folderPath, `${fileBase}.csv`);
    const pdfPath = path.join(folderPath, `${fileBase}.pdf`);

    const detailedPurchases = await this.enrichPurchases(purchases);
    await this.generateCsvFile(detailedPurchases, csvPath);
    await this.generatePdfFile(
      detailedPurchases,
      pdfPath,
      `Monthly Invoice Report (${month}/${year})`
    );

    return {csv: csvPath, pdf: pdfPath};
  }

  /** ---------------- RANGE REPORT ---------------- */
  async generateRangeReport(start: Date, end: Date) {
    const {data: purchases} = await axios.get<Purchase[]>(
      `${this.buyerApiUrl}/buyer/buys?startDate=${start.toISOString()}&endDate=${end.toISOString()}`
    );

    if (!purchases.length)
      throw new Error('No purchases found for this date range');

    const fileBase = `range_report_${start.toISOString().slice(0, 10)}_to_${end
      .toISOString()
      .slice(0, 10)}`;
    const folderPath = path.join(__dirname, '../../../billing_reports');
    fs.mkdirSync(folderPath, {recursive: true});

    const csvPath = path.join(folderPath, `${fileBase}.csv`);
    const pdfPath = path.join(folderPath, `${fileBase}.pdf`);

    const detailedPurchases = await this.enrichPurchases(purchases);
    await this.generateCsvFile(detailedPurchases, csvPath);
    await this.generatePdfFile(
      detailedPurchases,
      pdfPath,
      `Range Invoice Report (${start.toLocaleDateString()} → ${end.toLocaleDateString()})`
    );

    return {csv: csvPath, pdf: pdfPath};
  }

  // csv file generation
  private async generateCsvFile(
    detailedPurchases: DetailedPurchase[],
    filePath: string
  ): Promise<void> {
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        {id: 'buyerId', title: 'Buyer ID'},
        {id: 'productId', title: 'Product ID'},
        {id: 'quantity', title: 'Quantity'},
        {id: 'unitPrice', title: 'Unit Price (₹)'},
        {id: 'totalPrice', title: 'Total Price (₹)'},
        {id: 'purchasedAt', title: 'Purchased At'},
      ],
    });

    await csvWriter.writeRecords(
      detailedPurchases.map(p => ({
        buyerId: p.buyerId,
        productId: p.productId,
        quantity: p.quantity,
        unitPrice: p.unitPrice.toFixed(2),
        totalPrice: p.totalPrice.toFixed(2),
        purchasedAt: new Date(p.purchasedAt).toLocaleString(),
      }))
    );
  }

  //pdf generation
  private async generatePdfFile(
    detailedPurchases: DetailedPurchase[],
    filePath: string,
    reportTitle: string
  ): Promise<void> {
    const doc = new PDFDocument({margin: 40, size: 'A4'});
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // HEADER
    doc.fontSize(20).text('Billing Report', {align: 'center'});
    doc.moveDown(0.5);
    doc.fontSize(12).text(reportTitle, {align: 'center'});
    doc.moveDown(1);

    // TABLE HEADER (no product name)
    doc.font('Courier-Bold').fontSize(10);
    doc.text('Buyer ID | Product ID | Qty | Unit  | Total   | Date', {
      align: 'left',
    });
    doc.text('-----------------------------------------------------------');
    doc.moveDown(0.3);

    // TABLE BODY
    doc.font('Courier').fontSize(10);
    detailedPurchases.forEach(p => {
      const line = [
        String(p.buyerId).padEnd(8),
        String(p.productId).padEnd(10),
        String(p.quantity).padEnd(5),
        p.unitPrice.toFixed(2).padEnd(8),
        p.totalPrice.toFixed(2).padEnd(9),
        new Date(p.purchasedAt).toLocaleDateString(),
      ].join(' | ');
      doc.text(line);
    });

    // FOOTER
    const totalRevenue = detailedPurchases.reduce((sum, p) => sum + p.totalPrice, 0);
    const totalItems = detailedPurchases.reduce((sum, p) => sum + p.quantity, 0);
    doc.moveDown(2);
    doc.font('Courier-Bold').fontSize(12);
    doc.text(`Total Items Sold: ${totalItems}`, {align: 'right'});
    doc.text(`Total Revenue: ${totalRevenue.toFixed(2)}`, {align: 'right'});

    doc.end();
    await new Promise<void>(resolve => writeStream.on('finish', resolve));
  }

  /** ---------------- DATA ENRICHMENT ---------------- */
  private async enrichPurchases(purchases: Purchase[]): Promise<DetailedPurchase[]> {
    return Promise.all(
      purchases.map(async p => {
        try {
          const {data: product} = await axios.get<Product>(
            `${this.sellerApiUrl}/seller/products/${p.productId}`
          );

          const productName =
            product.name ||
            product.title ||
            product.product_name ||
            `Product-${p.productId}`;

          const unitPrice = Number(product.price) || 0;

          return {
            ...p,
            productName,
            unitPrice,
            totalPrice: unitPrice * p.quantity,
          };
        } catch (err: any) {
          console.warn(
            `[WARN] Product ${p.productId} not found or unavailable. Using fallback.`
          );
          return {
            ...p,
            productName: `Unknown Product (${p.productId})`,
            unitPrice: 0,
            totalPrice: 0,
          };
        }
      })
    );
  }
}
