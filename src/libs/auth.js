import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { AppContext } from '@/database'
import _ from 'lodash'
import { Op } from 'sequelize'

// Classe de erro personalizada
class AuthError extends Error {
  constructor(status, message, extra = {}) {
    super(message)
    this.name = 'AuthError'
    this.status = status
    this.extra = extra
  }
}

async function validateUserByEmail({ email, password, companyBusinessId, companyId, validatePassword = true }) {
  const db = new AppContext()

  const user = await db.User.findOne({
    attributes: ['userId', 'userName'],
    include: [
      {
        model: db.UserMember,
        as: 'userMember',
        attributes: ['userId', 'email', 'password'],
      },
    ],
    where: {
      [Op.or]: [
        { userName: email },
        { '$userMember.email$': email },
      ],
    },
  })

  if (_.isEmpty(user)) throw new AuthError(201, 'Usuário não encontrado!')

  if (validatePassword) {
    if (!process.env.VALIDATE_USER) throw new AuthError(201, 'VALIDATE_USER não configurado.')

    const response = await fetch(process.env.VALIDATE_USER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user.userName, password }),
    })

    const result = await response.json()
    if (!result.d) throw new AuthError(201, 'Senha incorreta!')
  }

  const { company, isActive } = await validateCompanyAccess(user.userId, companyBusinessId, companyId, db)

  return {
    user: {
      userId: user.userId,
      userName: user.userName,
    },
    company,
    isActive,
  }
}

async function validateCompanyAccess(userId, companyBusinessId, companyId, db) {
  const whereCompanyBusiness = companyBusinessId ? { codigo_empresa: Number(companyBusinessId) } : {}
  const whereCompany = companyId ? { codigo_empresa_filial: Number(companyId) } : {}

  const companyBusinesses = await db.CompanyBusiness.findAll({
    where: {
      ...whereCompanyBusiness,
      '$companies.companyUsers.userId$': userId,
    },
    include: [
      {
        model: db.Company,
        as: 'companies',
        where: whereCompany,
        required: true,
        include: [
          {
            model: db.CompanyUser,
            as: 'companyUsers',
            required: true,
          },
        ],
        attributes: ['codigo_empresa_filial', 'name', 'surname'],
      },
    ],
    order: [['companies', 'codigo_empresa_filial', 'ASC']],
  })

  if (_.isEmpty(companyBusinesses)) throw new AuthError(201, 'Nenhuma empresa encontrada!')
  if (companyBusinesses.length > 1) {
    throw new AuthError(202, 'Mais de uma empresa encontrada!', {
      companyBusinessId,
      companyBusinesses,
    })
  }

  const selectedCompany = companyBusinesses[0]?.companies?.[0]
  if (!selectedCompany) throw new AuthError(201, 'Nenhuma filial encontrada!')

  if (companyBusinesses[0].companies.length > 1) {
    throw new AuthError(202, 'Mais de uma filial encontrada!', {
      companyBusinessId: companyBusinesses[0].codigo_empresa,
      companyBusinesses,
      companies: companyBusinesses[0].companies,
    })
  }

  const companyUser = selectedCompany?.companyUsers?.[0]
  if (companyUser?.isActive == null) throw new AuthError(201, 'Usuário pendente de aprovação!')
  if (!companyUser.isActive) throw new AuthError(201, 'Usuário desativado!')

  const company = _.cloneDeep(selectedCompany.dataValues)
  company.companyBusiness = companyBusinesses[0].dataValues

  return { company, isActive: companyUser.isActive }
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      type: 'credentials',
      credentials: {},
      async authorize(credentials) {
        try {
          const { email, password, companyBusinessId, companyId } = credentials || {}
          return await validateUserByEmail({ email, password, companyBusinessId, companyId })
        } catch (error) {
          const err = error instanceof AuthError
            ? error
            : new AuthError(201, error.message || 'Erro interno')

          throw new Error(JSON.stringify({ status: err.status, message: err.message, ...err.extra }))
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 1 * 24 * 60 * 60, // 1 dia
  },

  pages: {
    signIn: '/login',
  },

  callbacks: {
    async jwt({ token, user, account }) {
      const db = new AppContext()

      // Login com Google
      if (account?.provider === 'google' && user?.email) {
        try {
          const result = await validateUserByEmail({ email: user.email, validatePassword: false })
          token.user = result.user
          token.company = result.company
          token.isActive = result.isActive
          return token
        } catch (error) {
          try {
            throw new Error(JSON.stringify(JSON.parse(error.message)))
          } catch {
            throw new Error(JSON.stringify({ status: 500, message: 'Erro ao validar login com Google.' }))
          }
        }
      }

      // Login com credenciais
      if (user) {
        token.user = user.user
        token.company = user.company
      }

      if (token.user?.userId) {
        const companyUser = await db.CompanyUser.findOne({
          where: { userId: token.user.userId },
          attributes: ['isActive'],
        })
        token.isActive = companyUser?.isActive ?? false
      }

      return token
    },

    async session({ session, token }) {
      session.user = token.user
      session.company = token.company
      session.isActive = token.isActive ?? false
      return session
    },
  },
}