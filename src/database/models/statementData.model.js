import { DateFormatUTC } from '@/utils/extensions';
import { DataTypes } from 'sequelize';

export class StatementData {

  id = {
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.UUIDV4,
  }

  statementId = {
    field: 'statementId',
    type: DataTypes.UUIDV4
  }

  entryDate = {
    field: 'entryDate',
    type: DataTypes.STRING,
    get() {
      return this.getDataValue('entryDate') ? DateFormatUTC(this.getDataValue('entryDate')) : null
    }
  }

  entryType = {
    field: 'entryType',
    type: DataTypes.STRING(50),
  }

  sourceId = {
    field: 'sourceId',
    type: DataTypes.STRING(20),
  }

  reference = {
    field: 'reference',
    type: DataTypes.STRING(20),
  }
  
  amount = {
    field: 'amount',
    type: DataTypes.DECIMAL(18, 2)
  }

  fee = {
    field: 'fee',
    type: DataTypes.DECIMAL(18, 2)
  }
  
  shipping = {
    field: 'shipping',
    type: DataTypes.DECIMAL(18, 2)
  }

  debit = {
    field: 'debit',
    type: DataTypes.DECIMAL(18, 2)
  }

  credit = {
    field: 'credit',
    type: DataTypes.DECIMAL(18, 2)
  }

  balance = {
    field: 'balance',
    type: DataTypes.DECIMAL(18, 2)
  }

  extra = {
    field: 'extra',
    type: DataTypes.STRING(500)
  }

}