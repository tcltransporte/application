import { Sequelize, DataTypes } from 'sequelize';

export class Company {

  codigo_empresa_filial = {
    field: 'codigo_empresa_filial',
    primaryKey: true,
    type: DataTypes.INTEGER
  }

  logo = {
    field: 'LogoMarca',
    type: DataTypes.BLOB
  }

  cnpj = {
    field: 'cnpj',
    type: DataTypes.STRING(14)
  }

  name = {
    field: 'nome_fantasia',
    type: DataTypes.STRING
  }

  surname = {
    field: 'descricao',
    type: DataTypes.STRING
  }

  companyBusinessId = {
    field: 'codigo_empresa',
    type: DataTypes.TINYINT
  }

  zipCode = {
    field: 'CEP',
    allowNull: true,
    type: DataTypes.STRING
  }

  street = {
    field: 'Logradouro',
    allowNull: true,
    type: DataTypes.STRING
  }

  number = {
    field: 'Numero',
    allowNull: true,
    type: DataTypes.STRING
  }

  district = {
    field: 'Bairro',
    allowNull: true,
    type: DataTypes.STRING
  }

  certificate = {
    field: 'certificate',
    allowNull: true,
    type: DataTypes.STRING
  }

  dpsEnvironment = {
    field: 'dpsEnvironment',
    allowNull: true,
    type: DataTypes.SMALLINT
  }

  dpsLastNum = {
    field: 'dpsLastNum',
    allowNull: true,
    type: DataTypes.BIGINT
  }

  dpsSerie = {
    field: 'dpsSerie',
    allowNull: true,
    type: DataTypes.STRING
  }

  dpsRegimeCalculation = {
    field: 'dpsRegimeCalculation',
    allowNull: true,
    type: DataTypes.SMALLINT
  }

  dpsRegimeSpecial = {
    field: 'dpsRegimeSpecial',
    allowNull: true,
    type: DataTypes.SMALLINT
  }

  dpsOptingForSimpleNational = {
    field: 'dpsOptingForSimpleNational',
    allowNull: true,
    type: DataTypes.SMALLINT
  }

}