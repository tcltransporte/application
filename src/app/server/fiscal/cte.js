/*import fs from 'fs'
import { emitirEventoCte } from '@nfe-tools/cte'
import dotenv from 'dotenv'
import pdfMake from 'pdfmake/build/pdfmake.js'
import pdfFonts from 'pdfmake/build/vfs_fonts.js'

dotenv.config()
pdfMake.vfs = pdfFonts.pdfMake.vfs

// Envia a CC-e e retorna o XML do evento autorizado
export async function enviarCartaCorrecaoCte({ chave, cnpjEmitente, justificativa }) {
  const certificado = fs.readFileSync('./certs/certificado.pfx')
  const senhaCertificado = process.env.SENHA_CERTIFICADO

  const evento = {
    tipoEvento: '110110', // Carta de Correção
    versaoEvento: '3.00',
    chave,
    cnpj: cnpjEmitente,
    justificativa,
    numeroSequencialEvento: 1,
    ambiente: 'homologacao', // ou 'producao'
  }

  const resultado = await emitirEventoCte({
    certificado,
    senha: senhaCertificado,
    evento
  })

  if (!resultado.success) {
    throw new Error(`Erro ao enviar CC-e: ${resultado.mensagem}`)
  }

  return {
    xml: resultado.loteAssinado,
    justificativa,
    chave,
    protocolo: resultado.recibo
  }
}

// Gera o PDF da CC-e e retorna em base64
export async function gerarPdfCartaCorrecaoBase64({ chave, justificativa, protocolo }) {
  const docDefinition = {
    content: [
      { text: 'Carta de Correção Eletrônica - CT-e', style: 'header' },
      { text: '\n' },
      { text: `Chave de Acesso: ${chave}`, style: 'subheader' },
      { text: `Protocolo de autorização: ${protocolo}`, margin: [0, 5] },
      { text: '\n' },
      { text: 'Justificativa:', style: 'subheader' },
      { text: justificativa, margin: [0, 5] }
    ],
    styles: {
      header: { fontSize: 18, bold: true, alignment: 'center' },
      subheader: { fontSize: 12, bold: true }
    }
  }

  return new Promise((resolve, reject) => {
    const pdfDoc = pdfMake.createPdf(docDefinition)
    pdfDoc.getBase64(base64 => resolve(base64))
  })
}

// Exemplo de uso
async function processarCartaCorrecao() {
  try {
    const dados = {
      chave: '43180100000000000176570000000000031000000012',
      cnpjEmitente: '12345678000195',
      justificativa: 'Correção da razão social do remetente.'
    }

    const { chave, justificativa, protocolo } = await enviarCartaCorrecaoCte(dados)
    const base64 = await gerarPdfCartaCorrecaoBase64({ chave, justificativa, protocolo })

    // Se quiser salvar para teste:
    fs.writeFileSync('cce.pdf', Buffer.from(base64, 'base64'))

    console.log('PDF da CC-e gerado em base64 com sucesso!')
    return base64
  } catch (err) {
    console.error('Erro no processo:', err)
  }
}

processarCartaCorrecao()
*/