'use server'

import { AppContext } from "@/database"
import _ from "lodash"
import { literal, Op } from "sequelize"
import xml2js from 'xml2js'

export async function findAll({ company, dhEmi, cStat, limit = 50, offset = 0 }) {

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

export async function upload({ files }) {

  const db = new AppContext()

  await db.transaction(async (transaction) => {

    for (const file of files) {

      const arrayBuffer = await file.arrayBuffer()

      const buffer = Buffer.from(arrayBuffer)

      const xmlString = buffer.toString('utf-8')

      const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });

      const json = await parser.parseStringPromise(xmlString)

      if (!json.cteProc || !json.cteProc.protCTe) {
        throw new Error('CT-e invalido!')
      }
      
      const emit = await db.Company.findOne({attributes: ['codigo_empresa_filial'], where: [{cpfCnpj: json.cteProc.CTe.infCte.emit.CNPJ || json.cteProc.CTe.infCte.emit.CPF}], transaction})

      let cte = await db.Cte.findOne({attributes: ['id'], where: [{chaveCT: json.cteProc.protCTe.infProt.chCTe}], transaction})

      const sender = await db.Partner.findOne({attributes: ['codigo_pessoa', 'daysDeadlinePayment'], where: [{cpfCnpj: json.cteProc.CTe.infCte.rem.CNPJ || json.cteProc.CTe.infCte.rem.CPF}], transaction})

      if (!sender) {
        throw new Error('Remetente não está cadastrado!')
      }

      let recipient = await db.Partner.findOne({attributes: ['codigo_pessoa'], where: {cpfCnpj: json.cteProc.CTe.infCte.dest.CNPJ || json.cteProc.CTe.infCte.dest.CPF}, transaction})

      if (!recipient) {

        recipient = {
          companyBusinessId: companyBusinessId,
          cpfCnpj: json.cteProc.CTe.infCte.dest.CNPJ || json.cteProc.CTe.infCte.dest.CPF,
          name: json.cteProc.CTe.infCte.dest.xNome,
          surname: json.cteProc.CTe.infCte.dest.xNome,
          ISDestinatario: 1,
          ativo: 1
        }

        recipient = await db.Partner.create(recipient, {transaction})

      }

      cte = {
        
        companyId: companyId,

        id: cte?.id,

        nCT: json.cteProc.CTe.infCte.ide.nCT,
        cCT: json.cteProc.CTe.infCte.ide.cCT,
        serie: json.cteProc.CTe.infCte.ide.serie,
        chCTe: json.cteProc.protCTe.infProt.chCTe,
        tpCTe: json.cteProc.CTe.infCte.ide.tpCTe,
        dhEmi: format(parseISO(json.cteProc.CTe.infCte.ide.dhEmi), 'yyyy-MM-dd HH:mm:ss'),
        CFOP: json.cteProc.CTe.infCte.ide.CFOP,

        cStat: json.cteProc.protCTe.infProt.cStat,
        xMotivo: json.cteProc.protCTe.infProt.xMotivo,
        nProt: json.cteProc.protCTe.infProt.nProt,
        dhRecbto: format(parseISO(json.cteProc.protCTe.infProt.dhRecbto), 'yyyy-MM-dd HH:mm:ss'),

        codigoUnidade: 1,
        vTPrest: json.cteProc.CTe.infCte.vPrest.vTPrest,
        valorAReceber: json.cteProc.CTe.infCte.vPrest.vRec,

        recipientId: recipient.codigo_pessoa,
        takerId: sender.codigo_pessoa,

        xml: xmlString

      }

      if (json.cteProc.CTe.infCte.imp.ICMS.ICMS00) {
        cte.baseCalculo = json.cteProc.CTe.infCte.imp.ICMS.ICMS00.vBC
        cte.CST = json.cteProc.CTe.infCte.imp.ICMS.ICMS00.CST
      }

      if (json.cteProc.CTe.infCte.imp.ICMS.ICMS20) {
        cte.pRedBC = json.cteProc.CTe.infCte.imp.ICMS.ICMS20.pRedBC
        cte.baseCalculo = json.cteProc.CTe.infCte.imp.ICMS.ICMS20.vBC
        cte.CST = json.cteProc.CTe.infCte.imp.ICMS.ICMS20.CST
      }

      if (json.cteProc.CTe.infCte.imp.ICMS.ICMS45) {
        cte.baseCalculo = json.cteProc.CTe.infCte.imp.ICMS.ICMS45.vBC
        cte.CST = json.cteProc.CTe.infCte.imp.ICMS.ICMS45.CST
      }

      if (json.cteProc.CTe.infCte.imp.ICMS.ICMS60) {
        cte.pICMS = json.cteProc.CTe.infCte.imp.ICMS.ICMS60.pICMSSTRet
        cte.baseCalculo = json.cteProc.CTe.infCte.imp.ICMS.ICMS60.vBC
        cte.CST = json.cteProc.CTe.infCte.imp.ICMS.ICMS60.CST
      }

      if (cte.id) {

        await db.Cte.update(cte, {where: [{id: cte.id}], transaction})

      } else {

        const receivement = await db.FinancialMovement.create({
          companyId: companyId,
          partnerId: sender.id,
          documentNumber: cte.nCT,
          observation: `Recebimento do CT-e ${cte.nCT}`,
          total: cte.valorAReceber,
          releaseDate: cte.dhEmi,
          issueDate: cte.dhEmi,
          categorieId: 1766,
          createdAt: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
        }, {transaction})

        await db.FinancialMovementInstallment.create({
          observation: receivement.observation,
          installment: 1,
          dueDate: format(addDays(cte.dhEmi, sender?.daysDeadlinePayment || 0), "yyyy-MM-dd"),
          amount: cte.valorAReceber,
          createdAt: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
        }, {transaction})

        cte.receivementId = receivement.id

        await db.Cte.create(cte, {transaction})

      }

    }

  })

}

export async function addNfe({cteId, chNFe}) {

  const db = new AppContext()

  const nfe = await db.Nfe.findOne({attributes: ['codigo_nota'], where: [{chaveNf: chNFe}]})

  const cteNfe = await db.CteNfe.create({cteId, nfeId: nfe.codigo_nota})

  return cteNfe.toJSON()

}

export async function deleteNfe({id}) {

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

export async function dacte({id}) {

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

export async function xml({ id }) {

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