import { authOptions } from "@/libs/auth"
import { getServerSession } from "next-auth"

import { AppContext } from "@/database"
import { Op } from "sequelize"

import * as sincronize from '@/app/server/sincronize'

export async function POST(request) {
    try {

        const { search } = await request.json()

        const session = await getServerSession(authOptions)

        await sincronize.partners({search})

        const db = new AppContext()

        const where = []

        where.push({ '$nome$': { [Op.like]: `%${search.replace(/ /g, "%").toUpperCase()}%` }})

        where.push({ '$companyId$': session.company.codigo_empresa_filial })
        
        where.push({ '$ativo$': 1 })

        const partners = await db.Partner.findAll({
            attributes: ['codigo_pessoa', 'surname'],
            order: [['surname', 'asc']],
            where: where,
            limit: 20,
            offset: 0,
        })

        const data = partners.map((item) => item.get({ plain: true }))

        return Response.json(data)

    } catch (error) {

        return new Response(JSON.stringify({ message: error.message }), { status: 500 })

    }
}