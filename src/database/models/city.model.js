import { Sequelize, DataTypes } from 'sequelize';

export class City {

  codigo_municipio = {
    field: 'codigo_municipio',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.TINYINT
  }

  name = {
    field: 'nome_municipio',
    type: DataTypes.STRING
  }

  stateId = {
    field: 'codigo_uf',
    type: DataTypes.TINYINT
  }

  ibge = {
    field: 'codigo_municipio_ibge',
    type: DataTypes.INTEGER
  }

}