import {
  post,
  put,
  get,
  del,
  param,
  requestBody,
  HttpErrors,
} from '@loopback/rest';
import {inject} from '@loopback/core';
import {ProductService} from '../services/product.service';
import {Product} from '../models/product.model';

export class ProductController {
  constructor(
    @inject('services.ProductService')
    private productService: ProductService,
  ) {}

  // -------------------- CREATE --------------------
  @post('/seller/products', {
    responses: {
      '201': {
        description: 'Product created successfully',
        content: {'application/json': {schema: {'x-ts-type': Product}}},
      },
    },
  })
  async createProduct(@requestBody() productData: Partial<Product>) {
    if (!productData.sellerId) {
      throw new HttpErrors.BadRequest('sellerId is required');
    }
    return this.productService.createProduct(productData);
  }

  // -------------------- GET ALL --------------------
  @get('/seller/products', {
    responses: {
      '200': {
        description: 'List of all products',
        content: {'application/json': {schema: {type: 'array', items: {'x-ts-type': Product}}}},
      },
    },
  })
  async listProducts() {
    return this.productService.findAll();
  }

  // -------------------- GET BY ID --------------------
  @get('/seller/products/{id}')
  async findById(@param.path.number('id') id: number) {
    const product = await this.productService.findById(id);
    if (!product) {
      throw new HttpErrors.NotFound(`Product with id ${id} not found`);
    }
    return product;
  }

  // -------------------- UPDATE --------------------
  @put('/seller/products/{id}')
  async updateProduct(
    @param.path.number('id') id: number,
    @requestBody() data: Partial<Product>,
  ) {
    await this.productService.updateProduct(id, data);
    return {message: 'Product updated successfully'};
  }

  // -------------------- DELETE --------------------
  @del('/seller/products/{id}')
  async deleteProduct(@param.path.number('id') id: number) {
    await this.productService.deleteProduct(id);
    return {message: 'Product deleted successfully'};
  }
}
