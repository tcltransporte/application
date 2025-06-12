import Sequelize from 'sequelize'

export class CompanyUser {

  id = {
    field: 'id',
    primaryKey: true,
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
  }

  companyId = {
    field: 'companyId',
    type: Sequelize.TINYINT
  }

  userId = {
    field: 'userId',
    type: Sequelize.UUID
  }

  roleId = {
    field: 'roleId',
    type: Sequelize.UUID
  }

  isActive = {
    field: 'isActive',
    type: Sequelize.BOOLEAN
  }

}