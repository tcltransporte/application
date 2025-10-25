import { authOptions } from "@/libs/auth"
import { getServerSession } from "next-auth"

import { AppContext } from "@/database"

import _ from "lodash"

export async function POST(request) {
    try {

        const { search } = await request.json()

        const session = await getServerSession(authOptions)

        const db = new AppContext()

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
        })

        const data = companies.map((item) => item.toJSON())

        return Response.json(data)

    } catch (error) {

        return new Response(JSON.stringify({ message: error.message }), { status: 500 })

    }
}