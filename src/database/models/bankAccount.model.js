import { Sequelize, DataTypes } from 'sequelize';

export class BankAccount {

  codigo_conta_bancaria = {
    field: 'codigo_conta_bancaria',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  }

  bankId = {
    field: 'bankId',
    type: DataTypes.INTEGER
  }

  companyId = {
    field: 'CodigoEmpresaFilial',
    type: DataTypes.TINYINT
  }

  name = {
    field: 'nome_banco',
    type: DataTypes.STRING
  }

  description = {
    field: 'descricao',
    type: DataTypes.STRING
  }

  holder = {
    field: 'nome_titular',
    type: DataTypes.STRING
  }

  agency = {
    field: 'agencia',
    type: DataTypes.STRING
  }

  number = {
    field: 'numero_conta_bancaria',
    type: DataTypes.STRING
  }

  balance = {
    field: 'saldo_inicial',
    type: DataTypes.DECIMAL
  }

  statement = {
    field: 'statement',
    type: DataTypes.STRING(500)
  }

  externalId = {
    field: 'externalId',
    type: DataTypes.STRING(25)
  }

}