import Sequelize from 'sequelize';

export class BankAccount {

  codigo_conta_bancaria = {
    field: 'codigo_conta_bancaria',
    primaryKey: true,
    autoIncrement: true,
    type: Sequelize.BIGINT
  }

  agency = {
    field: 'agencia',
    type: Sequelize.STRING
  }

  number = {
    field: 'numero_conta_bancaria',
    type: Sequelize.STRING
  }

  companyId = {
    field: 'CodigoEmpresaFilial',
    type: Sequelize.TINYINT
  }

  companyIntegrationId = {
    field: 'companyIntegrationId',
    type: Sequelize.UUIDV4
  }

}