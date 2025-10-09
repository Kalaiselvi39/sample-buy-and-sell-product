import {BootMixin} from '@loopback/boot';
import {ApplicationConfig,BindingKey} from '@loopback/core';
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

    // Bind environment-based config values
    this.bind('config.sellerApiUrl').to(
  process.env.SELLER_API_URL || 'http://127.0.0.1:4001',
);
    // Set up the custom sequence
    this.sequence(MySequence);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Explorer configuration
    this.configure(RestExplorerBindings.COMPONENT).to({
      path: '/explorer',
    });
    this.component(RestExplorerComponent);

    this.projectRoot = __dirname;
    this.bootOptions = {
      controllers: {
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };

    // Register repository and services for Buy module
    this.repository(BuyRepository);
    this.bind('services.PurchaseService').toClass(PurchaseService);

      console.log(
  `Billing Service started with SELLER_API_URL: ${this.getSync(CONFIG.SELLER_API_URL)}`,
);
  }
  
}
