"use server"

import { AppContext } from "@/database"
import { authOptions } from "@/libs/auth"
import { format } from "date-fns"
import _ from "lodash"
import { getServerSession } from "next-auth"

import * as entries from '@/app/server/fiscal/entries'
import { Op } from "sequelize"


export async function findAll({dueDate, limit = 50, offset}) {

    const session = await getServerSession(authOptions)

    const db = new AppContext()

    const where = []

    where.push({ companyId: session.company.codigo_empresa_filial })

    const orders = await db.Order.findAndCountAll({
        attributes: ['id', 'sequence', 'date', 'description'],
        include: [
          {model: db.Company, as: 'company', attributes: ['codigo_empresa_filial', 'surname']},
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
        {model: db.Company, as: 'company', attributes: ['codigo_empresa_filial', 'surname']},
        {model: db.City, as: 'locality', attributes: ['codigo_municipio', 'name'], include: [
          {model: db.State, as: 'state', attributes: ['codigo_uf', 'acronym']}
        ]},
        {model: db.Partner, as: 'customer', attributes: ['codigo_pessoa', 'surname']},
        {model: db.OrderService, as: 'services', attributes: ['id', 'amount', 'pISSQN', 'vISSQN'], include: [
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
      localityId: values.locality?.codigo_municipio,
      companyId: session.company.codigo_empresa_filial,
      customerId: values.customer?.codigo_pessoa,
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
        { where: { id: order.id }, transaction }
      )

      result = await db.Order.findByPk(order.id, { transaction })

    }

    const keepIds = values.services.filter(s => s.id).map(s => s.id);

    for (const item of values.services) {
      const service = { orderId: result.id, amount: item.amount, pISSQN: item.pISSQN, vISSQN: item.vISSQN, serviceId: item.service.id }
      if (item.id) {
        await db.OrderService.update(service, { where: { id: item.id }, transaction })
      } else {
        await db.OrderService.create(service, { transaction })
      }
    }

    if (keepIds.length > 0) {
      await db.OrderService.destroy({ where: { orderId: result.id, id: { [Op.notIn]: keepIds }}, transaction })
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
        attributes: ['id', 'companyId', 'localityId', 'customerId'],
        include: [
          {model: db.OrderService, as: 'services', attributes: ['id', 'amount', 'pISSQN', 'vISSQN'], include: [
            {model: db.Service, as: 'service', attributes: ['id', 'name']}
          ]}
        ],
        where,
        transaction
    })

    const services = []

    for(const item of order.services){
      services.push({
        service: { id: item.service?.id },
        description: item.service?.name,
        amount: item.amount,
        pISSQN: item.pISSQN,
        vISSQN: item.vISSQN,
      })
    }
        
    const totalAmount = services.reduce((sum, s) => sum + s.amount, 0)
    const totalValorISSQN = services.reduce((sum, s) => sum + s.vISSQN, 0)
    const totalAliqISSQN = totalAmount ? (totalValorISSQN / totalAmount) * 100 : 0

    //existe algum serviço => gerar nfse
    const fiscal = await entries.upsert(
      {
        companyId: order.companyId,
        documentTemplateId: 99,
        locality: { codigo_municipio: order.localityId },
        partner: { codigo_pessoa: order.customerId },
        amount: totalAmount,
        pISSQN: totalAliqISSQN,
        vISSQN: totalValorISSQN,
        services: services
      }
    )

    await db.OrderFiscal.create({ orderId: order.id, fiscalId: fiscal.id }, { transaction })

    await entries.generate(fiscal.id)

  })

}