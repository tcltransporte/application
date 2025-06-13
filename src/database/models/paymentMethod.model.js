import { Sequelize, DataTypes } from 'sequelize';

export class PaymentMethod {

  id = {
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.UUIDV4
  }

  name = {
    field: 'name',
    type: DataTypes.STRING(50)
  }

}