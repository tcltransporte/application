import { Sequelize, DataTypes } from 'sequelize';

export class Bank {

  id = {
    field: 'ID',
    primaryKey: true,
    type: DataTypes.INTEGER
  }

  name = {
    field: 'Descricao',
    type: DataTypes.STRING
  }

  icon = {
    field: 'icon',
    type: DataTypes.STRING
  }

}