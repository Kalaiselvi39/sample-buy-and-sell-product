import {injectable, BindingScope, inject} from '@loopback/core';
import {BuyRepository} from '../repositories/buy.repository';
import {Buy} from '../models/buy.model';


@injectable({scope: BindingScope.TRANSIENT})
export class PurchaseService {
constructor(
@inject('repositories.BuyRepository')
public buyRepo: BuyRepository,
) {}


/**
* Create a buy record and return it. In a real app this would also:
* - Validate stock
* - Reserve stock
* - Call billing module to create invoice
* - Emit events to gateway/auth services
*/
async createPurchase(payload: Partial<Buy>): Promise<Buy> {
// compute derived fields
const now = new Date().toISOString();
const toCreate: Partial<Buy> = {
...payload,
status: payload.status ?? 'pending',
createdAt: now,
updatedAt: now,
};


console.log('Payload:', payload);
  const created = await this.buyRepo.create(payload as Buy);
  console.log('Created record:', created);return created;
}


async findById(id: number): Promise<Buy | null> {
return this.buyRepo.findById(id);
}


async list(filter?: any): Promise<Buy[]> {
return this.buyRepo.find(filter);
}
}