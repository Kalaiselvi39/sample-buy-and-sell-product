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
required: true,
postgresql: {columnName: 'buyer_id', dataType: 'int4'},
})
buyerId: number;


@property({
type: 'string',
postgresql: {columnName: 'status', dataType: 'varchar'},
default: 'pending',
})
status?: string;


@property({
type: 'date',
default: () => new Date(),
postgresql: {columnName: 'created_at', dataType: 'timestamp'},
})
createdAt?: string;


@property({
type: 'date',
postgresql: {columnName: 'updated_at', dataType: 'timestamp'},
})
updatedAt?: string;


constructor(data?: Partial<Buy>) {
super(data);
}
}


export interface BuyRelations {
// describe navigational properties here
}


export type BuyWithRelations = Buy & BuyRelations;