import { Sequelize } from 'sequelize'
import * as tedious from 'tedious'
import 'dotenv/config'

import { Company } from './models/company.model.js'
import { CompanyUser } from './models/companyUser.model.js'
import { CompanyBusiness } from './models/companyBusiness.model.js'
import { User } from './models/user.model.js'
import { UserMember } from './models/userMember.model.js'
import { BankAccount } from './models/bankAccount.model.js'
import { Integration } from './models/integration.model.js'
import { CompanyIntegration } from './models/companyIntegration.model.js'
import { Bank } from './models/bank.model.js'
import { Statement } from './models/statement.model.js'
import { FinancialMovement } from './models/financialMovement.model.js'
import { FinancialMovementIntallment } from './models/financialMovementInstallment.model.js'
import { Partner } from './models/partner.model.js'
import { StatementData } from './models/statementData.model.js'
import { StatementDataConciled } from './models/statementDataConciled.model.js'
import { FinancialCategory } from './models/financialCategory.model.js'
import { Shippiment } from './models/shippiment.model.js'
import { Cte } from './models/cte.model.js'
import { CteNfe } from './models/cteNfe.model.js'
import { Nfe } from './models/Nfe.model.js'
import { CenterCost } from './models/centerCost.model.js'
import { BankAccountIntegration } from './models/bankAccountIntegration.model.js'
import { Archive } from './models/archive.model.js'
import { FundMethod } from './models/fundMethod.model.js'
import { Service } from './models/service.model.js'
import { Order } from './models/order.model.js'
import { OrderService } from './models/orderService.model.js'
import { State } from './models/state.model.js'
import { City } from './models/city.model.js'
import { DocumentTemplate } from './models/documentTemplate.model.js'
import { Fiscal } from './models/fiscal.model.js'

const afterFind = (result) => {
  const trimStrings = obj => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].trim()
      }
    }
  }

  if (Array.isArray(result)) {
    result.forEach(row => trimStrings(row.dataValues))
  } else if (result && result.dataValues) {
    trimStrings(result.dataValues)
  }
}

export class AppContext extends Sequelize {
  
  Archive = this.define('archive', new Archive(), { tableName: 'archive' })
  
  Bank = this.define('bank', new Bank(), { tableName: 'Banco' })

  BankAccount = this.define('bankAccount', new BankAccount(), { tableName: 'conta_bancaria' })

  BankAccountIntegration = this.define('bankAccountIntegration', new BankAccountIntegration(), { tableName: 'bankAccountIntegration' })

  CenterCost = this.define('centerCost', new CenterCost(), { tableName: 'CentroCusto' })

  City = this.define('city', new City(), { tableName: 'municipio' })

  Company = this.define('company', new Company(), { tableName: 'empresa_filial' })

  CompanyBusiness = this.define('companyBusiness', new CompanyBusiness(), { tableName: 'empresa' })

  CompanyIntegration = this.define('companyIntegration', new CompanyIntegration(), { tableName: 'companyIntegration' })

  CompanyUser = this.define('companyUser', new CompanyUser(), { tableName: 'companyUser' })

  Cte = this.define('cte', new Cte(), { tableName: 'Ctes' })

  CteNfe = this.define('cteNfe', new CteNfe(), { tableName: 'CteNotas' })
  
  DocumentTemplate = this.define('documentTemplate', new DocumentTemplate(), { tableName: 'TipoModeloDocumento' })

  FinancialCategory = this.define('financialCategory', new FinancialCategory(), { tableName: 'PlanoContasContabil' })

  FinancialMovement = this.define('financialMovement', new FinancialMovement(), { tableName: 'movimentos' })

  FinancialMovementInstallment = this.define('financialMovementInstallment', new FinancialMovementIntallment(), { tableName: 'movimentos_detalhe' })

  Fiscal = this.define('fiscal', new Fiscal(), { tableName: 'Compras' })

  Integration = this.define('integration', new Integration(), { tableName: 'integration' })

  Nfe = this.define('nfe', new Nfe(), { tableName: 'nota' })

  Order = this.define('order', new Order(), { tableName: 'Solicitacao' })
  
  OrderService = this.define('orderService', new OrderService(), { tableName: 'SolicitacaoServicoRealizado' })

  Partner = this.define('partner', new Partner(), { tableName: 'pessoa' })
  
  Service = this.define('service', new Service(), { tableName: 'TipoServico' })

  FundMethod = this.define('fundMethod', new FundMethod(), { tableName: 'fundMethod' })
  
  State = this.define('state', new State(), { tableName: 'uf' })

  Shippiment = this.define('shippiment', new Shippiment(), { tableName: 'carga' })

  Statement = this.define('statement', new Statement(), { tableName: 'statement' })

  StatementData = this.define('statementData', new StatementData(), { tableName: 'statementData' })

  StatementDataConciled = this.define('statementDataConciled', new StatementDataConciled(), { tableName: 'statementDataConciled' })

  User = this.define('user', new User(), { tableName: 'aspnet_Users' })

  UserMember = this.define('userMember', new UserMember(), { tableName: 'aspnet_Membership' })

  constructor() {

    super({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_DATABASE,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      dialect: 'mssql',
      dialectModule: tedious,
      //databaseVersion: '10.50.1600',
      timezone: "America/Sao_Paulo",
      dialectOptions: { options: { requestTimeout: 300000, encrypt: false }}, define: { timestamps: false },
      logging: (query, options) => {
        if (options.bind) {
          Object.keys(options.bind).forEach((key) => query = query.replace(`@${key}`, `'${options.bind[key]}'`))
        }
        console.log(query)
      },
    })

    this.BankAccount.belongsTo(this.Bank, { as: 'bank', foreignKey: 'bankId', onDelete: 'CASCADE' })
    this.BankAccount.hasMany(this.BankAccountIntegration, { as: 'bankAccountIntegrations', foreignKey: 'bankAccountId', onDelete: 'CASCADE' })

    this.BankAccountIntegration.belongsTo(this.CompanyIntegration, { as: 'companyIntegration', foreignKey: 'companyIntegrationId', onDelete: 'CASCADE' })

    this.City.belongsTo(this.State, { as: 'state', foreignKey: 'codigo_uf', onDelete: 'CASCADE' })

    this.Company.hasMany(this.CompanyUser, { as: 'companyUsers', foreignKey: 'companyId', onDelete: 'CASCADE' })
    this.Company.belongsTo(this.City, { as: 'city', foreignKey: 'CodigoMunicipio', onDelete: 'CASCADE' })

    this.CompanyBusiness.hasMany(this.Company, { as: 'companies', foreignKey: 'companyBusinessId', onDelete: 'CASCADE' })
    
    this.CompanyIntegration.belongsTo(this.Integration, { as: 'integration', foreignKey: 'integrationId', onDelete: 'CASCADE' })

    this.CompanyUser.belongsTo(this.User, { as: 'user', foreignKey: 'userId' })
    this.CompanyUser.belongsTo(this.Company, { as: 'company', foreignKey: 'companyId', onDelete: 'CASCADE' })

    this.Cte.belongsTo(this.Partner, {as: 'sender', foreignKey: 'senderId', targetKey: 'codigo_pessoa', onDelete: 'CASCADE'})
    this.Cte.belongsTo(this.Shippiment, {as: 'shippiment', foreignKey: 'IDCarga', targetKey: 'codigo_carga', onDelete: 'CASCADE'})
    this.Cte.belongsTo(this.Partner, {as: 'recipient', foreignKey: 'recipientId', targetKey: 'codigo_pessoa', onDelete: 'CASCADE'})

    this.Cte.hasMany(this.CteNfe, {as: 'nfes', foreignKey: 'cteId', onDelete: 'CASCADE'})

    this.CteNfe.belongsTo(this.Cte, {as: 'cte', foreignKey: 'cteId', targetKey: 'id', onDelete: 'CASCADE'})
    this.CteNfe.belongsTo(this.Nfe, {as: 'nfe', foreignKey: 'nfeId', targetKey: 'codigo_nota', onDelete: 'CASCADE'})

    this.FinancialMovementInstallment.belongsTo(this.FinancialMovement, { as: 'financialMovement', foreignKey: 'codigo_movimento', onDelete: 'CASCADE' })
    this.FinancialMovementInstallment.belongsTo(this.FundMethod, { as: 'fundMethod', foreignKey: 'fundMethodId', onDelete: 'CASCADE' })
    this.FinancialMovementInstallment.belongsTo(this.BankAccount, { as: 'bankAccount', foreignKey: 'bankAccountId', onDelete: 'CASCADE' })
    
    this.FinancialMovement.belongsTo(this.Company, { as: 'company', foreignKey: 'CodigoEmpresaFilial', targetKey: 'codigo_empresa_filial', onDelete: 'CASCADE' })
    this.FinancialMovement.belongsTo(this.CenterCost, { as: 'centerCost', foreignKey: 'IDCentroCusto', targetKey: 'id', onDelete: 'CASCADE' })
    this.FinancialMovement.belongsTo(this.FinancialCategory, { as: 'financialCategory', foreignKey: 'IDPlanoContasContabil', targetKey: 'id', onDelete: 'CASCADE' })
    this.FinancialMovement.belongsTo(this.Partner, { as: 'partner', foreignKey: 'codigo_pessoa', targetKey: 'codigo_pessoa', onDelete: 'CASCADE' })
    this.FinancialMovement.belongsTo(this.BankAccount, { as: 'bankAccount', foreignKey: 'codigo_conta', onDelete: 'CASCADE' })
    //this.FinancialMovement.hasMany(this.FinancialMovementInstallment, { as: 'installments', foreignKey: 'financialMovementId', onDelete: 'CASCADE' })


    this.Fiscal.belongsTo(this.Partner, { as: 'partner', foreignKey: 'IDFornecedor', targetKey: 'codigo_pessoa', onDelete: 'CASCADE' })

    this.Statement.belongsTo(this.BankAccount, { as: 'bankAccount', foreignKey: 'bankAccountId', targetKey: 'codigo_conta_bancaria', onDelete: 'CASCADE' })
    this.Statement.hasMany(this.StatementData, { as: 'statementData', foreignKey: 'statementId', onDelete: 'CASCADE' })

    
    this.StatementData.belongsTo(this.Statement, { as: 'statement', foreignKey: 'statementId', targetKey: 'id', onDelete: 'CASCADE' })
    this.StatementData.hasMany(this.StatementDataConciled, { as: 'concileds', foreignKey: 'statementDataId', onDelete: 'CASCADE' })


    this.StatementDataConciled.belongsTo(this.StatementData, { as: 'statementData', foreignKey: 'statementDataId', targetKey: 'id', onDelete: 'CASCADE' })

    this.StatementDataConciled.belongsTo(this.Partner, { as: 'partner', foreignKey: 'partnerId', targetKey: 'codigo_pessoa', onDelete: 'CASCADE' })
    this.StatementDataConciled.belongsTo(this.FinancialCategory, { as: 'category', foreignKey: 'categoryId', targetKey: 'id', onDelete: 'CASCADE' })

    this.StatementDataConciled.belongsTo(this.FinancialMovementInstallment, { as: 'payment', foreignKey: 'paymentId', targetKey: 'codigo_movimento_detalhe', onDelete: 'CASCADE' })
    this.StatementDataConciled.belongsTo(this.FinancialMovementInstallment, { as: 'receivement', foreignKey: 'receivementId', targetKey: 'codigo_movimento_detalhe', onDelete: 'CASCADE' })

    this.StatementDataConciled.belongsTo(this.BankAccount, { as: 'origin', foreignKey: 'originId', targetKey: 'codigo_conta_bancaria', onDelete: 'CASCADE' })
    this.StatementDataConciled.belongsTo(this.BankAccount, { as: 'destination', foreignKey: 'destinationId', targetKey: 'codigo_conta_bancaria', onDelete: 'CASCADE' })

    
    this.Shippiment.belongsTo(this.Partner, { as: 'sender', foreignKey: 'codigo_cliente', targetKey: 'codigo_pessoa', onDelete: 'CASCADE' })
    this.Shippiment.hasMany(this.Cte, {as: 'ctes', foreignKey: 'shippimentId', onDelete: 'CASCADE'})
    

    this.User.hasMany(this.CompanyUser, { as: 'companyUsers', foreignKey: 'userId', onDelete: 'CASCADE' })
    this.User.belongsTo(this.UserMember, { as: 'userMember', foreignKey: 'userId', targetKey: 'userId', onDelete: 'CASCADE' })

    this.Nfe.belongsTo(this.Partner, {as: 'sender', foreignKey: 'IDRemetente', targetKey: 'codigo_pessoa', onDelete: 'CASCADE'})
    this.Nfe.belongsTo(this.Partner, {as: 'destination', foreignKey: 'codigo_cliente', targetKey: 'codigo_pessoa', onDelete: 'CASCADE'})

    
    this.Order.hasMany(this.OrderService, { as: 'services', foreignKey: 'IDSolicitacao', onDelete: 'CASCADE' })
    
    this.OrderService.belongsTo(this.Service, {as: 'service', foreignKey: 'IDServico', targetKey: 'id', onDelete: 'CASCADE'})


    this.Bank.addHook('afterFind', afterFind)
    this.BankAccount.addHook('afterFind', afterFind)
    this.Company.addHook('afterFind', afterFind)
    this.CompanyBusiness.addHook('afterFind', afterFind)
    this.CompanyIntegration.addHook('afterFind', afterFind)
    this.CompanyUser.addHook('afterFind', afterFind)
    this.FinancialCategory.addHook('afterFind', afterFind)
    this.Integration.addHook('afterFind', afterFind)
    this.Statement.addHook('afterFind', afterFind)
    this.StatementData.addHook('afterFind', afterFind)
    this.User.addHook('afterFind', afterFind)
    this.UserMember.addHook('afterFind', afterFind)

    /*
    this.Called.belongsTo(this.Company, {as: 'company', foreignKey: 'companyId', targetKey: 'id'})
    this.Called.belongsTo(this.User, {as: 'responsible', foreignKey: 'responsibleId', targetKey: 'id'})
    this.Called.belongsTo(this.Partner, {as: 'requested', foreignKey: 'requestedId', targetKey: 'codigo_pessoa'})
    this.Called.belongsTo(this.CalledStatus, {as: 'status', foreignKey: 'statusId', targetKey: 'id'})
    this.Called.belongsTo(this.CalledReason, {as: 'reason', foreignKey: 'reasonId', targetKey: 'id'})
    this.Called.belongsTo(this.CalledOccurrence, {as: 'occurrence', foreignKey: 'occurrenceId', targetKey: 'id'})

    this.Called.hasMany(this.CalledResolution, {as: 'resolutions', foreignKey: 'calledId'})
    
    this.CalledResolution.belongsTo(this.Called, {as: 'called', foreignKey: 'calledId', targetKey: 'id'})
    this.CalledResolution.belongsTo(this.User, {as: 'user', foreignKey: 'userId', targetKey: 'id'})
    this.CalledResolution.belongsTo(this.CalledStatus, {as: 'status', foreignKey: 'statusId', targetKey: 'id'})


    this.City.belongsTo(this.State, {as: 'state', foreignKey: 'stateId', targetKey: 'id'})
    
    this.CompanyBusiness.hasMany(this.Company, {as: 'companies', foreignKey: 'companyBusinessId'})

    this.Company.hasMany(this.CompanyUser, {as: 'companyUsers', foreignKey: 'companyId'})
    this.Company.belongsTo(this.CompanyBusiness, {as: 'companyBusiness', foreignKey: 'companyBusinessId', targetKey: 'id'})

    this.CompanyIntegration.belongsTo(this.Company, {as: 'company', foreignKey: 'companyId', targetKey: 'codigo_empresa_filial'})
    this.CompanyIntegration.belongsTo(this.Integration, {as: 'integration', foreignKey: 'integrationId', targetKey: 'id'})

    //this.CompanyRole.belongsTo(this.Role, {as: 'role', foreignKey: 'roleId', targetKey: 'id'})

    this.CompanyUser.belongsTo(this.Company, {as: 'company', foreignKey: 'companyId', targetKey: 'codigo_empresa_filial'})
    this.CompanyUser.belongsTo(this.User, {as: 'user', foreignKey: 'userId', targetKey: 'id'})
    this.CompanyUser.belongsTo(this.Role, {as: 'role', foreignKey: 'roleId', targetKey: 'id'})
    */
    /*
    this.Cte.belongsTo(this.Partner, {as: 'sender', foreignKey: 'senderId', targetKey: 'codigo_pessoa'})
    this.Cte.belongsTo(this.Partner, {as: 'recipient', foreignKey: 'IDCliente', targetKey: 'codigo_pessoa'})
    this.Cte.belongsTo(this.Partner, {as: 'dispatcher', foreignKey: 'dispatcherId', targetKey: 'codigo_pessoa'})
    this.Cte.belongsTo(this.Partner, {as: 'receiver', foreignKey: 'receiverId', targetKey: 'codigo_pessoa'})
    this.Cte.belongsTo(this.Partner, {as: 'taker', foreignKey: 'IdTomador', targetKey: 'codigo_pessoa'})
    this.Cte.belongsTo(this.Shippiment, {as: 'shippiment', foreignKey: 'IDCarga', targetKey: 'codigo_carga'})

    
    this.Cte.belongsTo(this.City, {as: 'origin', foreignKey: 'originId', targetKey: 'id'})
    this.Cte.belongsTo(this.City, {as: 'destiny', foreignKey: 'destinyId', targetKey: 'id'})

    this.Cte.hasMany(this.CteNfe, {as: 'cteNfes', foreignKey: 'cteId'})
    */

    //this.BankAccount.belongsTo(this.Bank, {as: 'bank', foreignKey: 'bankId', targetKey: 'id'})
    //this.BankAccount.hasMany(this.BankAccountStatement, {as: 'bankAccountStatements', foreignKey: 'bankAccountId'})

    //this.BankAccountStatement.belongsTo(this.Partner, {as: 'partner', foreignKey: 'partnerId', targetKey: 'codigo_pessoa'})
    //this.BankAccountStatement.belongsTo(this.BankAccount, {as: 'bankAccount', foreignKey: 'bankAccountId', targetKey: 'id'})
    //this.BankAccountStatement.belongsTo(this.CurrencyMethod, {as: 'currencyMethod', foreignKey: 'currencyMethodId', targetKey: 'id'})
    //this.BankAccountStatement.belongsTo(this.ContabilityCategorie, {as: 'categorie', foreignKey: 'categorieId', targetKey: 'id'})

    //this.Cashier.belongsTo(this.BankAccount, {as: 'bankAccount', foreignKey: 'bankAccountId', targetKey: 'id'})

    //this.Payment.belongsTo(this.Company, {as: 'company', foreignKey: 'companyId', targetKey: 'id'})
    //this.Payment.belongsTo(this.Partner, {as: 'beneficiary', foreignKey: 'beneficiaryId', targetKey: 'codigo_pessoa'})
    //this.Payment.belongsTo(this.BankAccount, {as: 'bankAccount', foreignKey: 'bankAccountId', targetKey: 'id'})
    //this.Payment.belongsTo(this.ContabilityCategorie, {as: 'categorie', foreignKey: 'categorieId', targetKey: 'id'})
    //this.Payment.belongsTo(this.CurrencyMethod, {as: 'currencyMethod', foreignKey: 'currencyMethodId', targetKey: 'id'})

    //this.PaymentMethod.belongsTo(this.CurrencyMethod, {as: 'currencyMethod', foreignKey: 'currencyMethodId', targetKey: 'id'})

    //this.Receivement.belongsTo(this.Company, {as: 'company', foreignKey: 'companyId', targetKey: 'id'})
    //this.Receivement.belongsTo(this.Partner, {as: 'payer', foreignKey: 'payerId', targetKey: 'codigo_pessoa'})
    //this.Receivement.belongsTo(this.BankAccount, {as: 'bankAccount', foreignKey: 'bankAccountId', targetKey: 'id'})
    //this.Receivement.belongsTo(this.ContabilityCategorie, {as: 'categorie', foreignKey: 'categorieId', targetKey: 'id'})
    //this.Receivement.belongsTo(this.CurrencyMethod, {as: 'currencyMethod', foreignKey: 'currencyMethodId', targetKey: 'id'})

    //this.ReceivementMethod.belongsTo(this.CurrencyMethod, {as: 'currencyMethod', foreignKey: 'currencyMethodId', targetKey: 'id'})

    //this.Role.hasMany(this.RoleRule, {as: 'roleRules', foreignKey: 'roleId'})

    /*
    this.Session.belongsTo(this.Company, {as: 'company', foreignKey: 'companyId', targetKey: 'codigo_empresa_filial'})
    this.Session.belongsTo(this.User, {as: 'user', foreignKey: 'userId', targetKey: 'id'})

    this.Shippiment.belongsTo(this.Partner, {as: 'sender', foreignKey: 'codigo_cliente', targetKey: 'codigo_pessoa'})
    this.Shippiment.hasMany(this.Cte, {as: 'ctes', foreignKey: 'IDCarga'})
    */
    
    //this.Statement.belongsTo(this.Company, {as: 'company', foreignKey: 'companyId', targetKey: 'id'})
    //this.Statement.belongsTo(this.BankAccount, {as: 'bankAccount', foreignKey: 'bankAccountId', targetKey: 'id'})

    
    //this.StatementData.hasMany(this.StatementDataConciled, {as: 'concileds', foreignKey: 'statementDataId'})

    /*
    this.StockMovement.belongsTo(this.Product, {as: 'product', foreignKey: 'codigo_item_estoque', targetKey: 'codigo_item_estoque'})

    this.InventoryItem.belongsTo(this.StockMovement, {as: 'stockMovement', foreignKey: 'stockMovementId', targetKey: 'codigo_movimento_estoque'})
    */

    //this.Task.belongsTo(this.TaskMethod, {as: 'method', foreignKey: 'methodId', targetKey: 'id'})
    //this.Task.hasMany(this.TaskHistory, {as: 'taskHistories', foreignKey: 'taskId'})

    //this.Trip.belongsTo(this.Partner, {as: 'driver', foreignKey: 'IDMotorista', targetKey: 'codigo_pessoa'})
    //this.Trip.belongsTo(this.Vehicle, {as: 'vehicle', foreignKey: 'IDTracao', targetKey: 'codigo_veiculo'})
    //this.Trip.belongsTo(this.Vehicle, {as: 'haulage1', foreignKey: 'IDReboque', targetKey: 'codigo_veiculo'})
    //this.Trip.belongsTo(this.Vehicle, {as: 'haulage2', foreignKey: 'ID2Reboque', targetKey: 'codigo_veiculo'})
    //this.Trip.hasMany(this.Shippiment, {as: 'shippiments', foreignKey: 'idViagemGrupo'})

    /*
    this.User.hasMany(this.CompanyUser, {as: 'companyUsers', foreignKey: 'userId'})

    this.User.belongsTo(this.UserMember, {as: 'userMember', foreignKey: 'id', targetKey: 'id'})
    */
   
    //this.CteNfe.belongsTo(this.Nfe, {as: 'nfe', foreignKey: 'nfeId', targetKey: 'id'})

  }

}