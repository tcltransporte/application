'use server'

import { AppContext } from "@/database"
import _ from "lodash"
import { literal, Op, Sequelize } from "sequelize"

export async function getCtes({ company, dhEmi, cStat, limit = 50, offset = 0 }) {

  const db = new AppContext()

  const where = []

  if (dhEmi?.start && dhEmi?.end) {
    where.push({dhEmi: { [Op.between]: [dhEmi.start, dhEmi.end] }})
  }

  if (company?.codigo_empresa_filial) {
    where.push({
      '$IDEmpresaFilial$': company.codigo_empresa_filial
    })
  }

  // Filtro por status (opcional)
  const statusFilter = [];
  if (cStat === "pending") {
    statusFilter.push({cStat: { [Op.or]: { [Op.notIn]: [100, 101, 135], [Op.eq]: null } }})
  } else if (cStat === "autorized") {
    statusFilter.push({cStat: 100})
  } else if (cStat === "canceled") {
    statusFilter.push({cStat: { [Op.in]: [101, 135] }})
  }

  const count = await db.Cte.count({ where: [ ...where, ...statusFilter ] });

  const rows = await db.Cte.findAll({
    where: [ ...where, ...statusFilter ],
    attributes: ["id", "dhEmi", "nCT", "serie", "chCTe", "cStat", "calculationBasis"],
    include: [
      { model: db.Shippiment, as: "shippiment", include:
        [
          { model: db.Partner, as: "sender", attributes: ["codigo_pessoa", "cpfCnpj", "surname"] }
        ]
      },
      { model: db.Partner, as: "recipient", attributes: ["codigo_pessoa", "cpfCnpj", "surname"] },
      { model: db.CteNfe, as: "nfes", attributes: ["id", "nfeId"], include:
        [
          { model: db.Nfe, as: "nfe", attributes: ["codigo_nota", "chNFe"] }
        ]
      },
    ],
    order: [["dhEmi", "desc"], ['nCT', 'desc']],
    limit,
    offset: offset * limit, // se offset for número da página
  });

  const statusTotalsQuery = await db.Cte.findAll({
    where,
    attributes: [
      [literal(`SUM(CASE WHEN cStat = 100 THEN 1 ELSE 0 END)`), "autorized"],
      [literal(`SUM(CASE WHEN cStat IN (101, 135) THEN 1 ELSE 0 END)`), "canceled"],
      [literal(`SUM(CASE WHEN cStat IS NULL OR cStat NOT IN (100, 101, 135) THEN 1 ELSE 0 END)`), "pending"],
      [literal(`COUNT(*)`), "all"],
    ],
    raw: true,
  });

  const statusCount = statusTotalsQuery[0];

  return {
    request: { company, dhEmi, cStat, limit, offset },
    response: {
      statusCount,
      rows: rows.map(r => r.toJSON()),
      count, // total de registros considerando o filtro de status → correta para paginação
    },
  };
}

export async function onAddNfe({cteId, chNFe}) {

  const db = new AppContext()

  const nfe = await db.Nfe.findOne({attributes: ['codigo_nota'], where: [{chaveNf: chNFe}]})

  const cteNfe = await db.CteNfe.create({cteId, nfeId: nfe.codigo_nota})

  return cteNfe.toJSON()

}

export async function onDeleteNfe({id}) {

  const db = new AppContext()

  const cteNfe = await db.CteNfe.findOne({
    attributes: ['id'],
    include: [
      {model: db.Cte, as: 'cte', attributes: ['id', 'cStat']}
    ],
    where: [{id}]
  })

  if (cteNfe.cte.cStat == 100) {
    throw new Error('Não é possível excluir uma nota fiscal vinculada a um conhecimento de transporte autorizado!')
  }

  await cteNfe.destroy()

}

export async function onDacte({id}) {

  const db = new AppContext()

  const cte = await db.Cte.findOne({attributes: ['xml'], where: [{ id }]})

  const url = `http://vps53636.publiccloud.com.br/sped-da/dacte.php`;
  const headers = {
    'Content-Type': 'application/json'
  };

  const postData = {
    logo: "TCL Transporte e Logistica.jpeg",
    xml: Buffer.from(cte.xml.toString(), 'utf8').toString('base64')
  };

  try {

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(postData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const pdfBuffer = await response.arrayBuffer();
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

    console.log(pdfBase64)
    
    return {pdf: pdfBase64}

  } catch (error) {
    console.error('Erro na solicitação:', error);
    throw error;
  }

}

export async function onDownload({ id }) {

  const db = new AppContext()

  const cte = await db.Cte.findOne({
    attributes: ['chCTe', 'xml'],
    where: { id }
  })

  const xmlString = cte.xml // conteúdo XML como string
  const base64 = Buffer.from(xmlString, 'utf-8').toString('base64')

  return {
    fileName: `CTe-${cte.chCTe}.xml`,
    base64,
  }
  
}