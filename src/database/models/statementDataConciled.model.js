import { DataTypes } from 'sequelize';

export class StatementDataConciled {

  id = {
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.UUIDV4,
  }

  statementDataId = {
    field: 'statementDataId',
    type: DataTypes.UUIDV4
  }

  partnerId = {
    field: 'partnerId',
    type: DataTypes.BIGINT
  }

  receivementId = {
    field: 'receivementId',
    type: DataTypes.BIGINT
  }

  paymentId = {
    field: 'paymentId',
    type: DataTypes.BIGINT
  }

  categoryId = {
    field: 'categoryId',
    type: DataTypes.INTEGER
  }

  type = {
    field: 'type',
    type: DataTypes.STRING(30)
  }

  originId = {
    field: 'originId',
    type: DataTypes.SMALLINT
  };

  destinationId = {
    field: 'destinationId',
    type: DataTypes.SMALLINT
  };

  amount = {
    field: 'amount',
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0
  }

  fee = {
    field: 'fee',
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0
  }

  discount = {
    field: 'discount',
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0
  }

  isConciled = {
    field: 'isConciled',
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }

  message = {
    field: 'message',
    type: DataTypes.STRING(150)
  }

}