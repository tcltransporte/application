import { authOptions } from "@/libs/auth"
import { getServerSession } from "next-auth"
import { Sequelize } from "sequelize"

import { AppContext } from "@/database"

import _ from "lodash"

export async function POST(request) {
    try {

        const { search } = await request.json()

        const session = await getServerSession(authOptions)

        const db = new AppContext()

        const states = await db.State.findAll({
            attributes: ['codigo_uf', 'name'],
            order: [['name', 'asc']],
            where: {
                nome_uf: {
                    [Sequelize.Op.like]: `%${search.replace(/ /g, "%").toUpperCase()}%`
                }
            },
            limit: 20,
            offset: 0,
        })

        const data = states.map((state) => state.toJSON())

        return Response.json(data)

    } catch (error) {

        return new Response(JSON.stringify({ message: error.message }), { status: 500 })

    }
}