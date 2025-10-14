import {injectable, BindingScope, inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {BuyRepository} from '../repositories/buy.repository';
import axios, {AxiosError} from 'axios';
import {Buy} from '../models/buy.model';
import {HttpErrors} from '@loopback/rest';

@injectable({scope: BindingScope.TRANSIENT})
export class PurchaseService {
  constructor(
    @repository(BuyRepository)
    private buyRepo: BuyRepository,

    // Seller microservice URL
    @inject('config.sellerApiUrl')
    private sellerServiceUrl: string,
  ) {}

  // -------------------- PRODUCTS --------------------

  /** Fetch all products directly from Seller Service */
  async listProducts(sellerId?: number, search?: string) {
    const start = Date.now();
    try {
      const res = await axios.get(`${this.sellerServiceUrl}/seller/products`, {
        params: {sellerId, search},
        timeout: 5000,
      });
      console.log(`[listProducts] fetched in ${(Date.now() - start) / 1000}s`);
      return res.data || [];
    } catch (err: any) {
      console.error(`[listProducts] Error fetching products: ${err.message}`);
      return [];
    }
  }

  /** Fetch a single product directly from Seller Service */
  async getProduct(id: number) {
    const start = Date.now();
    try {
      const res = await axios.get(`${this.sellerServiceUrl}/seller/products/${id}`, {timeout: 5000});
      if (!res.data) throw new Error('No data returned from Seller');
      console.log(`[getProduct] Product ${id} fetched in ${(Date.now() - start) / 1000}s`);
      return res.data;
    } catch (err: any) {
      console.error(`[getProduct] Error fetching product ${id}:`, err.message);
      throw new HttpErrors.NotFound(`Product ${id} not found in Seller Service`);
    }
  }

  // -------------------- PURCHASE --------------------

  async createPurchase(data: {productId: number; buyerId: number; quantity: number}): Promise<Buy> {
    const {productId, buyerId, quantity} = data;
    const startTime = Date.now();

    const log = (msg: string, extra?: any) => {
      console.log(`[createPurchase][${((Date.now() - startTime) / 1000).toFixed(3)}s] ${msg}`, extra ?? '');
    };

    log(`Starting purchase for buyerId=${buyerId}, productId=${productId}, quantity=${quantity}`);

    // Fetch product details
    log(`Fetching product details from Seller Service`);
    const product = await this.getProduct(productId);
    log(`Product details fetched`, product);

    const available = product.quantity ?? 0;
    if (available < quantity) {
      log(`Requested quantity (${quantity}) exceeds available (${available})`);
      throw new HttpErrors.BadRequest(`Only ${available} items available, you requested ${quantity}`);
    }

    // Update product quantity in Seller Service
    try {
      log(`Updating product quantity via Seller Service`);
      const updateStart = Date.now();
      await axios.put(
        `${this.sellerServiceUrl}/seller/products/${productId}`,
        {quantity: available - quantity},
        {timeout: 5000},
      );
      log(`Quantity updated successfully in ${(Date.now() - updateStart) / 1000}s`);
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        log(`Axios error updating quantity:`, err.message);
      } else {
        log(`Unknown error updating quantity:`, err);
      }
      throw new HttpErrors.InternalServerError('Failed to update product quantity');
    }

    // Save purchase record in Buyer DB
    const saveStart = Date.now();
    const buyRecord = await this.buyRepo.create({
  productId,
  buyerId,
  quantity,
  unitPrice: product.price ?? 0,
  totalPrice: (product.price ?? 0) * quantity,
  purchasedAt: new Date().toISOString(),
});


    log(`Purchase record saved in ${(Date.now() - saveStart) / 1000}s`, buyRecord);

    log(`Purchase completed in ${(Date.now() - startTime) / 1000}s`);
    return buyRecord;
  }

  // -------------------- PURCHASE HISTORY --------------------

  async list(): Promise<Buy[]> {
    return this.buyRepo.find();
  }

  async findById(id: number): Promise<Buy> {
    return this.buyRepo.findById(id);
  }
}
