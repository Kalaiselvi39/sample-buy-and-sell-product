import {BootMixin} from '@loopback/boot';
import {ApplicationConfig, BindingKey} from '@loopback/core';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication, RestBindings, RequestBodyParserOptions} from '@loopback/rest';
import {ServiceMixin} from '@loopback/service-proxy';
import * as dotenv from 'dotenv';
import path from 'path';
import {ProxyService} from './services/proxy.service';

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

    // Enable built-in body parser for JSON and URL-encoded data
    this.configure<Partial<RequestBodyParserOptions>>(
      RestBindings.REQUEST_BODY_PARSER_OPTIONS,
    ).to({
      json: {limit: '10mb'},
      urlencoded: {extended: true, limit: '10mb'},
    });

    // Serve static files
    this.static('/', path.join(__dirname, '../public'));

    // Bind service URLs
    this.bind(CONFIG.BUYER_SERVICE_URL).to(process.env.BUYER_SERVICE_URL ?? '');
    this.bind(CONFIG.SELLER_SERVICE_URL).to(process.env.SELLER_SERVICE_URL ?? '');
    this.bind(CONFIG.BILLING_SERVICE_URL).to(process.env.BILLING_SERVICE_URL ?? '');

    // Register ProxyService
    this.service(ProxyService);

    // Boot options
    this.projectRoot = __dirname;
    this.bootOptions = {
      controllers: {
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };

    console.log('API Gateway configured with:');
    console.log('  Buyer:', process.env.BUYER_SERVICE_URL);
    console.log('  Seller:', process.env.SELLER_SERVICE_URL);
    console.log('  Billing:', process.env.BILLING_SERVICE_URL);
  }
}
