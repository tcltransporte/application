import { Sequelize, DataTypes } from 'sequelize';

export class Fiscal {

  id = {
    field: 'ID',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  }

  companyBusinessId = {
    field: 'IDEmpresa',
    type: DataTypes.INTEGER
  }

  companyId = {
    field: 'CodigoEmpresaFilial',
    type: DataTypes.TINYINT
  }

  status = {
    field: 'status',
    type: DataTypes.INTEGER
  }

  reason = {
    field: 'reason',
    type: DataTypes.STRING
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

  serie = {
    field: 'SerieNF',
    type: DataTypes.STRING
  }
  
  date = {
    field: 'DataNF',
    type: DataTypes.STRING
  }
  
  value = {
    field: 'ValorNF',
    type: DataTypes.DECIMAL
  }

  accessKey = {
    field: 'ChaveNfe',
    type: DataTypes.STRING
  }

  xml = {
    field: 'Xml',
    type: Sequelize.BLOB
  }

}