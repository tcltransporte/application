"use server"

import { AppContext } from "@/database"
import { authOptions } from "@/libs/auth"
import _ from "lodash"
import { getServerSession } from "next-auth"

export async function getCompanyUser({id}) {

    //const session = await getServerSession(authOptions)

    const db = new AppContext()

    const companyUser = await db.CompanyUser.findOne({
        include: [
            {model: db.User, as: 'user'}
        ],
        where: [{id: id}]
    })

    return companyUser?.get({ plain: true })

}

export async function setCompanyUser(formData) {

    if (_.isEmpty(formData.user?.userId)) {
        throw new Error('Informe o usuário!');
    }

    const session = await getServerSession(authOptions)

    const db = new AppContext()

    const { userId } = formData.user
    const companyId = session.company.codigo_empresa_filial

    if (_.isEmpty(formData.companyUserId)) {

        const exists = await db.CompanyUser.count({ where: [{ companyId, userId }] })

        if (exists > 0) {
            throw new Error('Usuário já cadastrado!')
        }

        await db.CompanyUser.create({ companyId, userId, isActive: true })

    } else {

        await db.CompanyUser.update({ companyId, userId }, { where: [{ id: formData.companyUserId }] })

    }

}