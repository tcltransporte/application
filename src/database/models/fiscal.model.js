import { Sequelize, DataTypes } from 'sequelize';

export class Fiscal {

  id = {
    field: 'ID',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  }

  partnerId = {
    field: 'IDFornecedor',
    type: DataTypes.BIGINT
  }

  documentTemplateId = {
    field: 'IDModeloDocumento',
    type: DataTypes.BIGINT
  }

  documentNumber = {
    field: 'NumeroNF',
    type: DataTypes.BIGINT
  }
  
  value = {
    field: 'ValorNF',
    type: DataTypes.DECIMAL
  }

}