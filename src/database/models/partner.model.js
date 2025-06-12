import Sequelize from 'sequelize';

export class Partner {

  codigo_pessoa = {
    field: 'codigo_pessoa',
    primaryKey: true,
    autoIncrement: true,
    type: Sequelize.BIGINT
  }

  surname = {
    field: 'nome',
    primaryKey: true,
    type: Sequelize.STRING
  }

  companyIntegrationId = {
    field: 'companyIntegrationId',
    type: Sequelize.UUIDV4
  }

  externalId = {
    field: 'externalId',
    type: Sequelize.UUIDV4
  }

  isActive = {
    field: 'ativo',
    defaultValue: true,
    type: Sequelize.BOOLEAN
  }

}