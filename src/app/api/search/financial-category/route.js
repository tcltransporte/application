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

        await sincronize.categories({search})

        const db = new AppContext()

        const where = []

        where.push({'$companyId$': session.company.codigo_empresa_filial})

        where.push({'$descricao$': {[Op.like]: `%${search.replace(' ', "%").toUpperCase()}%`}})

        //where.push({'$codigo_tipo_operacao$': operation})

        const financialCategories = await db.FinancialCategory.findAll({
            attributes: ['id', 'description'],
            where,
            order: [['description', 'asc']],
            limit: 20,
            offset: 0,
        })

        const data = _.map(financialCategories, (item) => item.get({ plain: true }))

        return Response.json(data)

    } catch (error) {

        return new Response(JSON.stringify({ message: error.message }), { status: 500 })

    }
}