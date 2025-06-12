import Sequelize from 'sequelize';

export class FinancialCategory {

  id = {
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
    type: Sequelize.BIGINT
  }

  code = {
    field: 'Codigo',
    type: Sequelize.STRING(15)
  }

  account = {
    field: 'Conta',
    type: Sequelize.STRING(20)
  }

  description = {
    field: 'Descricao',
    type: Sequelize.STRING
  }

  externalId = {
    field: 'externalId',
    type: Sequelize.STRING
  }

}