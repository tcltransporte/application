import { authOptions } from "@/libs/auth"
import { getServerSession } from "next-auth"

import { AppContext } from "@/database"

import _ from "lodash"

export async function POST(request) {
    try {

        const { search } = await request.json()

        const session = await getServerSession(authOptions)

        const db = new AppContext()

        const where = []

        const banks = await db.Bank.findAll({
            attributes: ['id', 'code', 'name'],
            where,
            order: [['name', 'asc']],
            limit: 20,
            offset: 0,
        })

        const data = _.map(banks, (bank) => bank.toJSON())
        
        return Response.json(data)

    } catch (error) {

        return new Response(JSON.stringify({ message: error.message }), { status: 500 })

    }
}