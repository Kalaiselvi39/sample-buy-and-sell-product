import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {PostgresDataSource} from '../datasources';
import {Buy, BuyRelations} from '../models/buy.model';

export class BuyRepository extends DefaultCrudRepository<
  Buy,
  typeof Buy.prototype.id,
  BuyRelations
> {
  constructor(
    @inject('datasources.postgres') dataSource: PostgresDataSource,
  ) {
    super(Buy, dataSource);
  }
}
