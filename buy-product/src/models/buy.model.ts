import {Entity, model, property} from '@loopback/repository';

@model({settings: {postgresql: {table: 'buys'}}})
export class Buy extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
    postgresql: {columnName: 'id', dataType: 'serial'},
  })
  id?: number;

  @property({
    type: 'number',
    required: true,
    postgresql: {columnName: 'product_id', dataType: 'int4'},
  })
  productId: number;

  @property({
    type: 'number',
    required: true,
    postgresql: {columnName: 'buyer_id', dataType: 'int4'},
  })
  buyerId: number;

  @property({
    type: 'number',
    required: true,
    postgresql: {columnName: 'quantity', dataType: 'int4'},
  })
  quantity: number;

  @property({
    type: 'number',
    required: true,
    postgresql: {columnName: 'unit_price', dataType: 'numeric'},
  })
  unitPrice: number;

  @property({
    type: 'number',
    postgresql: {columnName: 'total_price', dataType: 'numeric'},
  })
  totalPrice?: number;

  @property({
    type: 'date',
    postgresql: {columnName: 'buying_time', dataType: 'timestamp'},
    default: () => new Date().toISOString(),
  })
  purchasedAt?: string;

  constructor(data?: Partial<Buy>) {
    super(data);
    
    if (!this.totalPrice && this.unitPrice && this.quantity) {
      this.totalPrice = this.unitPrice * this.quantity;
    }
  }
}

// Optional interface for relations
export interface BuyRelations {}

export type BuyWithRelations = Buy & BuyRelations;
