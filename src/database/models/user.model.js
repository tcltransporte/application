import Sequelize from 'sequelize'
import { format, zonedTimeToUtc } from 'date-fns-tz';

export class User {

  userId = {
    field: 'UserId',
    primaryKey: true,
    type: Sequelize.UUIDV4
  }

  applicationId = {
    field: 'ApplicationId',
    allowNull: false,
    type: Sequelize.UUIDV4
  }

  userName = {
    field: 'UserName',
    type: Sequelize.STRING
  }

  loweredUserName = {
    field: 'LoweredUserName',
    type: Sequelize.STRING
  }

  lastActivityDate = {
    field: 'LastActivityDate',
    allowNull: false,
    defaultValue: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
    type: Sequelize.STRING
  }

  isAnonymous = {
    field: 'IsAnonymous',
    allowNull: false,
    defaultValue: false,
    type: Sequelize.BOOLEAN
  }

}