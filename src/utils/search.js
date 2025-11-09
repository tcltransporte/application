import { toast } from 'react-toastify'
import { ReturnStatusToken } from 'tedious/lib/token/token';

export async function company(search, signal) {
    try {

        const response = await fetch('/api/search/company', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ search }),
            signal
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message)
        }

        return data

    } catch (error) {
        if (error.name === 'AbortError') {
            return []
        }
        toast.error(error.message)
        return []
    }
}

export async function state(search, signal) {
    try {

        const response = await fetch('/api/search/state', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ search }),
            signal
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message)
        }

        return data

    } catch (error) {
        if (error.name === 'AbortError') {
            return []
        }
        toast.error(error.message)
        return []
    }
}


export async function city(search, stateId, signal) {
    try {

        const response = await fetch('/api/search/city', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ search, stateId }),
            signal
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message)
        }

        return data

    } catch (error) {
        if (error.name === 'AbortError') {
            return []
        }
        toast.error(error.message)
        return []
    }
}

export async function user(search) {
    
    const session = await getServerSession(authOptions)

    const db = new AppContext()

    const where = []

    where.push({'$companyUsers.company.codigo_empresa$': session.company.companyBusiness.codigo_empresa})

    where.push({'$userName$': {[Sequelize.Op.like]: `%${search.replace(' ', "%").toUpperCase()}%`}})

    const users = await db.User.findAll({
        attributes: ['userId', 'userName'],
        include: [
            {
                model: db.CompanyUser,
                as: 'companyUsers',
                required: true,
                attributes: ['id'],
                include: [
                    {
                        model: db.Company,
                        as: 'company',
                        required: true,
                        attributes: ['codigo_empresa', 'companyBusinessId'],
                        where: {
                            codigo_empresa: session.company.codigo_empresa_filial
                        }
                    }
                ]
            }
        ],
        where: {
            userName: {
                [Sequelize.Op.like]: `%${search.replace(/ /g, "%").toUpperCase()}%`
            }
        },
        order: [['userName', 'asc']],
        limit: 20,
        offset: 0,
    })

    return _.map(users, (user) => user.get({ plain: true }))
    
}

export async function partner(search, signal) {
    try {

        const response = await fetch('/api/search/partner', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ search }),
            signal
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message)
        }

        return data

    } catch (error) {
        
        return exception(error)
        
    }
}

export async function financialCategory(search, signal) {
    try {

        const response = await fetch('/api/search/financial-category', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ search }),
            signal
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message)
        }

        return data

    } catch (error) {
        
        return exception(error)

    }
}

export async function bank(search, signal) {
    try {

        const response = await fetch('/api/search/bank', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ search }),
            signal
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message)
        }

        return data

    } catch (error) {

        return exception(error)

    }
}

export async function bankAccount(search, signal) {
    try {

        const response = await fetch('/api/search/bank-account', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ search }),
            signal
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message)
        }

        return data

    } catch (error) {

        return exception(error)

    }
}

export async function centerCost(search) {

    const session = await getServerSession(authOptions)

    const db = new AppContext()

    const where = []

    where.push({'$descricao$': {[Sequelize.Op.like]: `%${search.replace(' ', "%").toUpperCase()}%`}})

    const centerCosts = await db.CenterCost.findAll({
        attributes: ['id', 'description'],
        where,
        order: [['description', 'asc']],
        limit: 20,
        offset: 0,
    })

    return _.map(centerCosts, (item) => item.get({ plain: true }))
    
}

export async function paymentMethod(search) {
    
    const session = await getServerSession(authOptions)

    const db = new AppContext()

    const where = []

    //where.push({'$companyUsers.company.codigo_empresa$': session.company.companyBusinessId})

    //where.push({'$userName$': {[Sequelize.Op.like]: `%${search.replace(' ', "%").toUpperCase()}%`}})

    const paymentMethods = await db.PaymentMethod.findAll({
        attributes: ['id', 'name'],
        where: {
            name: {
                [Sequelize.Op.like]: `%${search.replace(/ /g, "%").toUpperCase()}%`
            }
        },
        order: [['name', 'asc']],
        limit: 20,
        offset: 0,
    })

    return _.map(paymentMethods, (item) => item.get({ plain: true }))
    
}

function exception(error) {

    if (error.name === 'AbortError') {
        return []
    }
    
    toast.error(error.message)

    return []
}