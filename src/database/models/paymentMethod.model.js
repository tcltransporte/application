import Sequelize from 'sequelize';

export class PaymentMethod {

  id = {
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
    type: Sequelize.UUIDV4
  }

  name = {
    field: 'name',
    type: Sequelize.STRING(50)
  }

}