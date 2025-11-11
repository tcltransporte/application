import { Sequelize, DataTypes } from 'sequelize';

export class Order {

  id = {
    field: 'ID',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  }

  companyId = {
    field: 'companyId',
    type: DataTypes.TINYINT
  }

  sequence = {
    field: 'Numero',
    type: DataTypes.INTEGER
  }

  typeId = {
    field: 'IDTipoSolicitacao',
    type: DataTypes.INTEGER
  }

  userId = {
    field: 'UserId',
    type: DataTypes.UUID
  }

  date = {
    field: 'Data',
    type: DataTypes.STRING
  }

  description = {
    field: 'Descricao',
    type: DataTypes.STRING(100)
  }

  nfeId = {
    field: 'nfeId',
    type: DataTypes.BIGINT
  }

  nfseId = {
    field: 'nfseId',
    type: DataTypes.BIGINT
  }

}