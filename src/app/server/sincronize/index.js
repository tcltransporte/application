import * as tiny from '@/app/server/sincronize/tiny'

export async function partners({search = ''}) {
    
    await tiny.partners({ search })

}

export async function categories({search = ''}) {
    
    await tiny.categories({ search })

}

export async function payments({ start, end }) {
    
    await tiny.payments({ start, end })

}

export async function receivements({ start, end, situation }) {
    
    await tiny.receivements({ start, end, situation })

}

export async function transfer({date, originId, destinationId, amount, observation}) {

    await tiny.transfer({ date, originId, destinationId, amount, observation })

}