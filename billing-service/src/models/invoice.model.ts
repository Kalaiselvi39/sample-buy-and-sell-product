import {Entity, model, property, hasMany} from '@loopback/repository';
import {InvoiceItem} from './invoice-item.model';

@model()
export class Invoice extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({type: 'number', required: true})
  buyerId: number;

  @property({type: 'string'})
  status?: string;

  @property({type: 'string'})
  createdAt?: string;

  @property({type: 'string'})
  updatedAt?: string;

  @property({type: 'number'})
  totalAmount?: number;

  @hasMany(() => InvoiceItem)
  items?: InvoiceItem[];

  constructor(data?: Partial<Invoice>) {
    super(data);
  }
}


export interface InvoiceRelations {
  items?: InvoiceItem[];
}


export type InvoiceWithRelations = Invoice & InvoiceRelations;
