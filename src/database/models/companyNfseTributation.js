import { Sequelize, DataTypes } from 'sequelize'

export class CompanyNfseTributation {

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

  description = {
    field: 'description',
    type: DataTypes.STRING
  }

  operationId = {
    field: 'operationId',
    type: DataTypes.UUIDV4
  }

  issqnId = {
    field: 'issqnId',
    type: DataTypes.SMALLINT
  }

  retentionId = {
    field: 'retentionId',
    type: DataTypes.SMALLINT
  }

  aliquota = {
    field: 'aliquota',
    type: DataTypes.DECIMAL
  }

}