import {injectable, BindingScope, inject} from '@loopback/core';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import {createObjectCsvWriter} from 'csv-writer';
import {CONFIG} from '../application';

interface Purchase {
  buyerId: number;
  productId: number;
  quantity: number;
  purchasedAt: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
}

interface DetailedPurchase extends Purchase {
  productName: string;
  unitPrice: number;
  totalPrice: number;
}

@injectable({scope: BindingScope.TRANSIENT})
export class BillingService {
  constructor(
    @inject(CONFIG.SELLER_API_URL) private sellerApiUrl: string,
    @inject(CONFIG.BUYER_API_URL) private buyerApiUrl: string,
  ) {}

  /** Generate CSV for a specific month/year */
  async generateMonthlyCsv(month: number, year: number): Promise<string> {
    const {data: purchases} = await axios.get<Purchase[]>(
      `${this.buyerApiUrl}/buyer/buys?month=${month}&year=${year}`,
    );

    if (!purchases.length) {
      throw new Error('No purchases found for this month');
    }

    return this.generateCsvFile(purchases, `monthly_report_${year}_${month}.csv`);
  }

  /** Generate CSV for a custom date range */
  async generateCsvForDateRange(start: Date, end: Date): Promise<string> {
    const startStr = start.toISOString();
    const endStr = end.toISOString();

    const {data: purchases} = await axios.get<Purchase[]>(
      `${this.buyerApiUrl}/buyer/buys?startDate=${startStr}&endDate=${endStr}`,
    );

    if (!purchases.length) {
      throw new Error('No purchases found for this date range');
    }

    const fileName = `report_${start.toISOString().slice(0,10)}_to_${end.toISOString().slice(0,10)}.csv`;
    return this.generateCsvFile(purchases, fileName);
  }

  /** Internal helper to generate CSV from purchases */
  private async generateCsvFile(purchases: Purchase[], fileName: string): Promise<string> {
    // Fetch product details for all purchases
    const detailedPurchases: DetailedPurchase[] = await Promise.all(
      purchases.map(async p => {
        const {data: product} = await axios.get<Product>(
          `${this.sellerApiUrl}/seller/products/${p.productId}`,
        );
        return {
          ...p,
          productName: product.name,
          unitPrice: product.price,
          totalPrice: product.price * p.quantity,
        };
      }),
    );

    // Prepare folder
    const folderPath = path.join(__dirname, '../../billing_reports');
    fs.mkdirSync(folderPath, {recursive: true});

    // CSV file path
    const filePath = path.join(folderPath, fileName);

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        {id: 'buyerId', title: 'Buyer ID'},
        {id: 'productId', title: 'Product ID'},
        {id: 'productName', title: 'Product Name'},
        {id: 'quantity', title: 'Quantity'},
        {id: 'unitPrice', title: 'Unit Price'},
        {id: 'totalPrice', title: 'Total Price'},
        {id: 'purchasedAt', title: 'Purchased At'},
      ],
    });

    await csvWriter.writeRecords(detailedPurchases);
    return filePath;
  }
}
