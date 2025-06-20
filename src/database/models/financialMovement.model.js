import { Sequelize, DataTypes } from 'sequelize';

export class FinancialMovement {

    codigo_movimento = {
        field: 'codigo_movimento',
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER
    }

    documentNumber = {
        field: 'numero_documento',
        type: DataTypes.STRING
    }

    amountTotal = {
        field: 'valor_total',
        type: DataTypes.DECIMAL
    }

    partnerId = {
        field: 'codigo_pessoa',
        type: DataTypes.BIGINT
    }
    
    issueDate = {
        field: 'data_movimento',
        type: DataTypes.STRING,
        get() {
            return this.getDataValue('issueDate').formatUTC()
        }
    }
  
}