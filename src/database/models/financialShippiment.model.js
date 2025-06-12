import Sequelize from 'sequelize';

export class FinancialShippiment {

  id = {
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
    type: Sequelize.BIGINT
  }

  bankAccountId = {
    field: 'Descricao',
    type: Sequelize.STRING
  }

}