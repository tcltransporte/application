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

    //if (_.isEmpty(formData.user?.userId)) {
    //    throw new Error('Informe o usuário!');
    //}

    const session = await getServerSession(authOptions)

    const db = new AppContext()

    const { userName } = formData

    const companyId = session.company.codigo_empresa_filial

    const user = await db.User.findOne({where: [{userName}]})

    if (!user) {
        throw new Error('Usuário não existe!')
    }

    const exists = await db.CompanyUser.count({ where: [{ companyId, userId: user.userId }] })

    if (exists > 0) {
        throw new Error('Usuário já cadastrado!')
    }

    await db.CompanyUser.create({ companyId, userId: user.userId, isActive: true })


}