"use server"

import { AppContext } from "@/database"
import { authOptions } from "@/libs/auth"
import _ from "lodash"
import { getServerSession } from "next-auth"
import { Sequelize } from "sequelize"

export async function findAll() {

  const session = await getServerSession(authOptions)

  const db = new AppContext()

  const users = await db.CompanyUser.findAll({
    where: {
      companyId: session.company.codigo_empresa_filial,
    },
    include: [{
      model: db.User,
      as: 'user',
      attributes: ['userId', 'userName'],
      include: [
        {
          model: db.UserMember,
          as: 'userMember',
          attributes: ['email']
        }
      ]
    }],
    order: [
      [Sequelize.literal('CASE WHEN "isActive" IS NULL THEN 0 ELSE 1 END'), 'ASC'],
      [{ model: db.User, as: 'user' }, 'userName', 'ASC']
    ]
  })

  return _.map(users, (user) => user.get({ plain: true }))

}

/*
export async function getCompanyUser({ id }) {
  const db = new AppContext();
  const companyUser = await db.CompanyUser.findByPk(id, {
    include: [
      {
        model: db.User,
        as: 'user',
        include: [
          { model: db.UserMember, as: 'userMember' },
          {
            model: db.CompanyUser,
            as: 'companies',
            include: [{ model: db.Company, as: 'company', attributes: ['companyId', 'name'] }]
          }
        ]
      }
    ]
  });
  return companyUser?.get({ plain: true });
}*/

/*
export async function setCompanyUser({ companyUserId, companies }) {
  const db = new AppContext();

  await Promise.all(
    companies.map(c =>
      db.CompanyUser.update(
        { isActive: c.isActive },
        {
          where: { id: c.id }  // id da relação
        }
      )
    )
  );

  return { success: true };
}
*/

export async function onApprove({id}) {

  const db = new AppContext()

  await db.CompanyUser.update({isActive: true}, {where: [{id}]})

}

export async function onDisapprove({id}) {

  const db = new AppContext()

  await db.CompanyUser.destroy({where: [{id}]})

}

export async function disable({ id }) {

  const db = new AppContext()

  await db.CompanyUser.update({isActive: false}, {where: [{ id }]})

}

export async function getCompanyUser({id}) {

    const session = await getServerSession(authOptions)

    const db = new AppContext()

    const companies = await db.Company.findAll({
        attributes: ['codigo_empresa_filial', 'surname'],
        where: [{codigo_empresa: session.company.companyBusiness.codigo_empresa}]
    })

    const companyUser = await db.CompanyUser.findOne({
        include: [
            {model: db.User, as: 'user', include: [
                {
                    model: db.CompanyUser,
                    as: 'companyUsers',
                    include: [{ model: db.Company, as: 'company', attributes: ['codigo_empresa_filial', 'surname'] }]
                }
            ]}
        ],
        where: [{id: id}]
    })

    return {
        companies: _.map(companies, (item) => item.get({ plain: true })),
        companyUser: companyUser?.get({ plain: true })
    }

}

export async function setCompanyUser(formData) {

    //if (_.isEmpty(formData.user?.userId)) {
    //    throw new Error('Informe o usuário!');
    //}

    const session = await getServerSession(authOptions)

    const db = new AppContext()

    const { userName } = formData

    const companyId = session.company.codigo_empresa_filial

    const user = await db.User.findOne({where: [{userName}]})

    if (!user) {
        throw new Error('Usuário não existe!')
    }

    const exists = await db.CompanyUser.count({ where: [{ companyId, userId: user.userId }] })

    if (exists > 0) {
        throw new Error('Usuário já cadastrado!')
    }

    await db.CompanyUser.create({ companyId, userId: user.userId, isActive: true })

}

export async function deleteCompanyUser({companyUserId}) {

    const db = new AppContext()

    await db.CompanyUser.destroy({where: [{id: companyUserId}]})
    
}

export async function createCompanyUser({ companyId, userId }) {

    const db = new AppContext()

    const companyUser = await db.CompanyUser.create({ companyId, userId, isActive: true })

    return companyUser.toJSON()

}