import { Sequelize, DataTypes } from 'sequelize';

export class CenterCost {

  id = {
    field: 'ID',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  }

  description = {
    field: 'Descricao',
    type: DataTypes.STRING
  }

}