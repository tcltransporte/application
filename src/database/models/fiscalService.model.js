import { Sequelize, DataTypes } from 'sequelize';

export class FiscalService {

  id = {
    field: 'ID',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  }

  fiscalId = {
    field: 'IDCompras',
    type: DataTypes.BIGINT
  }

  serviceId = {
    field: 'IDServico',
    type: DataTypes.TINYINT
  }

  description = {
    field: 'Descricao',
    type: DataTypes.STRING
  }

  quantity = {
    field: 'Quantidade',
    type: DataTypes.DECIMAL,
    defaultValue: 0
  }

  amount = {
    field: 'Valor',
    type: DataTypes.DECIMAL
  }

  pISSQN = {
    field: 'AliquotaISS',
    type: DataTypes.DECIMAL
  }

  vISSQN = {
    field: 'ValorISSQN',
    type: DataTypes.DECIMAL
  }

}