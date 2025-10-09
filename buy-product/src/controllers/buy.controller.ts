import {repository} from '@loopback/repository';
import {post, get, param, requestBody, HttpErrors} from '@loopback/rest';
import {Buy} from '../models/buy.model';
import {BuyRepository} from '../repositories/buy.repository';
import {inject} from '@loopback/core';
import {PurchaseService} from '../services/purchase.service';
import axios from 'axios';

export class BuyController {
  constructor(
    @repository(BuyRepository)
    public buyRepo: BuyRepository,
    @inject('services.PurchaseService')
    public purchaseService: PurchaseService,
    @inject('config.sellerApiUrl')
    private sellerApiUrl: string,
  ) {}

  // Buyer views all products
  @get('/buyer/products', {
    responses: {
      '200': {
        description: 'List all products',
        content: {
          'application/json': {
            schema: {type: 'array', items: {}},
          },
        },
      },
    },
  })
  async listProducts(
    @param.query.number('sellerId') sellerId?: number,
    @param.query.string('search') search?: string,
  ) {
    try {
        console.log('Fetching products from Seller at:', this.sellerApiUrl);
      let url = `${this.sellerApiUrl}/seller/products`;

      // Build query parameters
      const params: any = {};
      if (sellerId) params.sellerId = sellerId;
      if (search) params.search = search;

      const res = await axios.get(url, {params});
      return res.data || [];
    } catch (err: any) {
      console.error('Error fetching products from Seller service:', err.message);
      // Gracefully return empty array if Seller service is down
      return [];
    }
  }

  // Buyer searches a product by id
  @get('/buyer/products/{id}', {
    responses: {
      '200': {
        description: 'Get product by id',
        content: {'application/json': {schema: {}}},
      },
    },
  })
  async getProduct(@param.path.number('id') id: number) {
    try {
      const res = await axios.get(`${this.sellerApiUrl}/seller/product/${id}`);
      return res.data;
    } catch (err) {
      throw new HttpErrors.NotFound(`Product ${id} not found`);
    }
  }

  // Buyer purchases a product
  @post('/buyer/buys', {
    responses: {
      '200': {
        description: 'Create a Buy record',
        content: {'application/json': {schema: {'x-ts-type': Buy}}},
      },
    },
  })
  async create(@requestBody() buyData: Partial<Buy>): Promise<Buy> {
    if (!buyData.productId || !buyData.quantity || !buyData.buyerId) {
      throw new HttpErrors.BadRequest(
        'productId, quantity, and buyerId are required',
      );
    }

    // Fetch product from Seller service
    let product;
    try {
      const res = await axios.get(
        `${this.sellerApiUrl}/seller/product/${buyData.productId}`,
      );
      product = res.data;
    } catch (err) {
      throw new HttpErrors.NotFound(`Product ${buyData.productId} not found`);
    }

    // Check quantity
    if ((product.quantity ?? 0) < buyData.quantity) {
      throw new HttpErrors.BadRequest(
        `Only ${product.quantity} items available`,
      );
    }

    // Reduce quantity in SellerDB
    await axios.put(`${this.sellerApiUrl}/seller/products/${buyData.productId}`, {
      quantity: product.quantity - buyData.quantity,
    });

    // Save purchase record in BuyerDB
    const buyRecord = await this.buyRepo.create({
      productId: buyData.productId,
      buyerId: buyData.buyerId,
      quantity: buyData.quantity,
      unitPrice: product.price,
      totalPrice: (product.price ?? 0) * buyData.quantity,
      purchasedAt: new Date().toISOString(),
    });

    return buyRecord;
  }

  // Buyer can view purchase by ID
  @get('/buyer/buys/{id}', {
    responses: {
      '200': {
        description: 'Buy model instance',
        content: {'application/json': {schema: {'x-ts-type': Buy}}},
      },
    },
  })
  async findById(@param.path.number('id') id: number): Promise<Buy> {
    return this.buyRepo.findById(id);
  }

  // Buyer can view all purchases
  @get('/buyer/buys', {
    responses: {
      '200': {
        description: 'Array of Buy model instances',
        content: {
          'application/json': {
            schema: {type: 'array', items: {'x-ts-type': Buy}},
          },
        },
      },
    },
  })
  async find(): Promise<Buy[]> {
    return this.buyRepo.find();
  }
}
