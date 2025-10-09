import {injectable, BindingScope, inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {BuyRepository} from '../repositories/buy.repository';
import axios from 'axios';
import {Buy} from '../models/buy.model';

@injectable({scope: BindingScope.TRANSIENT})
export class PurchaseService {
  constructor(
    @repository(BuyRepository)
    private buyRepo: BuyRepository,
    @inject('config.sellerApiUrl')
    private sellerApiUrl: string, 
  ) {}

  /**
   * Create a purchase record for a buyer.
   * Reduces quantity in SellerDB automatically.
   */
  async createPurchase(data: {
    productId: number;
    buyerId: number;
    quantity: number;
  }): Promise<Buy> {
    const {productId, buyerId, quantity} = data;

    // Fetch product details from Seller service
    let product;
    try {
      const res = await axios.get(`${this.sellerApiUrl}/seller/product/${productId}`);
      product = res.data;
    } catch (err) {
      throw new Error(`Product ${productId} not found in Seller service`);
    }

    // Check available quantity
    if ((product.quantity ?? 0) < quantity) {
      throw new Error(
        `Not enough quantity. Available: ${product.quantity}, Requested: ${quantity}`,
      );
    }

    // Reduce quantity in SellerDB
    await axios.put(`${this.sellerApiUrl}/seller/products/${productId}`, {
      quantity: product.quantity - quantity,
    });

    // Create Buy record in BuyerDB
    const unitPrice = product.price ?? 0;
    const buy = await this.buyRepo.create({
      productId,
      buyerId,
      quantity,
      unitPrice,
      totalPrice: unitPrice * quantity,
      purchasedAt: new Date().toISOString(),
    });

    return buy;
  }

//List all purchases in BuyerDB
  async list(): Promise<Buy[]> {
    return this.buyRepo.find();
  }
  
// Find a single purchase by ID
  
  async findById(id: number): Promise<Buy> {
    return this.buyRepo.findById(id);
  }
}
