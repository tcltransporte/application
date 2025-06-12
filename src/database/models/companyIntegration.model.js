import Sequelize from 'sequelize';

export class CompanyIntegration {

  id = {
    field: 'id',
    primaryKey: true,
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
  }

  companyId = {
    field: 'companyId',
    type: Sequelize.UUID
  }

  integrationId = {
    field: 'integrationId',
    type: Sequelize.UUID
  }

  options = {
    field: 'options',
    type: Sequelize.STRING
  }

  isActive = {
    field: 'isActive',
    type: Sequelize.BOOLEAN
  }

}