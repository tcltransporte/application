import { Sequelize, DataTypes } from 'sequelize';

export class OrderFiscal {

  id = {
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.UUID
  }

  orderId = {
    field: 'orderId',
    type: DataTypes.BIGINT
  }

  fiscalId = {
    field: 'fiscalId',
    type: DataTypes.BIGINT
  }

}