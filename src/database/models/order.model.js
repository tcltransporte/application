import { Sequelize, DataTypes } from 'sequelize';

export class Order {

  id = {
    field: 'ID',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  }

  sequence = {
    field: 'Numero',
    type: DataTypes.INTEGER
  }

  date = {
    field: 'Data',
    type: DataTypes.STRING
  }

  description = {
    field: 'Descricao',
    type: DataTypes.STRING(100)
  }

}