import { AppContext } from "@/database";
import formidable from "formidable";

export async function POST(req) {
  try {
    

    const formData = await req.formData()
    const files = formData.getAll('files')

    for (const file of files) {
      // ler o conteúdo com file.arrayBuffer() ou file.stream()
      console.log(file.stream())
    }

    return new Response(
      JSON.stringify({ message: 'deu crto' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

    return
    console.log(req)

    const db = new AppContext()

    const form = formidable({});

    const archives = await form.parse(req)

    await db.transaction(async (transaction) => {

      for (const file of archives[1].files) {

        const xml = fs.readFileSync(file.filepath, 'utf8')

        console.log(xml)

        const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });

        const json = await parser.parseStringPromise(xml)

        if (!json.cteProc || !json.cteProc.protCTe) {
          return
        }

        /*

        let cte = await db.Cte.findOne({attributes: ['id'], where: [{chaveCT: json.cteProc.protCTe.infProt.chCTe}], transaction})

        const sender = await db.Partner.findOne({attributes: ['id', 'diasPrazoPagamento'], where: [{cpfCnpj: json.cteProc.CTe.infCte.rem.CNPJ || json.cteProc.CTe.infCte.rem.CPF}], transaction})

        if (!sender) {
          throw new Error('Remetente não está cadastrado!')
        }

        let recipient = await db.Partner.findOne({where: {cpfCnpj: json.cteProc.CTe.infCte.dest.CNPJ || json.cteProc.CTe.infCte.dest.CPF}, transaction})

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
          dhEmi: dayjs(json.cteProc.CTe.infCte.ide.dhEmi).format('YYYY-MM-DD HH:mm:ss'),
          CFOP: json.cteProc.CTe.infCte.ide.CFOP,

          cStat: json.cteProc.protCTe.infProt.cStat,
          xMotivo: json.cteProc.protCTe.infProt.xMotivo,
          nProt: json.cteProc.protCTe.infProt.nProt,
          dhRecbto: dayjs(json.cteProc.protCTe.infProt.dhRecbto).format('YYYY-MM-DD HH:mm:ss'),

          codigoUnidade: 1,
          vTPrest: json.cteProc.CTe.infCte.vPrest.vTPrest,
          valorAReceber: json.cteProc.CTe.infCte.vPrest.vRec,

          recipientId: recipient.id,
          takerId: sender.id,

          xml

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

          const receivement = await db.Receivement.create({
            companyId: companyId,
            payerId: sender.id,
            documentNumber: cte.nCT,
            description: `Recebimento do CT-e ${cte.nCT}`,
            total: cte.valorAReceber,
            releaseDate: cte.dhEmi,
            issueDate: cte.dhEmi,
            categorieId: 1766,
            createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          }, {transaction})

          await db.ReceivementInstallment.create({
            receivementId: receivement.id,
            description: receivement.description,
            installment: 1,
            dueDate: dayjs(cte.dhEmi).add(sender?.diasPrazoPagamento || 0, 'day').format('YYYY-MM-DD'),
            amount: cte.valorAReceber,
            createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          }, {transaction})

          cte.receivementId = receivement.id

          await db.Cte.create(cte, {transaction})

        }*/

      }

    })

    res.status(200).json({})


  } catch (error) {
    console.error('Erro ao processar upload:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
