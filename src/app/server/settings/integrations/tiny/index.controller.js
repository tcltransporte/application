"use server"

import { AppContext } from "@/database"

import { authOptions } from "@/libs/auth"
import _ from "lodash"
import { getServerSession } from "next-auth"

export async function submit(values) {

    const session = await getServerSession(authOptions)

    const db = new AppContext()
  
    await db.CompanyIntegration.create({
        companyId: session.company.codigo_empresa_filial,
        integrationId: '420E434C-CF7D-4834-B8A6-43F5D04E462A',
        options: `${JSON.stringify({"refresh_token": refresh_token})}`,
        isActive: true
    })

}