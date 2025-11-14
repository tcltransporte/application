import { Sequelize, DataTypes } from 'sequelize';

export class NfseOperation {

  id = {
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.UUIDV4
  }

  code = {
    field: 'code',
    type: DataTypes.STRING
  }

  description = {
    field: 'description',
    type: DataTypes.STRING
  }

}