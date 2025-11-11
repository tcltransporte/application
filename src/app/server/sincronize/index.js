import * as tiny from '@/app/server/sincronize/tiny'
import { format } from 'date-fns'

export async function partners({search = ''}) {
    
    await tiny.partners({ search })

}

export async function categories({search = ''}) {
    
    await tiny.categories({ search })

}

export async function payments({ partner, start, end, syncPartner }) {
    
    await tiny.payments({ partner, start: format(start, "dd/MM/yyyy"), end: format(end, "dd/MM/yyyy"), syncPartner })

}

export async function receivements({ partner, start, end, syncPartner }) {
    
    await tiny.receivements({ partner, start: format(start, "dd/MM/yyyy"), end: format(end, "dd/MM/yyyy"), syncPartner })

}

export async function transfer({date, originId, destinationId, amount, observation}) {

    await tiny.transfer({ date, originId, destinationId, amount, observation })

}