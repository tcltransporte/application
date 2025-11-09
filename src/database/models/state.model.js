import { Sequelize, DataTypes } from 'sequelize';

export class State {

  codigo_uf = {
    field: 'codigo_uf',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.TINYINT
  }

  name = {
    field: 'nome_uf',
    type: DataTypes.STRING
  }

  acronym = {
    field: 'sigla_uf',
    type: DataTypes.STRING
  }

}