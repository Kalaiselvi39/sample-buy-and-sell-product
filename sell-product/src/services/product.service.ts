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

  async createProduct(data: Partial<Product>): Promise<Product> {
    const now = new Date().toISOString();
    const record = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    return this.productRepo.create(record as Product);
  }

  async findAll(): Promise<Product[]> {
    return this.productRepo.find();
  }

  async findById(id: number): Promise<Product | null> {
    return this.productRepo.findById(id);
  }

  async updateProduct(id: number, data: Partial<Product>): Promise<void> {
    await this.productRepo.updateById(id, {...data, updatedAt: new Date().toISOString()});
  }

  async deleteProduct(id: number): Promise<void> {
    await this.productRepo.deleteById(id);
  }
}
