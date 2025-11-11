"use server"

import { AppContext } from "@/database"
import { authOptions } from "@/libs/auth"
import { format } from "date-fns"
import _ from "lodash"
import { getServerSession } from "next-auth"

import * as entries from '@/app/server/fiscal/entries'


export async function findAll({dueDate, limit = 50, offset}) {

    const session = await getServerSession(authOptions)

    const db = new AppContext()

    const where = []

    where.push({ companyId: session.company.codigo_empresa_filial })

    const orders = await db.Order.findAndCountAll({
        attributes: ['id', 'sequence', 'date', 'description'],
        include: [
          {model: db.Partner, as: 'customer', attributes: ['codigo_pessoa', 'surname']},
          {model: db.OrderFiscal, as: 'orderFiscals', attributes: ['id'], include: [
            {model: db.Fiscal, as: 'fiscal', attributes: ['id', 'status', 'reason', 'date', 'documentNumber', 'accessKey'], include: [
              {model: db.DocumentTemplate, as: 'documentTemplate', attributes: ['id', 'acronym']}
            ]}
          ]}
        ],
        limit: limit,
        offset: offset * limit,
        order: [['id', 'desc']],
        where
    })

    return {
        request: {
            limit, offset
        },
        response: {
            rows: _.map(orders.rows, (item) => item.toJSON()), count: orders.count
        }
    }

}

export async function findOne({id}) {

  const session = await getServerSession(authOptions)

  const db = new AppContext()

  const where = []

  where.push({ id: id })

  const order = await db.Order.findOne({
      attributes: ['id', 'sequence', 'description'],
      include: [
        {model: db.Partner, as: 'customer', attributes: ['codigo_pessoa', 'surname']},
        {model: db.OrderService, as: 'services', attributes: ['id'], include: [
          {model: db.Service, as: 'service', attributes: ['id', 'name']}
        ]}
      ],
      where
  })

  return order.toJSON()

}

export async function upsert(values) {

  const session = await getServerSession(authOptions)

  const db = new AppContext()

  return await db.transaction(async (transaction) => {

    let result

    const order = {
      ...values,
      companyId: session.company.codigo_empresa_filial,
      typeId: 5,
      sequence: '',
      date: format(new Date(), "dd/MM/yyyy HH:mm:ss"),
      userId: session.user.userId,
      description: ''
    }

    if (!order.id) {
      
      result = await db.Order.create(order, { transaction })

    } else {
      
      await db.Order.update(
        order,
        { where: { id: service.id }, transaction }
      )

      result = await db.Order.findByPk(order.id, { transaction })

    }

    return result.toJSON()

  })

}

export async function generate(id) {

  const session = await getServerSession(authOptions)

  const db = new AppContext()

  return await db.transaction(async (transaction) => {

    const where = []

    where.push({ id: id })

    const order = await db.Order.findOne({
        attributes: ['id', 'customerId'],
        where,
        transaction
    })

    //existe algum serviço => gerar nfse
    const fiscal = await entries.upsert(
      {
        companyId: session.company.codigo_empresa_filial,
        documentTemplateId: 99,
        partner: { codigo_pessoa: order.customerId },
        value: 0.01
      }
    )

    await entries.generate(fiscal.id)

    await db.OrderFiscal.create({ orderId: order.id, fiscalId: fiscal.id }, { transaction })

  })

}