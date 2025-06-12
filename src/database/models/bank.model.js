import Sequelize from 'sequelize';

export class Bank {

  id = {
    field: 'ID',
    primaryKey: true,
    type: Sequelize.INTEGER
  }

  name = {
    field: 'Descricao',
    type: Sequelize.STRING
  }

  icon = {
    field: 'icon',
    type: Sequelize.STRING
  }

}