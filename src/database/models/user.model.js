import { Sequelize, DataTypes } from 'sequelize'
import { format, zonedTimeToUtc } from 'date-fns-tz';
import { formatUTC } from '..';

export class User {

  userId = {
    field: 'UserId',
    primaryKey: true,
    type: DataTypes.UUIDV4
  }

  applicationId = {
    field: 'ApplicationId',
    allowNull: false,
    type: DataTypes.UUIDV4
  }

  userName = {
    field: 'UserName',
    type: DataTypes.STRING
  }

  loweredUserName = {
    field: 'LoweredUserName',
    type: DataTypes.STRING
  }

  lastActivityDate = {
    field: 'LastActivityDate',
    allowNull: false,
    defaultValue: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
    type: DataTypes.STRING,
    get() {
      return formatUTC(this.getDataValue('lastActivityDate'))
    }
  }

  isAnonymous = {
    field: 'IsAnonymous',
    allowNull: false,
    defaultValue: false,
    type: DataTypes.BOOLEAN
  }

}