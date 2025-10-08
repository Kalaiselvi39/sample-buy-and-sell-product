import {Entity, model, property} from '@loopback/repository';

@model({name: 'products'})
export class Product extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'number',
    required: true,
  })
  sellerId: number; // Keep as plain property for now

  @property({
    type: 'string',
    required: true,
  })
  productName: string;

  @property({
    type: 'string',
  })
  description?: string;

  @property({
    type: 'number',
    required: true,
  })
  price: number;

  @property({
    type: 'number',
    required: true,
  })
  quantity: number;

  @property({
    type: 'string',
  })
  category?: string;

  @property({
    type: 'string',
    default: 'active',
  })
  status?: string;

  @property({
    type: 'date',
    defaultFn: 'now',
  })
  createdAt?: string;

  @property({
    type: 'date',
    defaultFn: 'now',
  })
  updatedAt?: string;

  constructor(data?: Partial<Product>) {
    super(data);
  }
}

/**
 * Optional: define relations later
 */
export interface ProductRelations {
  // seller?: Seller;
  // buys?: Buy[];
}

export type ProductWithRelations = Product & ProductRelations;
