import { Sequelize, DataTypes } from 'sequelize';

export class FinancialMovementIntallment {

  codigo_movimento_detalhe = {
    field: 'codigo_movimento_detalhe',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  }

  financialMovementId = {
    field: 'codigo_movimento',
    type: DataTypes.BIGINT
  }

  paymentMethodId = {
      field: 'paymentMethodId',
      type: DataTypes.UUIDV4
  }

  bankAccountId = {
      field: 'bankAccountId',
      type: DataTypes.SMALLINT
  }

  installment = {
    field: 'numero_parcela',
    type: DataTypes.STRING
  }

  description = {
    field: 'Descricao',
    type: DataTypes.STRING
  }

  amount = {
    field: 'valor_parcela',
    type: DataTypes.DECIMAL
  }

  dueDate = {
    field: 'data_vencimento',
    type: DataTypes.STRING,
    get() {
      return this.getDataValue('dueDate').formatUTC()
    }
  }

  status = {
    type: DataTypes.VIRTUAL,
    get() {
      const dueDateValue = this.getDataValue('dueDate') // pega o valor raw da data de vencimento
      if (!dueDateValue) return 'Sem data'

      // Tenta converter string para Date
      const dueDateObj = new Date(dueDateValue)
      const now = new Date()

      // Se data inválida
      if (isNaN(dueDateObj.getTime())) return 'Data Inválida'

      // Exemplo simples de status
      if (dueDateObj < now) return 'overdue'

      return 'pending'
    }
  }

}