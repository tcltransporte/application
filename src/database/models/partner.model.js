import { Sequelize, DataTypes } from 'sequelize';

export class Partner {

  codigo_pessoa = {
    field: 'codigo_pessoa',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  }

  surname = {
    field: 'nome',
    primaryKey: true,
    type: DataTypes.STRING
  }

  companyIntegrationId = {
    field: 'companyIntegrationId',
    type: DataTypes.UUIDV4
  }

  externalId = {
    field: 'externalId',
    type: DataTypes.UUIDV4
  }

  isActive = {
    field: 'ativo',
    defaultValue: true,
    type: DataTypes.BOOLEAN
  }

}