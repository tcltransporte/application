import { Sequelize, DataTypes } from 'sequelize';

export class FinancialCategory {

  id = {
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  }

  operation = {
    field: 'codigo_tipo_operacao',
    type: DataTypes.SMALLINT
  }

  code = {
    field: 'Codigo',
    type: DataTypes.STRING(15)
  }

  account = {
    field: 'Conta',
    type: DataTypes.STRING(20)
  }

  description = {
    field: 'Descricao',
    type: DataTypes.STRING
  }

  isActive = {
    field: 'isAtivo',
    type: DataTypes.BOOLEAN
  }

  externalId = {
    field: 'externalId',
    type: DataTypes.STRING(15)
  }
  

}