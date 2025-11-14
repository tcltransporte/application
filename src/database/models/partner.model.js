import { Sequelize, DataTypes } from 'sequelize';

export class Partner {

  codigo_pessoa = {
    field: 'codigo_pessoa',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  }

  typeId = {
    field: 'IDTipoPessoa',
    type: DataTypes.TINYINT
  }

  cpfCnpj = {
    field: 'CpfCnpj',
    type: DataTypes.STRING
  }

  name = {
    field: 'RazaoSocial',
    type: DataTypes.STRING
  }

  surname = {
    field: 'nome',
    type: DataTypes.STRING
  }

  addressId = {
    field: 'addressId',
    type: DataTypes.BIGINT
  }

  companyBusinessId = {
    field: 'companyBusinessId',
    type: DataTypes.INTEGER
  }

  companyId = {
    field: 'companyId',
    type: DataTypes.SMALLINT
  }

  daysDeadlinePayment = {
    field: 'diasPrazoPagamento',
    type: DataTypes.NUMBER
  }

  companyIntegrationId = {
    field: 'companyIntegrationId',
    type: DataTypes.UUIDV4
  }

  externalId = {
    field: 'externalId',
    type: DataTypes.STRING(15)
  }

  isActive = {
    field: 'ativo',
    defaultValue: true,
    type: DataTypes.BOOLEAN
  }

}