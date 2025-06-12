import Sequelize from 'sequelize';

export class CompanyBusiness {

  codigo_empresa = {
    field: 'codigo_empresa',
    primaryKey: true,
    autoIncrement: true,
    type: Sequelize.INTEGER
  }

  description = {
    field: 'descricao',
    type: Sequelize.STRING
  }

}