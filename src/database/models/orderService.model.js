import { Sequelize, DataTypes } from 'sequelize';

export class OrderService {

  id = {
    field: 'ID',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  }

  orderId = {
    field: 'IDSolicitacao',
    type: DataTypes.BIGINT
  }

  serviceId = {
    field: 'IDServico',
    type: DataTypes.INTEGER
  }

}