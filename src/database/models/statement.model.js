import { format } from 'date-fns-tz';
import { DataTypes } from 'sequelize';

export class Statement {

  id = {
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.UUIDV4
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
      return this.getDataValue('createdAt').formatUTC()
    }
  }

  begin = {
    field: 'begin',
    type: DataTypes.STRING,
    get() {
      return this.getDataValue('begin').formatUTC()
    }
  }

  end = {
    field: 'end',
    type: DataTypes.STRING,
    get() {
      return this.getDataValue('end').formatUTC()
    }
  }

  entryTypes = {
    type: DataTypes.STRING,
    get() {
      const raw = this.getDataValue('entryTypes');
      return raw ? raw.split(',') : [];
    },
    set(value) {
      this.setDataValue('entryTypes', Array.isArray(value) ? value.join(',') : value);
    }
  }

  isActive = {
    field: 'isActive',
    type: DataTypes.BOOLEAN
  }

}