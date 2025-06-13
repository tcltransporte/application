import { Sequelize, DataTypes } from 'sequelize';

export class FinancialMovement {

    codigo_movimento = {
        field: 'codigo_movimento',
        primaryKey: true,
        type: DataTypes.INTEGER
    }

    documentNumber = {
        field: 'numero_documento',
        type: DataTypes.STRING
    }
  
}