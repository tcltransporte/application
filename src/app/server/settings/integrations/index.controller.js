"use server"

import { AppContext } from "@/database"

import { authOptions } from "@/libs/auth"
import _ from "lodash"
import { getServerSession } from "next-auth"

export async function getIntegrations() {

  const db = new AppContext()

  let integrations = await db.Integration.findAll()

  return _.map(integrations, (item) => item.get({ plain: true }))

}

export async function getMyIntegrations() {

    const session = await getServerSession(authOptions)

    const db = new AppContext()

    let companyIntegration = await db.CompanyIntegration.findAll({
        attributes: ['id', 'options', 'isActive'],
        include: [
            { model: db.Integration, as: 'integration', attributes: ['id', 'name', 'description', 'icon'] }
        ],
        where: [{companyId: session.company.codigo_empresa_filial}]
    })

    return _.map(companyIntegration, (item) => item.get({ plain: true }))

}

export async function onDisconnect({id}) {

    const db = new AppContext()

    await db.CompanyIntegration.destroy({where: [{id}]})

}

export async function onToggleActive({id, isActive}) {

    const db = new AppContext()

    await db.CompanyIntegration.update({isActive}, {where: [{id}]})

}