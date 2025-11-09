import { Sequelize } from "sequelize"

import { AppContext } from "@/database"

import _ from "lodash"

export async function POST(request) {
    try {

        const { search, stateId } = await request.json()

        const where = []

        if (search) {
            where.push({
                nome_municipio: {
                    [Sequelize.Op.like]: `%${search.replace(/ /g, "%").toUpperCase()}%`
                }
            })
        }

        if (stateId) {
            where.push({
                codigo_uf: stateId
            })
        }

        const db = new AppContext()

        const cities = await db.City.findAll({
            attributes: ['codigo_municipio', 'name'],
            include: [
                {model: db.State, as: 'state', attributes: ['codigo_uf', 'name', 'acronym']}
            ],
            order: [['name', 'asc']],
            where,
            limit: 20,
            offset: 0,
        })

        const data = cities.map((city) => city.toJSON())

        return Response.json(data)

    } catch (error) {

        return new Response(JSON.stringify({ message: error.message }), { status: 500 })

    }
}