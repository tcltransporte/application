"use server"

import { AppContext } from "@/database"
import { authOptions } from "@/libs/auth"
import { format } from "date-fns"
import _ from "lodash"
import { getServerSession } from "next-auth"
import { Op } from "sequelize"

export async function findAll({dueDate, limit = 50, offset}) {

    const session = await getServerSession(authOptions)

    const db = new AppContext()

    const where = []

    const fiscal = await db.Fiscal.findAndCountAll({
        attributes: ['id', 'documentNumber', 'value'],
        include: [
          {model: db.Partner, as: 'partner', attributes: ['codigo_pessoa', 'surname']}
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
            rows: _.map(fiscal.rows, (item) => item.toJSON()), count: fiscal.count
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

    const company = await db.Company.findOne({
      attributes: ['codigo_empresa_filial', 'dpsLastNum', 'dpsSerie'],
      where: [
        {'codigo_empresa_filial': session.company.codigo_empresa_filial}
      ],
      transaction
    })

    let companyId = session.company.codigo_empresa_filial
    let documentNumber
    let serie
    let date

    if (!values.companyId) {
      companyId = values.companyId
    }

    if (!values.date) {
      date = format(new Date(), "yyyy-MM-dd HH:mm:ss")
    }
    
    //99 - Nota Fiscal de Serviço NFS-e                                                                        
    if (values.documentTemplateId == 99) {

      if (!values.documentNumber) {
        documentNumber = (company.dpsLastNum ? Number(company.dpsLastNum) : 0) + 1
      }

      if (!values.serie) {
        serie = company.dpsSerie
      }
      
      await db.Company.update({ dpsLastNum: documentNumber }, { where: [{'codigo_empresa_filial': company.codigo_empresa_filial}], transaction })

    }

    const fiscal = {
      companyBusinessId: session.company.companyBusiness.codigo_empresa,
      companyId: companyId,
      documentTemplateId: values.documentTemplateId,
      localityId: values.locality.codigo_municipio,
      partnerId: values.partner.codigo_pessoa,
      documentNumber: documentNumber,
      serie: serie,
      date: date,
      amount: values.amount
    }

    let result

    if (!fiscal.id) {
      
      result = await db.Fiscal.create({ ...fiscal }, { transaction })

    } else {
      
      await db.Fiscal.update(
        { ...fiscal },
        { where: { id: fiscal.id }, transaction }
      )
      
      result = await db.Service.findByPk(fiscal.id, { transaction })

    }

    const keepIds = values.services.filter(s => s.id).map(s => s.id);

    for (const item of values.services) {
      const service = { serviceId: item.service?.id, description: item.service?.name, fiscalId: result.id, amount: item.amount, pISSQN: item.pISSQN, vISSQN: item.vISSQN }
      if (item.id) {
        await db.FiscalService.update(service, { where: { id: item.id }, transaction })
      } else {
        await db.FiscalService.create(service, { transaction })
      }
    }

    if (keepIds.length > 0) {
      await db.FiscalService.destroy({ where: { fiscalId: result.id, id: { [Op.notIn]: keepIds }}, transaction })
    }
    
    return result.toJSON()

  })

}

export async function generate(fiscals) {

  const db = new AppContext()

  for (const id of fiscals) {

    await db.transaction(async (transaction) => {

      const entry = await db.Fiscal.findOne({
        attributes: ['id', 'documentTemplateId'],
        where: {
          id,
          [Op.or]: [
            { status: { [Op.ne]: 100 } },
            { status: { [Op.is]: null } }
          ]
        },
        lock: transaction.LOCK.UPDATE,
        transaction,
      })

      if (!entry) {
        return
      }

      switch (entry.documentTemplateId) {
        case 99:
          await nfse(entry.id)
          break
        default:
          break
      }
      
    })

  }
}

async function nfse(id) {
  
  const db = new AppContext()

  return await db.transaction(async (transaction) => {

    const fiscal = await db.Fiscal.findOne({
      attributes: ['id', 'documentNumber', 'serie', 'date', 'amount', 'pISSQN', 'vISSQN'],
      include: [
        {model: db.Partner, as: 'partner', attributes: ['codigo_pessoa', 'typeId', 'cpfCnpj', 'name', 'surname'], include: [
          {model: db.Address, as: 'address', attributes: ['codigo_endereco', 'zipCode', 'street', 'number', 'complement', 'district'], include: [
            {model: db.City, as: 'city', attributes: ['codigo_municipio', 'ibge']}
          ]}
        ]},
        {model: db.Company, as: 'company', attributes: ['codigo_empresa_filial', 'name', 'cnpj', 'certificate', 'dpsEnvironment', 'dpsOptingForSimpleNational', 'dpsRegimeCalculation', 'dpsRegimeSpecial'], include: [
          {model: db.City, as: 'city', attributes: ['codigo_municipio', 'ibge']}
        ]},
        {model: db.City, as: 'locality', attributes: ['codigo_municipio', 'ibge']},
        {model: db.FiscalService, as: 'services', attributes: ['id', 'description']}
      ],
      where: [
        { id }
      ],
      transaction
    })

    const certificate = JSON.parse(fiscal.company.certificate)

    const url = "http://vps53636.publiccloud.com.br/application/services/dfe/nfse/generate";

    const now = new Date()

    const description = fiscal.services?.map(s => s.description).join('\n')

    let prestador = {
      cpf: null,
      cnpj: null,
      tipoEmitente: null
    }

    let tomador = {
      cpf: null,
      cnpj: null
    }

    if (fiscal.partner.typeId == 2) {
      tomador.cnpj = String(fiscal.partner.cpfCnpj)
    } else {
      tomador.cpf = String(fiscal.partner.cpfCnpj)
    }

    const companyCnpj = String(fiscal.company.cnpj).trim().replace(/\s+/g, ' ')

    if (_.size(companyCnpj) == 14) {
      prestador.cnpj = companyCnpj
      prestador.tipoEmitente = 1
    } else {
      prestador.cpf = companyCnpj
      prestador.tipoEmitente = 2
    }

    const dps = {
      "versao": "1.00",
      "informacoes": {
        "tipoAmbiente": Number(fiscal.company.dpsEnvironment),
        "dhEmissao": format(now, "yyyy-MM-dd'T'HH:mm:ss"),
        "versaoAplicacao": "OpenAC.NFSe.Nacional",
        "serie": String(fiscal.serie).trim().replace(/\s+/g, ' '),
        "numeroDps": fiscal.documentNumber,
        "competencia": format(now, "yyyy-MM-dd"),
        "tipoEmitente": prestador.tipoEmitente,
        "localidadeEmitente": String(fiscal.company.city?.ibge).trim().replace(/\s+/g, ' '),
        //"substituida": null,
        "prestador": {
          "regime": {
            "optanteSimplesNacional": Number(fiscal.company.dpsOptingForSimpleNational),
            "regimeApuracao": Number(fiscal.company.dpsRegimeCalculation),
            "regimeEspecial": Number(fiscal.company.dpsRegimeSpecial)
          },
          "cnpj": prestador.cnpj,
          "cpf": prestador.cpf,
          //"nif": null,
          //"codigoNaoNif": null,
          //"numeroCAEPF": null,
          //"inscricaoMunicipal": null,
          "nome": String(fiscal.company.name).trim().replace(/\s+/g, ' '),
          //"endereco": null,
          //"telefone": null,
          //"email": null
        },
        "tomador": {
          "cnpj": tomador.cnpj,
          "cpf": tomador.cpf,
          //"nif": null,
          //"codigoNaoNif": null,
          //"numeroCAEPF": null,
          //"inscricaoMunicipal": null,
          "nome": String(fiscal.partner.surname),
          "endereco": {
            "municipio": {
              "cep": String(fiscal.partner.address.zipCode),
              "codMunicipio": String(fiscal.partner.address.city.ibge)
            },
            "logradouro": String(fiscal.partner.address.street),
            "numero": String(fiscal.partner.address.number),
            "complemento": String(fiscal.partner.address.complement),
            "bairro": String(fiscal.partner.address.district)
          },
          //"telefone": null,
          //"email": null
        },
        "intermediario": null,
        "servico": {
          "localidade": {
            "codMunicipioPrestacao": String(fiscal.locality.ibge),
            //"codPaisPrestacao": null
          },
          "informacoes": {
            "codTributacaoNacional": "080201",
            //"codTributacaoMunicipio": null,
            "descricao": description,
            //"codNBS": null,
            //"codInterno": null
          },
          //"servicoExterior": null,
          //"informacoesLocacao": null,
          //"obra": null,
          //"evento": null,
          //"exploracaoRodoviaria": null,
          //"informacoesComplementares": null
        },
        "valores": {
          "valoresServico": {
            "valorRecebido": 0,
            "valor": Number(fiscal.amount)
          },
          //"valoresDesconto": null,
          //"valoresDeducaoReducao": null,
          "tributos": {
            "municipal": {
              "issqn": 0,
              //"codPais": null,
              //"beneficio": null,
              //"suspensao": null,
              //"tipoImunidade": null,
              //"aliquota": Number(fiscal.pISSQN),
              "tipoRetencaoISSQN": 0
            },
            //"federal": null,
            "total": {
              "valorTotal": Number(fiscal.amount),
              "porcentagemTotal": {
                "totalFederal": 0,
                "totalEstadual": 0,
                "totalMunicipal": 0
              },
              "indicadorTotal": 0,
              "percetualSimples": 0
            }
          }
        }
      }
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Cert-Base64": certificate.base64,
        "X-Cert-Password": certificate.password
      },
      body: JSON.stringify(dps)
    })

    const result = await response.json()

    if (response.ok) {
      await db.Fiscal.update({status: 100, reason: 'Autorizado o uso da NFS-e', xml: result.xmlAut, accessKey: result.chNFSe}, { where: [{ id: fiscal.id }] })
    } else {
      await db.Fiscal.update({status: 500, reason: result.message}, { where: [{ id: fiscal.id }] })
    }

  })

}

export async function xml({ id }) {

  const db = new AppContext()

  const fiscal = await db.Fiscal.findOne({
    attributes: ['accessKey', 'xml'],
    include: [
      {model: db.DocumentTemplate, as: 'documentTemplate', attributes: ['acronym']}
    ],
    where: { id }
  })

  const xmlString = fiscal.xml // conteúdo XML como string
  const base64 = Buffer.from(xmlString, 'utf-8').toString('base64')

  return {
    fileName: `${fiscal.documentTemplate.acronym}-${fiscal.accessKey}.xml`,
    base64,
  }
  
}