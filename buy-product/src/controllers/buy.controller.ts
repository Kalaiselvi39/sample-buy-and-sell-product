import {repository} from '@loopback/repository';
import {post, get, param, requestBody, HttpErrors} from '@loopback/rest';
import {Buy} from '../models/buy.model';
import {BuyRepository} from '../repositories/buy.repository';
import {inject} from '@loopback/core';
import {PurchaseService} from '../services/purchase.service';

export class BuyController {
  constructor(
    @repository(BuyRepository)
    public buyRepo: BuyRepository,

    @inject('services.PurchaseService')
    private purchaseService: PurchaseService,
  ) {}

  // -------------------- PRODUCTS via Gateway --------------------
  @get('/buyer/products')
  async listProducts(
    @param.query.number('sellerId') sellerId?: number,
    @param.query.string('search') search?: string,
  ) {
    try {
      return await this.purchaseService.listProducts(sellerId, search);
    } catch (err: any) {
      console.error('Error fetching products:', err.message);
      return [];
    }
  }

  @get('/buyer/products/{id}')
  async getProduct(@param.path.number('id') id: number) {
    try {
      return await this.purchaseService.getProduct(id);
    } catch (err: any) {
      throw new HttpErrors.NotFound(`Product ${id} not found`);
    }
  }

  // -------------------- CREATE PURCHASE --------------------
  @post('/buyer/buys')
  async create(@requestBody() buyData: Partial<Buy>): Promise<Buy> {

    console.log("hello from buy controller from outside data check");
    if (!buyData.productId || !buyData.quantity || !buyData.buyerId) {
      throw new HttpErrors.BadRequest(
        'productId, quantity, and buyerId are required',
      );
    }
    console.log("hello from buy controller from outside try");
    try {
      console.log("hello from buy controller");
      return await this.purchaseService.createPurchase({
        productId: buyData.productId,
        buyerId: buyData.buyerId,
        quantity: buyData.quantity,
        
      });
    } catch (err: any) {
      console.error('Error creating purchase:', err.message);
      // Re-throw as proper HTTP error
      if (err.response?.status) {
        throw new HttpErrors.HttpError(err.response.data?.message || err.message);
      }
      throw err;
    }
  }

  // -------------------- PURCHASE HISTORY --------------------
  @get('/buyer/buys/{id}')
  async findById(@param.path.number('id') id: number): Promise<Buy> {
    return this.purchaseService.findById(id);
  }

  @get('/buyer/buys')
  async find(): Promise<Buy[]> {
    return this.purchaseService.list();
  }
}
