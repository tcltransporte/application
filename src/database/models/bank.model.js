import { Sequelize, DataTypes } from 'sequelize';

export class Bank {

  id = {
    field: 'ID',
    primaryKey: true,
    type: DataTypes.INTEGER
  }

  code = {
    field: 'Codigo',
    type: DataTypes.STRING
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