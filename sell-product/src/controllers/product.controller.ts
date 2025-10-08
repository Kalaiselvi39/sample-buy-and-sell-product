import {post,put,get,del,param, requestBody,HttpErrors,} from '@loopback/rest';
import {repository} from '@loopback/repository';
import {Product} from '../models/product.model';
import {ProductRepository} from '../repositories';

export class ProductController {
  constructor(
    @repository(ProductRepository)
    public productRepo: ProductRepository,
  ) {}

  // Create a new product for a seller
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

    // Default values
    const now = new Date().toISOString();
    productData.status = productData.status ?? 'active';
    productData.createdAt = now;
    productData.updatedAt = now;

    return this.productRepo.create(productData as Product);
  }

  // Update a product by ID
  @put('/seller/products/{id}', {
    responses: {
      '204': {
        description: 'Product updated successfully (no content)',
      },
      '404': {description: 'Product not found'},
    },
  })
  async updateProduct(
    @param.path.number('id') id: number,
    @requestBody() payload: Partial<Product>,
  ): Promise<void> {
    try {
      await this.productRepo.updateById(id, {
        ...payload,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      throw new HttpErrors.NotFound(`Product with id ${id} not found`);
    }
  }

  // List all products by a seller
  @get('/seller/products/{sellerId}', {
    responses: {
      '200': {
        description: 'List of products by a seller',
        content: {
          'application/json': {
            schema: {type: 'array', items: {'x-ts-type': Product}},
          },
        },
      },
    },
  })
  async listBySeller(@param.path.number('sellerId') sellerId: number) {
    return this.productRepo.find({where: {sellerId}});
  }

  // Get a single product by ID
  @get('/seller/product/{id}', {
    responses: {
      '200': {
        description: 'Product instance',
        content: {'application/json': {schema: {'x-ts-type': Product}}},
      },
      '404': {description: 'Product not found'},
    },
  })
  async findById(@param.path.number('id') id: number): Promise<Product> {
    try {
      return await this.productRepo.findById(id);
    } catch {
      throw new HttpErrors.NotFound(`Product with id ${id} not found`);
    }
  }

  // Delete a product by ID
  @del('/seller/products/{id}', {
    responses: {
      '204': {
        description: 'Product deleted successfully',
      },
      '404': {description: 'Product not found'},
    },
  })
  async deleteProduct(@param.path.number('id') id: number): Promise<string> {
    try {
      await this.productRepo.deleteById(id);
      return "deleted successfully"
    } catch {
      throw new HttpErrors.NotFound(`Product with id ${id} not found`);
    }
  }
}
