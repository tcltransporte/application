"use server"

import { AppContext } from "@/database"
import { authOptions } from "@/libs/auth"
import _ from "lodash"
import { getServerSession } from "next-auth"

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

export async function upsert(fiscal) {

  const db = new AppContext()

  return await db.transaction(async (transaction) => {

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

    return result.toJSON()

  })

}

export async function generate(id) {

  const db = new AppContext()

  const entry = await db.Fiscal.findOne({
    attributes: [],
    where: [{ id }]
  })

  let xml

  switch (entry) {
    case 1:

      break
    case 99:
      xml = await nfse(entry)
      break

    default:
      break
  }

}

async function nfse(entry) {
  
  const getCurrentDateTimeFormatted = (date) => {

    function pad(num, size = 2) {
      return String(num).padStart(size, "0");
    }

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hour = pad(date.getHours());
    const minute = pad(date.getMinutes());
    const second = pad(date.getSeconds());
    const millisecond = pad(date.getMilliseconds(), 3) + "0000"; // preencher para 7 dígitos
    
    // offset do fuso
    const offset = -date.getTimezoneOffset();
    const offsetSign = offset >= 0 ? "+" : "-";
    const offsetHours = pad(Math.floor(Math.abs(offset) / 60));
    const offsetMinutes = pad(Math.abs(offset) % 60);

    return `${year}-${month}-${day}T${hour}:${minute}:${second}.${millisecond}${offsetSign}${offsetHours}:${offsetMinutes}`;
  
  }
  
  const session = await getServerSession(authOptions)

  const db = new AppContext()

  return await db.transaction(async (transaction) => {

    const company = await db.Company.findOne({
      attributes: ['codigo_empresa_filial', 'cnpj', 'name', 'certificate', 'dpsEnvironment', 'dpsLastNum', 'dpsSerie', 'dpsRegimeCalculation', 'dpsRegimeSpecial', 'dpsOptingForSimpleNational'],
      include: [
        {model: db.City, as: 'city', attributes: ['codigo_municipio', 'name', 'ibge']}
      ],
      where: [
        {'codigo_empresa_filial': session.company.codigo_empresa_filial}
      ],
      transaction
    })

    const lastNum = company.dpsLastNum ? Number(company.dpsLastNum) : 0
    const numeroDps = lastNum + 1

    const certificate = JSON.parse(company.certificate)

    const url = "http://vps53636.publiccloud.com.br/application/services/dfe/nfse/generate";
        
    const now = new Date()
    now.setMinutes(now.getMinutes() - 180)

    const emission = getCurrentDateTimeFormatted(now)

    const dps = {
      "versao": "1.00",
      "informacoes": {
        "tipoAmbiente": Number(company.dpsEnvironment),
        "dhEmissao": emission,
        "versaoAplicacao": "OpenAC.NFSe.Nacional",
        "serie": String(company.dpsSerie),
        "numeroDps": numeroDps,
        "competencia": emission,
        "tipoEmitente": 1,
        "localidadeEmitente": String(company.city?.ibge),
        "substituida": null,
        "prestador": {
          "regime": {
            "optanteSimplesNacional": Number(company.dpsOptingForSimpleNational),
            "regimeApuracao": Number(company.dpsRegimeCalculation),
            "regimeEspecial": Number(company.dpsRegimeSpecial)
          },
          "cnpj": String(company.cnpj),
          "cpf": null,
          "nif": null,
          "codigoNaoNif": null,
          "numeroCAEPF": null,
          "inscricaoMunicipal": null,
          "nome": String(company.name),
          "endereco": null,
          "telefone": null,
          "email": "teste@teste.com"
        },
        "tomador": {
          "cnpj": "50834272000165",
          "cpf": null,
          "nif": null,
          "codigoNaoNif": null,
          "numeroCAEPF": null,
          "inscricaoMunicipal": null,
          "nome": "701453 Guilherme Venancio Freitas",
          "endereco": {
            "municipio": {
              "cep": "74663520",
              "codMunicipio": "5208707"
            },
            "logradouro": "Av Pedro Paulo de Souza",
            "numero": "1981",
            "complemento": null,
            "bairro": "Goiania 2"
          },
          "telefone": null,
          "email": null
        },
        "intermediario": null,
        "servico": {
          "localidade": {
            "codMunicipioPrestacao": "5208707",
            "codPaisPrestacao": null
          },
          "informacoes": {
            "codTributacaoNacional": "080201",
            "codTributacaoMunicipio": null,
            "descricao": "Referente ao serviço prestado",
            "codNBS": null,
            "codInterno": null
          },
          "servicoExterior": null,
          "informacoesLocacao": null,
          "obra": null,
          "evento": null,
          "exploracaoRodoviaria": null,
          "informacoesComplementares": null
        },
        "valores": {
          "valoresServico": {
            "valorRecebido": 0,
            "valor": 0.01
          },
          "valoresDesconto": null,
          "valoresDeducaoReducao": null,
          "tributos": {
            "municipal": {
              "issqn": 0,
              "codPais": null,
              "beneficio": null,
              "suspensao": null,
              "tipoImunidade": null,
              "aliquota": 0,
              "tipoRetencaoISSQN": 0
            },
            "federal": null,
            "total": {
              "valorTotal": 0,
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

    if (!response.ok) {
      throw new Error(result.message)
    }

    await db.Company.update({dpsLastNum: numeroDps}, {where: [{'codigo_empresa_filial': company.codigo_empresa_filial}], transaction})

    return result

  })

}