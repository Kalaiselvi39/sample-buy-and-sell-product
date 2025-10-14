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
import {PurchaseService} from './services/purchase.service';
import {BuyRepository} from './repositories/buy.repository';
import * as dotenv from 'dotenv';

dotenv.config();

export {ApplicationConfig};

export const CONFIG = {
  SELLER_API_URL: BindingKey.create<string>('config.sellerApiUrl'),
};

export class BuyProductApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    // ✅ Bind Seller service URL (hardcoded or from env)
    this.bind(CONFIG.SELLER_API_URL).to(
      process.env.SELLER_API_URL ?? 'http://127.0.0.1:4001',
    );

    // ✅ Do NOT bind any gatewayUrl — Buyer shouldn't call the Gateway

    // Setup sequence
    this.sequence(MySequence);

    // Serve static files
    this.static('/', path.join(__dirname, '../public'));

    // Setup API explorer
    this.configure(RestExplorerBindings.COMPONENT).to({path: '/explorer'});
    this.component(RestExplorerComponent);

    // Boot setup
    this.projectRoot = __dirname;
    this.bootOptions = {
      controllers: {
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };

    // ✅ Register repository and service
    this.repository(BuyRepository);
    this.bind('services.PurchaseService').toClass(PurchaseService);

    // ✅ Debug logging
    console.log('Buyer Service started with:');
    console.log(`   → SELLER_API_URL: ${this.getSync(CONFIG.SELLER_API_URL)}`);
  }
}
