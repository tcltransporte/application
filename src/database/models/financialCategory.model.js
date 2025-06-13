import { Sequelize, DataTypes } from 'sequelize';

export class FinancialCategory {

  id = {
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  }

  code = {
    field: 'Codigo',
    type: DataTypes.STRING(15)
  }

  account = {
    field: 'Conta',
    type: DataTypes.STRING(20)
  }

  description = {
    field: 'Descricao',
    type: DataTypes.STRING
  }

  externalId = {
    field: 'externalId',
    type: DataTypes.STRING
  }

}