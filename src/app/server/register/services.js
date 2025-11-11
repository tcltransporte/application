"use server"

import { AppContext } from "@/database"
import { authOptions } from "@/libs/auth"
import _ from "lodash"
import { getServerSession } from "next-auth"

export async function findAll({dueDate, limit = 50, offset}) {

    const session = await getServerSession(authOptions)

    const db = new AppContext()

    const where = []

    const services = await db.Service.findAndCountAll({
        attributes: ['id', 'name'],
        limit: limit,
        offset: offset * limit,
        order: [['name', 'asc']],
        where
    })

    return {
        request: {
            limit, offset
        },
        response: {
            rows: _.map(services.rows, (item) => item.toJSON()), count: services.count
        }
    }

}


export async function findOne({id}) {

  const session = await getServerSession(authOptions)

  const db = new AppContext()

  const where = []

  where.push({ id: id })

  const service = await db.Service.findOne({
      attributes: ['id', 'name'],
      where
  })

  return service.toJSON()

}

export async function upsert(values) {

  const session = await getServerSession(authOptions)

  const service = {
    id: values.id,
    companyId: session.company.codigo_empresa_filial,
    name: values.name
  }

  const db = new AppContext()

  return await db.transaction(async (transaction) => {

    let result

    if (!service.id) {
      
      result = await db.Service.create({ ...service }, { transaction })

    } else {
      
      await db.Service.update(
        { ...service },
        { where: { id: service.id }, transaction }
      )

      result = await db.Service.findByPk(service.id, { transaction })

    }

    return result.toJSON()

  })

}