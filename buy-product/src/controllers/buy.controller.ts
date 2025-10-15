import {repository} from '@loopback/repository';
import {post, get, param, requestBody, HttpErrors, getModelSchemaRef} from '@loopback/rest';
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

  // -------------------- PRODUCTS --------------------
  @get('/buyer/products')
  async listProducts(
    @param.query.number('sellerId') sellerId?: number,
    @param.query.string('search') search?: string,
  ) {
    try {
      return await this.purchaseService.listProducts(sellerId, search);
    } catch (err: any) {
      console.error('[BuyController.listProducts] Error:', err.message);
      throw err; // Already proper HttpErrors from PurchaseService
    }
  }

  @get('/buyer/products/{id}')
  async getProduct(@param.path.number('id') id: number) {
    try {
      return await this.purchaseService.getProduct(id);
    } catch (err: any) {
      console.error('[BuyController.getProduct] Error:', err.message);
      throw err; // Already proper HttpErrors from PurchaseService
    }
  }

  // -------------------- PURCHASE --------------------
  @post('/buyer/buys')
  async create(
    @requestBody({
      description: 'Purchase data',
      required: true,
      content: {
        'application/json': {
          schema: getModelSchemaRef(Buy, {partial: true}),
        },
      },
    })
    buyData: Partial<Buy>,
  ): Promise<Buy> {
    console.log('[BuyController.create] Request data:', buyData);

    if (!buyData.productId || !buyData.quantity || !buyData.buyerId) {
      throw new HttpErrors.BadRequest('productId, quantity, and buyerId are required');
    }

    try {
      return await this.purchaseService.createPurchase({
        productId: buyData.productId,
        buyerId: buyData.buyerId,
        quantity: buyData.quantity,
      });
    } catch (err: any) {
      console.error('[BuyController.create] Error creating purchase:', err.message);

      // Convert unknown errors into proper HttpErrors
      if (!(err instanceof HttpErrors.HttpError)) {
        throw new HttpErrors.InternalServerError('Failed to create purchase');
      }

      throw err;
    }
  }

  // -------------------- PURCHASE HISTORY --------------------
  @get('/buyer/buys/{id}')
  async findById(@param.path.number('id') id: number): Promise<Buy> {
    try {
      return await this.purchaseService.findById(id);
    } catch (err: any) {
      console.error('[BuyController.findById] Error:', err.message);
      if (err.name === 'EntityNotFound') {
        throw new HttpErrors.NotFound(`Purchase ${id} not found`);
      }
      throw new HttpErrors.InternalServerError('Failed to fetch purchase');
    }
  }

  @get('/buyer/buys')
  async find(): Promise<Buy[]> {
    try {
      return await this.purchaseService.list();
    } catch (err: any) {
      console.error('[BuyController.find] Error:', err.message);
      throw new HttpErrors.InternalServerError('Failed to fetch purchases');
    }
  }
}
