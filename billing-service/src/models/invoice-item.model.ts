import {Entity, model, property} from '@loopback/repository';

@model()
export class InvoiceItem extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({type: 'number', required: true})
  invoiceId: number;

  @property({type: 'number', required: true})
  productId: number;

  @property({type: 'string'})
  productName?: string;

  @property({type: 'number'})
  price?: number;

  @property({type: 'number'})
  quantity?: number;

  @property({type: 'number'})
  total?: number;

  constructor(data?: Partial<InvoiceItem>) {
    super(data);
  }
}


export interface InvoiceItemRelations {}

export type InvoiceItemWithRelations = InvoiceItem & InvoiceItemRelations;
