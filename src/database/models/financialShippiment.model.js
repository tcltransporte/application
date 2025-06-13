import { Sequelize, DataTypes } from 'sequelize';

export class FinancialShippiment {

  id = {
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  }

  bankAccountId = {
    field: 'Descricao',
    type: DataTypes.STRING
  }

}