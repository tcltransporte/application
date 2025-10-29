import { authOptions } from "@/libs/auth"
import { getServerSession } from "next-auth"

import { AppContext } from "@/database"
import { Op } from "sequelize"

import * as sincronize from '@/app/server/sincronize'
import _ from "lodash"

export async function POST(request) {
    try {

        const { search } = await request.json()

        const session = await getServerSession(authOptions)

        const db = new AppContext()

        const where = []

        where.push({'$CodigoEmpresaFilial$': session.company.codigo_empresa_filial})

        where.push({ nome_banco: { [Op.like]: `%${search.replace(/ /g, "%").toUpperCase()}%` }})

        const bankAccounts = await db.BankAccount.findAll({
            attributes: ['codigo_conta_bancaria', 'name', 'agency', 'number'],
            include: [
                {model: db.Bank, as: 'bank', attributes: ['id', 'name', 'icon']},
                {model: db.BankAccountIntegration, as: 'bankAccountIntegrations', attributes: ['id', 'typeBankAccountIntegrationId'], include: [
                    {model: db.CompanyIntegration, as: 'companyIntegration', attributes: ['id', 'integrationId']}
                ]}
            ],
            where,
            order: [['name', 'asc']],
            limit: 20,
            offset: 0,
        })

        const data = _.map(bankAccounts, (bankAccount) => bankAccount.toJSON())

        return Response.json(data)

    } catch (error) {

        return new Response(JSON.stringify({ message: error.message }), { status: 500 })

    }
}