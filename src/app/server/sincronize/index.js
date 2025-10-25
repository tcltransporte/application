import * as tiny from '@/app/server/sincronize/tiny'
import { format } from 'date-fns'

export async function partners({search = ''}) {
    
    await tiny.partners({ search })

}

export async function categories({search = ''}) {
    
    await tiny.categories({ search })

}

export async function payments({ start, end }) {
    
    await tiny.payments({ start: format(start, "dd/MM/yyyy"), end: format(end, "dd/MM/yyyy") })

}

export async function receivements({ start, end }) {
    
    await tiny.receivements({ start: format(start, "dd/MM/yyyy"), end: format(end, "dd/MM/yyyy") })

}

export async function transfer({date, originId, destinationId, amount, observation}) {

    await tiny.transfer({ date, originId, destinationId, amount, observation })

}