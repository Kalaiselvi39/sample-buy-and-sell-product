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

    @inject('config.sellerApiUrl')
    private sellerServiceUrl: string,
  ) {}

  private axiosInstance = axios.create({
    timeout: 15000, // 15 seconds timeout
  });

  /** Fetch all products from Seller service */
  async listProducts(sellerId?: number, search?: string) {
    try {
      const res = await this.axiosInstance.get(`${this.sellerServiceUrl}/seller/products`, {
        params: {sellerId, search},
      });
      return res.data || [];
    } catch (err: any) {
      this.handleAxiosError(err, 'listing products');
    }
  }

  /** Fetch a single product by ID */
  async getProduct(id: number) {
    try {
      const res = await this.axiosInstance.get(`${this.sellerServiceUrl}/seller/products/${id}`);
      if (!res.data) {
        throw new HttpErrors.NotFound(`Product ${id} not found in Seller Service`);
      }
      return res.data;
    } catch (err: any) {
      this.handleAxiosError(err, `fetching product ${id}`);
    }
  }

  /** Update product quantity at Seller service */
  private async updateProductQuantity(productId: number, newQuantity: number) {
    try {
      await this.axiosInstance.put(
        `${this.sellerServiceUrl}/seller/products/${productId}`,
        {quantity: newQuantity},
      );
    } catch (err: any) {
      this.handleAxiosError(err, `updating quantity for product ${productId}`);
    }
  }

  /** Centralized Axios error handler */
  private handleAxiosError(err: AxiosError, context: string): never {
    console.error(`[PurchaseService] Error ${context}:`, err.message);

    if (err.response) {
      // Received response from server but it's an error
      if (err.response.status === 404) {
        throw new HttpErrors.NotFound(`Resource not found while ${context}`);
      } else if (err.response.status >= 500) {
        throw new HttpErrors.BadGateway(`Seller service error while ${context}`);
      }
    } else if (err.code === 'ECONNABORTED') {
      // Timeout
      throw new HttpErrors.GatewayTimeout(`Seller service timeout while ${context}`);
    } else if (err.request) {
      // No response received
      throw new HttpErrors.BadGateway(`No response from Seller service while ${context}`);
    }

    // Fallback
    throw new HttpErrors.InternalServerError(`Unexpected error while ${context}`);
  }

  /** Create a purchase */
  async createPurchase(data: {productId: number; buyerId: number; quantity: number}): Promise<Buy> {
    const {productId, buyerId, quantity} = data;

    // Fetch product
    const product = await this.getProduct(productId);
    const available = product.quantity ?? 0;

    if (available < quantity) {
      throw new HttpErrors.BadRequest(`Requested quantity (${quantity}) exceeds available (${available})`);
    }

    // Update quantity
    await this.updateProductQuantity(productId, available - quantity);

    // Save purchase record
    const buyRecord = await this.buyRepo.create({
      productId,
      buyerId,
      quantity,
      unitPrice: Number(product.price ?? 0),
      totalPrice: (Number(product.price ?? 0)) * quantity,
      purchasedAt: new Date().toISOString(),
    });

    return buyRecord;
  }

  /** List all purchases */
  async list(): Promise<Buy[]> {
    return this.buyRepo.find();
  }

  /** Find a purchase by ID */
  async findById(id: number): Promise<Buy> {
    return this.buyRepo.findById(id);
  }
}
