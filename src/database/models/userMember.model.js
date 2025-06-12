import { format } from 'date-fns'
import Sequelize from 'sequelize'

export class UserMember {

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

  email = {
    field: 'Email',
    type: Sequelize.STRING
  }

  password = {
    field: 'Password',
    type: Sequelize.STRING
  }

  passwordFormat = {
    field: 'PasswordFormat',
    allowNull: false,
    defaultValue: 1,
    type: Sequelize.INTEGER
  }

  passwordSalt = {
    field: 'PasswordSalt',
    allowNull: false,
    type: Sequelize.STRING
  }

  isApproved = {
    field: 'isApproved',
    allowNull: false,
    defaultValue: true,
    type: Sequelize.BOOLEAN
  }

  isLockedOut = {
    field: 'IsLockedOut',
    allowNull: false,
    defaultValue: false,
    type: Sequelize.BOOLEAN
  }

  createAt = {
    field: 'CreateDate',
    allowNull: false,
    defaultValue: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
    type: Sequelize.STRING
  }

  lastLoginAt = {
    field: 'LastLoginDate',
    allowNull: false,
    defaultValue: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
    type: Sequelize.STRING
  }

  lastPasswordChangedAt = {
    field: 'LastPasswordChangedDate',
    allowNull: false,
    defaultValue: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
    type: Sequelize.STRING
  }

  lastLockoutAt = {
    field: 'LastLockoutDate',
    allowNull: false,
    defaultValue: '1754-01-01 00:00:00.000',
    type: Sequelize.STRING
  }

  failedPasswordAttemptCount = {
    field: 'FailedPasswordAttemptCount',
    allowNull: false,
    defaultValue: 0,
    type: Sequelize.INTEGER
  }

  failedPasswordAttemptWindowStart = {
    field: 'FailedPasswordAttemptWindowStart',
    allowNull: false,
    defaultValue: '1754-01-01 00:00:00.000',
    type: Sequelize.STRING
  }

  failedPasswordAnswerAttemptCount = {
    field: 'FailedPasswordAnswerAttemptCount',
    allowNull: false,
    defaultValue: 0,
    type: Sequelize.INTEGER
  }

  failedPasswordAnswerAttemptWindowStart = {
    field: 'FailedPasswordAnswerAttemptWindowStart',
    allowNull: false,
    defaultValue: '1754-01-01 00:00:00.000',
    type: Sequelize.STRING
  }

}