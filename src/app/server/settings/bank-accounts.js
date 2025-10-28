"use server"

import { AppContext } from "@/database"
import { authOptions } from "@/libs/auth"
import _ from "lodash"
import { getServerSession } from "next-auth"

export async function findAll() {

  const session = await getServerSession(authOptions)

  //await getTinyCategories()

  const where = []

  where.push({'$CodigoEmpresaFilial$': session.company.codigo_empresa_filial})

  const db = new AppContext()

  const bankAccounts = await db.BankAccount.findAll({
    attributes: ['codigo_conta_bancaria', 'name', 'holder', 'agency', 'number'],
    include: [
      {model: db.Bank, as: 'bank', attributes: ['id', 'name', 'icon']}
    ],
    where,
    order: [['codigo_conta_bancaria', 'ASC']],
    //limit: 20,
    //offset: 0,
  })

  return _.map(bankAccounts, (bankAccount) => bankAccount.toJSON())

}

export async function findOne({ codigo_conta_bancaria }) {

  const session = await getServerSession(authOptions)

  const db = new AppContext()

  const bankAccount = await db.BankAccount.findOne({
    attributes: ["codigo_conta_bancaria", 'name', "agency", "number", 'externalId'],
    include: [
      {model: db.Bank, as: 'bank', attributes: ['id', 'code', 'name']}
    ],
    where: { codigo_conta_bancaria }
  })

  return bankAccount?.toJSON() ?? null

}

export async function upsert(values) {

  const session = await getServerSession(authOptions)

  const db = new AppContext()

  const { codigo_conta_bancaria, ...rest } = values

  if (codigo_conta_bancaria) {
    await db.BankAccount.update({ bankId: values.bank?.id, ...rest}, { where: { codigo_conta_bancaria } })
  } else {
    await db.BankAccount.create({
      companyId: session.company.codigo_empresa_filial,
      bankId: values.bank?.id,
      name: values.name,
      balance: 0,
      description: "",
      ...rest
    })
  }
  
}

export async function destroy({ codigo_conta_bancaria }) {
  const session = await getServerSession(authOptions)
  const db = new AppContext()
  return db.BankAccount.destroy({ where: { codigo_conta_bancaria } })
}