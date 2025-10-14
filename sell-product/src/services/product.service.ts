import {injectable, BindingScope} from '@loopback/core';
import {repository} from '@loopback/repository';
import {ProductRepository} from '../repositories/product.repository';
import {Product} from '../models/product.model';

@injectable({scope: BindingScope.TRANSIENT})
export class ProductService {
  constructor(
    @repository(ProductRepository)
    private productRepo: ProductRepository,
  ) {}

  // -------------------- CREATE --------------------
  async createProduct(data: Partial<Product>): Promise<Product> {
    const now = new Date().toISOString();
    const record = {
      ...data,
      status: data.status ?? 'active',
      createdAt: now,
      updatedAt: now,
    };
    return this.productRepo.create(record as Product);
  }

  // -------------------- LIST ALL OR FILTERED --------------------
  async findAll(filter?: {sellerId?: number; search?: string}): Promise<Product[]> {
    const where: any = {};
    if (filter?.sellerId) {
      where.sellerId = filter.sellerId;
    }
    if (filter?.search) {
      where.name = {like: `%${filter.search}%`};
    }
    return this.productRepo.find({where});
  }

  // -------------------- FIND BY ID --------------------
  async findById(id: number): Promise<Product | null> {
    try {
      return await this.productRepo.findById(id);
    } catch {
      return null;
    }
  }

  // -------------------- UPDATE --------------------
  async updateProduct(id: number, data: Partial<Product>): Promise<void> {
    const exists = await this.findById(id);
    if (!exists) throw new Error(`Product with id ${id} not found`);
    await this.productRepo.updateById(id, {...data, updatedAt: new Date().toISOString()});
  }

  // -------------------- DELETE --------------------
  async deleteProduct(id: number): Promise<void> {
    const exists = await this.findById(id);
    if (!exists) throw new Error(`Product with id ${id} not found`);
    await this.productRepo.deleteById(id);
  }
}
