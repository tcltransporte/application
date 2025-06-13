import { Sequelize, DataTypes } from 'sequelize'

export class CompanyUser {

  id = {
    field: 'id',
    primaryKey: true,
    type: DataTypes.UUIDV4,
    defaultValue: DataTypes.UUIDV4,
  }

  companyId = {
    field: 'companyId',
    type: DataTypes.TINYINT
  }

  userId = {
    field: 'userId',
    type: DataTypes.UUIDV4
  }

  roleId = {
    field: 'roleId',
    type: DataTypes.UUIDV4
  }

  isActive = {
    field: 'isActive',
    type: DataTypes.BOOLEAN
  }

}