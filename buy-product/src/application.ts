import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';
import {MySequence} from './sequence';
import {PurchaseService} from './services/purchase.service';
import {BuyRepository} from './repositories/buy.repository';
import * as dotenv from 'dotenv';

dotenv.config();

export {ApplicationConfig};

export const CONFIG = {
  SELLER_API_URL: 'config.sellerApiUrl',
};

export class BuyProductApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    // Bind Seller service URL
    this.bind(CONFIG.SELLER_API_URL).to(
      process.env.SELLER_API_URL ?? 'http://127.0.0.1:4001',
    );

    // Setup sequence
    this.sequence(MySequence);

    // Serve static files
    this.static('/', path.join(__dirname, '../public'));

    // Boot options
    this.projectRoot = __dirname;
    this.bootOptions = {
      controllers: {
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };

    // Register repository and service
    this.repository(BuyRepository);
    this.bind('services.PurchaseService').toClass(PurchaseService);

    // Debug logging
    console.log('Buyer Service started with:');
    console.log(`   → SELLER_API_URL: ${this.getSync(CONFIG.SELLER_API_URL)}`);
  }
}
