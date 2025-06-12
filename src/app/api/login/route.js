// Next Imports
import { AppContext } from '@/database'
import { NextResponse } from 'next/server'

export async function POST(req) {

  const body = await req.json()
  
  const db = new AppContext()

  const user = await db.User.findOne({
    attributes: ['userId'],
    include: [
      {model: db.UserMember, as: 'userMember', attributes: ['password']},
    ],
    where: [{userName: body.username}]
  })

  if (user.userMember?.password != body.password) {
    return NextResponse.json({d: false})
  }

  return NextResponse.json({d: true})
  
}
