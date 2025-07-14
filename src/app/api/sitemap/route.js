import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET() {
  const filePath = join(process.cwd(), 'web.sitemap.xml')
  let xml = readFileSync(filePath, 'utf8')

  const baseURL = 'https://global.tcltransporte.com.br'

  // Substitui ${URL} e normaliza barras invertidas para barras normais
  xml = xml.replace(/\$\{URL\}/g, baseURL).replace(/\\/g, '/')

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  })
}
