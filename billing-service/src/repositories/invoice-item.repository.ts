import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {PostgresDataSource} from '../datasources';
import {InvoiceItem, InvoiceItemRelations} from '../models';

export class InvoiceItemRepository extends DefaultCrudRepository<
  InvoiceItem,
  typeof InvoiceItem.prototype.id,
  InvoiceItemRelations
> {
  constructor(
    @inject('datasources.postgres') dataSource: PostgresDataSource,
  ) {
    super(InvoiceItem, dataSource);
  }
}
