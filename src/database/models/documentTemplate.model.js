import { DataTypes } from 'sequelize';

export class DocumentTemplate {

  id = {
    field: 'ID',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.INTEGER
  }

  name = {
    field: 'Descricao',
    type: DataTypes.STRING
  }

}