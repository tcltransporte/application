import { Sequelize, DataTypes } from 'sequelize';

export class CompanyBusiness {

  codigo_empresa = {
    field: 'codigo_empresa',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.INTEGER
  }

  description = {
    field: 'descricao',
    type: DataTypes.STRING
  }

}