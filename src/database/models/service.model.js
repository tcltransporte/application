import { Sequelize, DataTypes } from 'sequelize';

export class Service {

  id = {
    field: 'ID',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.INTEGER
  }

  name = {
    field: 'Descricao',
    type: DataTypes.STRING
  }

}