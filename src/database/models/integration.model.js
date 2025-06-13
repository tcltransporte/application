import { Sequelize, DataTypes } from 'sequelize';

export class Integration {

  id = {
    field: 'id',
    primaryKey: true,
    type: DataTypes.UUIDV4,
    defaultValue: DataTypes.UUIDV4,
  }

  name = {
    field: 'name',
    type: DataTypes.STRING
  }

  description = {
    field: 'description',
    type: DataTypes.STRING
  }

  icon = {
    field: 'icon',
    type: DataTypes.STRING
  }

}