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
    type: DataTypes.STRING
  }

  cityId = {
    field: 'CodigoMunicipio',
    type: DataTypes.INTEGER
  }

  certificate = {
    field: 'certificate',
    type: DataTypes.STRING
  }

  dpsEnvironment = {
    field: 'dpsEnvironment',
    type: DataTypes.SMALLINT
  }

  dpsLastNum = {
    field: 'dpsLastNum',
    type: DataTypes.BIGINT
  }

  dpsSerie = {
    field: 'dpsSerie',
    type: DataTypes.STRING
  }

  dpsRegimeCalculation = {
    field: 'dpsRegimeCalculation',
    type: DataTypes.SMALLINT
  }

  dpsRegimeSpecial = {
    field: 'dpsRegimeSpecial',
    type: DataTypes.SMALLINT
  }

  dpsOptingForSimpleNational = {
    field: 'dpsOptingForSimpleNational',
    type: DataTypes.SMALLINT
  }

}