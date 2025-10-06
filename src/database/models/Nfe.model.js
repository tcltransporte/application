import { Sequelize, DataTypes } from 'sequelize';

export class Nfe {

  codigo_nota = {
    field: 'codigo_nota',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  }

  emission = {
    field: 'data_emissao',
    type: DataTypes.STRING
  }

  nNF = {
    field: 'numero',
    type: DataTypes.BIGINT
  }

  serie = {
    field: 'serie',
    type: DataTypes.INTEGER
  }

  chNFe = {
    field: 'chaveNf',
    type: DataTypes.STRING(44)
  }

  senderId = {
    field: 'IDRemetente',
    type: DataTypes.BIGINT
  }

  destinationId = {
    field: 'codigo_cliente',
    type: DataTypes.BIGINT
  }

  amount = {
    field: 'valor',
    type: DataTypes.DECIMAL
  }

  weight = {
    field: 'peso',
    type: DataTypes.DECIMAL
  }

}