import { Sequelize, DataTypes } from 'sequelize';

export class CompanyIntegration {

  id = {
    field: 'id',
    primaryKey: true,
    type: DataTypes.UUIDV4,
    defaultValue: DataTypes.UUIDV4,
  }

  companyId = {
    field: 'companyId',
    type: DataTypes.UUIDV4
  }

  integrationId = {
    field: 'integrationId',
    type: DataTypes.UUIDV4
  }

  options = {
    field: 'options',
    type: DataTypes.STRING
  }

  isActive = {
    field: 'isActive',
    type: DataTypes.BOOLEAN
  }

}