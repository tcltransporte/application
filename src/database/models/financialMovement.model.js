import { format } from 'date-fns';
import { Sequelize, DataTypes } from 'sequelize';

export class FinancialMovement {

    codigo_movimento = {
        field: 'codigo_movimento',
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER
    }

    companyId = {
        field: 'CodigoEmpresaFilial',
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

    centerCostId = {
        field: 'IDCentroCusto',
        type: DataTypes.BIGINT
    }

    categoryId = {
        field: 'IDPlanoContasContabil',
        type: DataTypes.BIGINT
    }

    partnerId = {
        field: 'codigo_pessoa',
        type: DataTypes.BIGINT
    }
    
    issueDate = {
        field: 'dataEmissao',
        type: DataTypes.STRING,
        get() {
            return this.getDataValue('issueDate')?.formatUTC()
        }
    }

    observation = {
        field: 'descricao',
        type: DataTypes.STRING
    }

    createdAt = {
        field: 'data_movimento',
        type: DataTypes.STRING,
        defaultValue: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
        get() {
            return this.getDataValue('createdAt')?.formatUTC()
        }
    }

    externalId = {
        field: 'externalId',
        type: DataTypes.STRING(15)
    }
  
}