'use server'

import { AppContext } from "@/database"
import _ from "lodash"
import { Op, Sequelize } from "sequelize"

export async function getCtes({limit = 50, offset, cStat, dhEmi}) {

  const where = []

  /*
  if (search?.input) {

    if (search?.picker == 'nCT') {
      where.push({nCT: search.input.match(/\d+/g)})
    }

    if (search?.picker == 'sender') {
      where.push({'$shippiment.sender.RazaoSocial$': {[Sequelize.Op.like]: `%${search.input.replace(' ', "%")}%`}})
    }

    if (search?.picker == 'chCTe') {
      where.push({'$chaveCT$': search.input.match(/\d+/g)})
    }

  }*/

  const wherePending = {
    [Sequelize.Op.or]: [
      { cStat: { [Sequelize.Op.notIn]: [100, 101, 135] } },
      { cStat: { [Sequelize.Op.eq]: null } }
    ]
  }
  const whereAutorized = {cStat: [100]}
  const whereCanceled = {cStat: [101, 135]}

  if (dhEmi?.start && dhEmi?.end) {
    where.push({dhEmi: {[Op.between]: [dhEmi.start, dhEmi.end]}})
  }
  
  if (cStat == 'pending') {
    where.push(wherePending)
  }
  
  if (cStat == 'autorized') {
    where.push(whereAutorized)
  }

  if (cStat == 'canceled') {
    where.push(whereCanceled)
  }

  const db = new AppContext()

  let result

  await db.transaction(async (transaction) => {

    const ctes = await db.Cte.findAndCountAll({
      attributes: ['id', 'dhEmi', 'nCT', 'serie', 'chCTe', 'cStat', 'calculationBasis'],
      include: [
        {model: db.Shippiment, as: 'shippiment', include: [
          {model: db.Partner, as: 'sender', attributes: ['codigo_pessoa', 'cpfCnpj', 'surname']}
        ]},
        {model: db.Partner, as: 'recipient', attributes: ['codigo_pessoa', 'cpfCnpj', 'surname']},
        /*{model: db.Shippiment, as: 'shippiment', attributes: ['id'], include: [
          {model: db.Partner, as: 'sender', attributes: ['id', 'surname']}
        ]},
        {model: db.CteNfe, as: 'cteNfes', attributes: ['id', 'nfeId'], include: [
          {model: db.Nfe, as: 'nfe', attributes: ['id', 'chNFe']},
        ]},*/
      ],
      limit: limit,
      offset: offset * limit,
      order: [['dhEmi', 'desc']],
      where,
      transaction,
      //subQuery: false,
    })

    const all = await db.Cte.count({where, transaction})
    const pending = await db.Cte.count({where: [where, wherePending], transaction})
    const autorized = await db.Cte.count({where: [where, whereAutorized], transaction})
    const canceled = await db.Cte.count({where: [where, whereCanceled], transaction})

    const statusCount = {
      all, pending, autorized, canceled
    }

    result = {
      request: {
        dhEmi, cStat, limit, offset
      },
      response: {
        statusCount, rows: _.map(ctes.rows, (item) => item.toJSON()), count: ctes.count
      }
    }

  })

  return result
  
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