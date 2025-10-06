import { repository } from '@loopback/repository';
import {post, get, param, requestBody, HttpErrors} from '@loopback/rest';
import {Buy} from '../models/buy.model';
import {BuyRepository} from '../repositories/buy.repository';
import {inject} from '@loopback/core';
import {PurchaseService} from '../services/purchase.service';


export class BuyController {
constructor(
@repository(BuyRepository)
public buyRepo: BuyRepository,
@inject('services.PurchaseService')
public purchaseService: PurchaseService,
) {}


@post('/buys', {
responses: {
'200': {
description: 'Create a Buy',
content: {'application/json': {schema: {'x-ts-type': Buy}}},
},
},
})
async create(@requestBody() buyData: Partial<Buy>): Promise<Buy> {
// Basic validations
if (!buyData.productId || !buyData.quantity || !buyData.unitPrice || !buyData.buyerId) {
throw new HttpErrors.BadRequest('productId, quantity, unitPrice and buyerId are required');
}


const created = await this.purchaseService.createPurchase(buyData);

return created;
}


@get('/buys/{id}', {
responses: {
'200': {
description: 'Buy model instance',
content: {'application/json': {schema: {'x-ts-type': Buy}}},
},
},
})
async findById(@param.path.number('id') id: number): Promise<Buy> {
return this.purchaseService.findById(id) as Promise<Buy>;
}


@get('/buys', {
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
return this.purchaseService.list();
}
}