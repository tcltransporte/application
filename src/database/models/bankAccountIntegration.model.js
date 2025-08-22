import { Sequelize, DataTypes } from 'sequelize';

export class BankAccountIntegration {

  id = {
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.UUIDV4
  }

  bankAccountId = {
    field: 'bankAccountId',
    type: DataTypes.SMALLINT
  }

  typeBankAccountIntegrationId = {
    field: 'typeBankAccountIntegrationId',
    type: DataTypes.UUIDV4
  }

  companyIntegrationId = {
    field: 'companyIntegrationId',
    type: DataTypes.UUIDV4
  }

}