import { DateFormatUTC } from '@/utils/extensions';
import { format } from 'date-fns-tz';
import { DataTypes } from 'sequelize';

export class Statement {

  id = {
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.UUIDV4
  }

  companyId = {
    field: 'companyId',
    type: DataTypes.SMALLINT,
  }

  bankAccountId = {
    field: 'bankAccountId',
    type: DataTypes.BIGINT,
  }

  sourceId = {
    field: 'sourceId',
    type: DataTypes.STRING,
  }

  createdAt = {
    field: 'createdAt',
    defaultValue: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
    type: DataTypes.STRING,
    get() {
      return DateFormatUTC(this.getDataValue('createdAt'))
    }
  }

  begin = {
    field: 'begin',
    type: DataTypes.STRING,
    get() {
      return DateFormatUTC(this.getDataValue('begin'))
    }
  }

  end = {
    field: 'end',
    type: DataTypes.STRING,
    get() {
      return DateFormatUTC(this.getDataValue('end'))
    }
  }

  status = {
    field: 'status',
    type: DataTypes.STRING,
    
  }

  isActive = {
    field: 'isActive',
    type: DataTypes.BOOLEAN
  }

}