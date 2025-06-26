import Sequelize from 'sequelize'

export class Cte {

  id = {
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
    type: Sequelize.BIGINT,
  }

  tripId = {
    field: 'IdViagem',
    type: Sequelize.BIGINT
  }

  takerId = {
    field: 'IdTomador',
    type: Sequelize.BIGINT
  }

  originId = {
    field: 'Origem',
    type: Sequelize.BIGINT
  }

  destinyId = {
    field: 'Destino',
    type: Sequelize.BIGINT
  }

  shippimentId = {
    field: 'IDCarga',
    type: Sequelize.BIGINT
  }

  dhEmi = {
    field: 'dhEmi',
    type: Sequelize.STRING
  }

  nCT = {
    field: 'nCT',
    type: Sequelize.SMALLINT
  }

  serie = {
    field: 'serieCT',
    type: Sequelize.BIGINT
  }

  chCTe = {
    field: 'ChaveCT',
    type: Sequelize.STRING(44)
  }

  tpCTe = {
    field: 'tpCTe',
    type: Sequelize.SMALLINT
  }

  CFOP = {
    field: 'CFOP',
    type: Sequelize.INTEGER
  }

  cStat = {
    field: 'cStat',
    type: Sequelize.INTEGER
  }

  nProt = {
    field: 'nProt',
    type: Sequelize.STRING
  }
  
  dhRecbto = {
    field: 'dhRecbto',
    type: Sequelize.STRING
  }

  vTPrest = {
    field: 'vTPrest',
    type: Sequelize.DECIMAL
  }

  valorAReceber = {
    field: 'valorAReceber',
    type: Sequelize.DECIMAL
  }

  codigoUnidade = {
    field: 'codigoUnidade',
    type: Sequelize.SMALLINT
  }

  baseCalculo = {
    field: 'baseCalculo',
    type: Sequelize.DECIMAL
  }

  pRedBC = {
    field: 'pRedBC',
    type: Sequelize.DECIMAL
  }

  pICMS = {
    field: 'pICMS',
    type: Sequelize.DECIMAL
  }

  senderId = {
    field: 'senderId',
    type: Sequelize.BIGINT
  }

  recipientId = {
    field: 'IDCliente',
    type: Sequelize.BIGINT
  }
  
  dispatcherId = {
    field: 'dispatcherId',
    type: Sequelize.BIGINT
  }

  receiverId = {
    field: 'receiverId',
    type: Sequelize.BIGINT
  }

  receivementId = {
    field: 'IDMovimento',
    type: Sequelize.BIGINT
  }

  xml = {
    field: 'Xml',
    type: Sequelize.BLOB
  }

}