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

// Generate a single CSV report for all buyers for a month

  async generateMonthlyCsv(month: number, year: number): Promise<string> {
    // Fetch all purchases from Buyer service
    const {data: purchases} = await axios.get<Purchase[]>(
      `${this.buyerApiUrl}/buyer/buys?month=${month}&year=${year}`,
    );

    if (!purchases.length) {
      throw new Error('No purchases found for this month');
    }

    // Fetch product details for all purchases
    const detailedPurchases: DetailedPurchase[] = await Promise.all(
      purchases.map(async p => {
        const {data: product} = await axios.get<Product>(
          `${this.sellerApiUrl}/seller/product/${p.productId}`,
        );
        return {
          ...p,
          productName: product.name,
          unitPrice: product.price,
          totalPrice: product.price * p.quantity,
        };
      }),
    );

    //  Prepare folder
    const folderPath = path.join(__dirname, '../../billing_reports');
    fs.mkdirSync(folderPath, {recursive: true});

    // Create CSV file path
    const fileName = `monthly_report_${year}_${month}.csv`;
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
