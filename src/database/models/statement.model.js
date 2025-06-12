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
    type: DataTypes.STRING,
    defaultValue: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
    get() {
      const rawDate = this.getDataValue('createdAt')
      return rawDate ? rawDate.toISOString().replace('T', ' ').substring(0, 23) : null
    }
  }

  begin = {
    field: 'begin',
    type: DataTypes.STRING,
    get() {
      const rawDate = this.getDataValue('begin')
      return rawDate ? rawDate.toISOString().replace('T', ' ').substring(0, 23) : null
    }
  }

  end = {
    field: 'end',
    type: DataTypes.STRING,
    get() {
      const rawDate = this.getDataValue('end')
      return rawDate ? rawDate.toISOString().replace('T', ' ').substring(0, 23) : null
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