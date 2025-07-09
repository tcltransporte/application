import { Sequelize, DataTypes } from 'sequelize';

export class Nfe {

  codigo_nota = {
    field: 'codigo_nota',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  }

  chNFe = {
    field: 'chaveNf',
    type: DataTypes.STRING(44)
  }

}