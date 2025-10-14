import {BootMixin} from '@loopback/boot';
import {ApplicationConfig, BindingKey} from '@loopback/core';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {ServiceMixin} from '@loopback/service-proxy';
import {MySequence} from './sequence';
import * as dotenv from 'dotenv';
import path from 'path';
import {ProxyService} from './services/proxy.service';

// Load .env safely
dotenv.config({path: path.resolve(__dirname, '../.env')});

export {ApplicationConfig};

export const CONFIG = {
  BUYER_SERVICE_URL: BindingKey.create<string>('config.buyerServiceUrl'),
  SELLER_SERVICE_URL: BindingKey.create<string>('config.sellerServiceUrl'),
  BILLING_SERVICE_URL: BindingKey.create<string>('config.billingServiceUrl'),
};

export class ApiGatewayApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    // Setup sequence
    this.sequence(MySequence);

    // Serve static assets
    this.static('/', path.join(__dirname, '../public'));

    // Bind environment-based service URLs
    this.bind(CONFIG.BUYER_SERVICE_URL).to(process.env.BUYER_SERVICE_URL ?? '');
    this.bind(CONFIG.SELLER_SERVICE_URL).to(process.env.SELLER_SERVICE_URL ?? '');
    this.bind(CONFIG.BILLING_SERVICE_URL).to(process.env.BILLING_SERVICE_URL ?? '');

    // Register services
    this.service(ProxyService);

    // Boot setup
    this.projectRoot = __dirname;
    this.bootOptions = {
      controllers: {
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };

    // Debug logs
    console.log('API Gateway configured with:');
    console.log('  Buyer:', process.env.BUYER_SERVICE_URL);
    console.log('  Seller:', process.env.SELLER_SERVICE_URL);
    console.log('  Billing:', process.env.BILLING_SERVICE_URL);
  }
}
