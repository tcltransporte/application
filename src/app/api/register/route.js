// Next Imports
import { checkUserExists } from '@/app/server/register.controller'

import { AppContext } from '@/database'
//import { checkUserExists } from '@/views/Register.controller'
import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req) {
  const body = await req.json()
  const db = new AppContext()

  let companyId = null
  let companyBusinessId = null

  let isActive = null

  await db.transaction(async (transaction) => {
    
    if (await checkUserExists(body.userName)) {
      throw new Error('Usuário já existe')
    }

    let company = await db.Company.findOne({
      where: [{ cnpj: body.cnpj.replace(/\D/g, '') }],
      transaction
    })

    if (!company) {

      const companyBusiness = await db.CompanyBusiness.create(
        { description: body.description },
        { transaction }
      )

      companyBusinessId = companyBusiness.codigo_empresa

      let codigo_empresa_filial = await db.Company.max('codigo_empresa_filial', { transaction })

      codigo_empresa_filial = (codigo_empresa_filial || 0) + 1

      company = await db.Company.create(
        {
          codigo_empresa_filial,
          companyBusinessId: companyBusiness.codigo_empresa,
          cnpj: body.cnpj.replace(/\D/g, ''),
          name: body.description,
          surname: 'MATRIZ'
        },
        { transaction }
      )

      isActive = true

    } else {

      companyBusinessId = company.companyBusinessId

    }

    companyId = company.codigo_empresa_filial

    const applicationId = 'E6E3D7C4-B03E-4398-B138-F15B069B5FEE'

    const user = await db.User.create(
      {
        applicationId,
        userId: uuidv4(),
        userName: body.userName,
        loweredUserName: body.userName
      },
      { transaction }
    )

    await db.UserMember.create(
      {
        applicationId,
        userId: user.userId,
        password: body.password,
        passwordSalt: ''
      },
      { transaction }
    )

    await db.CompanyUser.create(
      {
        companyId: companyId,
        userId: user.userId,
        isActive
      },
      { transaction }
    )

  })

  if (isActive) {
    return NextResponse.json(
      {
        status: 200,
        companyId,
        companyBusinessId
      },
      { status: 200 }
    )
  } else {
    return NextResponse.json(
      {
        status: 201,
        message: 'Cadastro criado, mas pendente de aprovação.'
      },
      { status: 201 }
    )
  }
  
}