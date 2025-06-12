import Sequelize from 'sequelize';

export class FinancialMovementIntallment {

  codigo_movimento_detalhe = {
    field: 'codigo_movimento_detalhe',
    primaryKey: true,
    autoIncrement: true,
    type: Sequelize.BIGINT
  }

  financialMovementId = {
    field: 'codigo_movimento',
    type: Sequelize.BIGINT
  }

  paymentMethodId = {
      field: 'paymentMethodId',
      type: Sequelize.UUIDV4
  }

  bankAccountId = {
      field: 'bankAccountId',
      type: Sequelize.SMALLINT
  }

  installment = {
    field: 'numero_parcela',
    type: Sequelize.STRING
  }

  description = {
    field: 'Descricao',
    type: Sequelize.STRING
  }

  amount = {
    field: 'valor_parcela',
    type: Sequelize.DECIMAL
  }

  dueDate = {
    field: 'data_vencimento',
    type: Sequelize.STRING
  }

  status = {
    type: Sequelize.VIRTUAL,
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