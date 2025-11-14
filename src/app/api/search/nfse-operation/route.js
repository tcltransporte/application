import { AppContext } from "@/database"
import { Op } from "sequelize"

export async function POST(request) {
    try {

        const { search } = await request.json()

        const db = new AppContext()

        const where = []

        where.push({
            [Op.or]: [
                { code: { [Op.like]: `%${search.replace(/ /g, "%").toUpperCase()}%` } },
                { description: { [Op.like]: `%${search.replace(/ /g, "%").toUpperCase()}%` } }
            ]
        })
        
        const nfseOperations = await db.NfseOperation.findAll({
            attributes: ['id', 'code', 'description'],
            order: [['code', 'asc']],
            where: where,
            limit: 20,
            offset: 0,
        })

        const data = nfseOperations.map((nfseOperation) => nfseOperation.toJSON())

        return Response.json(data)

    } catch (error) {

        return new Response(JSON.stringify({ message: error.message }), { status: 500 })

    }
}