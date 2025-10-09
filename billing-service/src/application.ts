import {BootMixin} from '@loopback/boot';
import {ApplicationConfig, BindingKey} from '@loopback/core';
import {
  RestExplorerBindings,
  RestExplorerComponent,
} from '@loopback/rest-explorer';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';
import {MySequence} from './sequence';
import * as dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env

export {ApplicationConfig};

export const CONFIG = {
  SELLER_API_URL: BindingKey.create<string>('config.sellerApiUrl'),
  BUYER_API_URL: BindingKey.create<string>('config.buyerApiUrl'),
};

export class BillingServiceApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    // Read URLs 
    const sellerUrl = process.env.SELLER_API_URL || 'http://127.0.0.1:4001';
    const buyerUrl = process.env.BUYER_API_URL || 'http://127.0.0.1:4000';

    
    this.bind(CONFIG.SELLER_API_URL).to(sellerUrl);
    this.bind(CONFIG.BUYER_API_URL).to(buyerUrl);

    // Set up custom sequence
    this.sequence(MySequence);

    // Serve static assets from /public
    this.static('/', path.join(__dirname, '../public'));

    // Configure REST Explorer (Swagger)
    this.configure(RestExplorerBindings.COMPONENT).to({
      path: '/explorer',
    });
    this.component(RestExplorerComponent);

    // Set project root for booting
    this.projectRoot = __dirname;

    // Boot options
    this.bootOptions = {
      controllers: {
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };

    // Log configuration to confirm URLs
    console.log(`Billing Service started with:`);
    console.log(`  SELLER_API_URL: ${sellerUrl}`);
    console.log(`  BUYER_API_URL: ${buyerUrl}`);
  }
}
