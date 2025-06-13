import { Sequelize, DataTypes } from 'sequelize';

export class Company {

  codigo_empresa_filial = {
    field: 'codigo_empresa_filial',
    primaryKey: true,
    type: DataTypes.INTEGER
  }

  cnpj = {
    field: 'cnpj',
    type: DataTypes.STRING(14)
  }

  name = {
    field: 'nome_fantasia',
    type: DataTypes.STRING
  }

  surname = {
    field: 'descricao',
    type: DataTypes.STRING
  }

  companyBusinessId = {
    field: 'codigo_empresa',
    type: DataTypes.NUMBER
  }

}