import { AppContext } from '@/database'
import { addDays, format, parseISO } from 'date-fns'
import fs from 'fs'
import path from 'path'
import xml2js from 'xml2js'

export async function POST(req) {
  try {

    const db = new AppContext()

    const uploadedFiles = []

    await db.transaction(async (transaction) => {

      const { files } = await req.json() // recebe JSON do cliente

      //const uploadDir = path.join(process.cwd(), 'uploads')
      //if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

      for (const file of files) {
        //const filePath = path.join(uploadDir, file.name)

        // converte array de bytes de volta para Buffer
        const buffer = Buffer.from(file.data)

        const xmlString = buffer.toString('utf-8')

        const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });

        const json = await parser.parseStringPromise(xmlString)

        if (!json.cteProc || !json.cteProc.protCTe) {
          return
        }

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

          //await db.Cte.update(cte, {where: [{id: cte.id}], transaction})

          console.log(cte)

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
            createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          }, {transaction})

          await db.FinancialMovementInstallment.create({
            observation: receivement.observation,
            installment: 1,
            dueDate: format(addDays(cte.dhEmi, sender?.daysDeadlinePayment || 0),"yyyy-MM-dd"),
            amount: cte.valorAReceber,
            createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
          }, {transaction})

          cte.receivementId = receivement.id

          //console.log(cte)

          await db.Cte.create(cte, {transaction})

        }

        uploadedFiles.push({ name: file.name, size: buffer.length })

      }

    })

    return new Response(JSON.stringify({ uploadedFiles }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
