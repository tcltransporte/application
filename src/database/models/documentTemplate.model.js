import { DataTypes } from 'sequelize';

export class DocumentTemplate {

  id = {
    field: 'ID',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.INTEGER
  }

  description = {
    field: 'Descricao',
    type: DataTypes.STRING
  }

  acronym = {
    field: 'Sigla',
    type: DataTypes.STRING
  }

}