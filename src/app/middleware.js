// middleware.js
import { NextResponse } from 'next/server'

export function middleware(request) {
  const url = request.nextUrl.clone()
  const response = NextResponse.next()
  response.headers.set('x-url', url.toString())
  return response
}

export const config = {
  matcher: ['/((?!_next|favicon|.*\\..*).*)'], // aplica a todas as páginas, exceto arquivos estáticos
}