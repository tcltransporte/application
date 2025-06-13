import { Sequelize, DataTypes } from 'sequelize';

export class BankAccount {

  codigo_conta_bancaria = {
    field: 'codigo_conta_bancaria',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  }

  agency = {
    field: 'agencia',
    type: DataTypes.STRING
  }

  number = {
    field: 'numero_conta_bancaria',
    type: DataTypes.STRING
  }

  companyId = {
    field: 'CodigoEmpresaFilial',
    type: DataTypes.TINYINT
  }

  companyIntegrationId = {
    field: 'companyIntegrationId',
    type: DataTypes.UUIDV4
  }

}