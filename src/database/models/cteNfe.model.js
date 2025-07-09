import { Sequelize, DataTypes } from 'sequelize';

export class CteNfe {

  id = {
    field: 'ID',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  }

  cteId = {
    field: 'IDCte',
    type: DataTypes.BIGINT
  }

  nfeId = {
    field: 'IDNota',
    type: DataTypes.BIGINT
  }

}