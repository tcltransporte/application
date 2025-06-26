import Sequelize from 'sequelize'

export class Shippiment {

  codigo_carga = {
    field: 'codigo_carga',
    primaryKey: true,
    autoIncrement: true,
    type: Sequelize.BIGINT
  }

  tripTravelId = {
    field: 'codigo_viagem',
    type: Sequelize.BIGINT
  }

  tripId = {
    field: 'idViagemGrupo',
    type: Sequelize.BIGINT
  }

  documentNumber = {
    field: 'documento_transporte',
    type: Sequelize.STRING
  }

  shippingValue = {
    field: 'valor_frete',
    type: Sequelize.DECIMAL
  }

  senderId = {
    field: 'codigo_cliente',
    type: Sequelize.BIGINT
  }

  predominant = {
    field: 'proPred',
    type: Sequelize.STRING
  }

  quantity = {
    field: 'quantidade_entrega',
    type: Sequelize.SMALLINT
  }

  weight = {
    field: 'peso',
    type: Sequelize.DECIMAL(18, 3)
  }

  departureDate = {
    field: 'data_saida',
    type: Sequelize.STRING
  }


}