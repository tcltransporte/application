import { Sequelize, DataTypes } from 'sequelize';

export class Archive {

  id = {
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.UUIDV4
  }

  name = {
    field: 'name',
    type: DataTypes.STRING
  }

  type = {
    field: 'type',
    type: DataTypes.STRING
  }

  content = {
    field: 'content',
    type: DataTypes.BLOB("long")
  }

  createdAt = {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }

}