import Sequelize from 'sequelize';

export class Integration {

  id = {
    field: 'id',
    primaryKey: true,
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
  }

  name = {
    field: 'name',
    type: Sequelize.STRING
  }

  description = {
    field: 'description',
    type: Sequelize.STRING
  }

  icon = {
    field: 'icon',
    type: Sequelize.STRING
  }

}