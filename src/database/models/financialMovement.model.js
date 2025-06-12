import Sequelize from 'sequelize';

export class FinancialMovement {

    codigo_movimento = {
        field: 'codigo_movimento',
        primaryKey: true,
        type: Sequelize.INTEGER
    }

    documentNumber = {
        field: 'numero_documento',
        type: Sequelize.STRING
    }
  
}