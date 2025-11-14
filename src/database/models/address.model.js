import { Sequelize, DataTypes } from 'sequelize';

export class Address {

  codigo_endereco = {
    field: 'codigo_endereco',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  }

  partnerId = {
    field: 'codigo_pessoa',
    type: DataTypes.BIGINT
  }

  typeId = {
    field: 'IDEnderecoTipo',
    type: DataTypes.TINYINT,
    defaultValue: 1
  }

  zipCode = {
    field: 'cep',
    type: DataTypes.STRING
  }

  street = {
    field: 'Complemento',
    type: DataTypes.STRING
  }

  number = {
    field: 'numero',
    type: DataTypes.STRING
  }

  complement = {
    field: 'complement',
    type: DataTypes.STRING
  }

  district = {
    field: 'bairro',
    type: DataTypes.STRING
  }

  cityId = {
    field: 'codigo_municipio',
    type: DataTypes.INTEGER
  }

}