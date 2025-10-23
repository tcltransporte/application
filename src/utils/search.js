'use server'

import { AppContext } from "@/database"
import { authOptions } from "@/libs/auth"
import _ from "lodash"
import { getServerSession } from "next-auth"
import { Sequelize } from "sequelize"
//import { getTinyCategories, getTinyPartner } from "./integrations/tiny"

import * as sincronize from '@/app/server/sincronize'


export async function getCompany(search) {

  const session = await getServerSession(authOptions);

  const db = new AppContext();

  const companies = await db.Company.findAll({
    attributes: ['codigo_empresa_filial', 'surname'],
    order: [['codigo_empresa_filial', 'asc']],
    where: {
        codigo_empresa: session.company.companyBusiness.codigo_empresa,
        surname: {
            [Sequelize.Op.like]: `%${search.replace(/ /g, "%").toUpperCase()}%`
        }
    },
    limit: 20,
    offset: 0,
  });

  return companies.map((item) => item.toJSON());

}

export async function getUser (search) {
    
    const session = await getServerSession(authOptions)

    const db = new AppContext()

    const where = []

    where.push({'$companyUsers.company.codigo_empresa$': session.company.companyBusiness.codigo_empresa})

    where.push({'$userName$': {[Sequelize.Op.like]: `%${search.replace(' ', "%").toUpperCase()}%`}})

    const users = await db.User.findAll({
        attributes: ['userId', 'userName'],
        include: [
            {
                model: db.CompanyUser,
                as: 'companyUsers',
                required: true,
                attributes: ['id'],
                include: [
                    {
                        model: db.Company,
                        as: 'company',
                        required: true,
                        attributes: ['codigo_empresa', 'companyBusinessId'],
                        where: {
                            codigo_empresa: session.company.codigo_empresa_filial
                        }
                    }
                ]
            }
        ],
        where: {
            userName: {
                [Sequelize.Op.like]: `%${search.replace(/ /g, "%").toUpperCase()}%`
            }
        },
        order: [['userName', 'asc']],
        limit: 20,
        offset: 0,
    })

    return _.map(users, (user) => user.get({ plain: true }))
    
}

export async function getPartner(search) {

    const session = await getServerSession(authOptions);

    await sincronize.partners({search})

    const db = new AppContext();

    const where = []

    where.push({ '$nome$': { [Sequelize.Op.like]: `%${search.replace(/ /g, "%").toUpperCase()}%` }})

    where.push({ '$companyId$': session.company.codigo_empresa_filial })

    const partners = await db.Partner.findAll({
        attributes: ['codigo_pessoa', 'surname'],
        order: [['surname', 'asc']],
        where: where,
        limit: 20,
        offset: 0,
    });

    return partners.map((item) => item.get({ plain: true }));

}

export async function getFinancialCategory (search) {

    const session = await getServerSession(authOptions)

    await sincronize.categories({search})

    const db = new AppContext()

    const where = []

    where.push({'$companyId$': session.company.codigo_empresa_filial})

    where.push({'$descricao$': {[Sequelize.Op.like]: `%${search.replace(' ', "%").toUpperCase()}%`}})

    //where.push({'$codigo_tipo_operacao$': operation})

    const financialCategories = await db.FinancialCategory.findAll({
        attributes: ['id', 'description'],
        where,
        order: [['description', 'asc']],
        limit: 20,
        offset: 0,
    })

    return _.map(financialCategories, (item) => item.get({ plain: true }))
    
}

export async function getBanks (search) {
    
    const session = await getServerSession(authOptions)

    const db = new AppContext()

    const where = []

    const bankAccounts = await db.Bank.findAll({
        attributes: ['id', 'name'],
        where,
        order: [['name', 'asc']],
        limit: 20,
        offset: 0,
    })

    return _.map(bankAccounts, (user) => user.get({ plain: true }))
    
}


export async function getBankAccounts (search) {
    
    const session = await getServerSession(authOptions)

    const db = new AppContext()

    const where = []

    where.push({'$CodigoEmpresaFilial$': session.company.codigo_empresa_filial})

    where.push({ agencia: { [Sequelize.Op.like]: `%${search.replace(/ /g, "%").toUpperCase()}%` }})

    const bankAccounts = await db.BankAccount.findAll({
        attributes: ['codigo_conta_bancaria', 'name', 'agency', 'number'],
        include: [
            {model: db.Bank, as: 'bank', attributes: ['id', 'name']},
            {model: db.BankAccountIntegration, as: 'bankAccountIntegrations', attributes: ['id', 'typeBankAccountIntegrationId'], include: [
                {model: db.CompanyIntegration, as: 'companyIntegration', attributes: ['id', 'integrationId']}
            ]}
        ],
        where,
        order: [['agency', 'asc']],
        limit: 20,
        offset: 0,
    })

    return _.map(bankAccounts, (user) => user.get({ plain: true }))
    
}


export async function getCenterCost (search) {

    const session = await getServerSession(authOptions)

    const db = new AppContext()

    const where = []

    where.push({'$descricao$': {[Sequelize.Op.like]: `%${search.replace(' ', "%").toUpperCase()}%`}})

    const centerCosts = await db.CenterCost.findAll({
        attributes: ['id', 'description'],
        where,
        order: [['description', 'asc']],
        limit: 20,
        offset: 0,
    })

    return _.map(centerCosts, (item) => item.get({ plain: true }))
    
}

export async function getPaymentMethod (search) {
    
    const session = await getServerSession(authOptions)

    const db = new AppContext()

    const where = []

    //where.push({'$companyUsers.company.codigo_empresa$': session.company.companyBusinessId})

    //where.push({'$userName$': {[Sequelize.Op.like]: `%${search.replace(' ', "%").toUpperCase()}%`}})

    const paymentMethods = await db.PaymentMethod.findAll({
        attributes: ['id', 'name'],
        where: {
            name: {
                [Sequelize.Op.like]: `%${search.replace(/ /g, "%").toUpperCase()}%`
            }
        },
        order: [['name', 'asc']],
        limit: 20,
        offset: 0,
    })

    return _.map(paymentMethods, (item) => item.get({ plain: true }))
    
}