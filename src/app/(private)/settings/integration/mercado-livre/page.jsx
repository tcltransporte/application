"use server"

import { Successfully } from "@/views/settings/integrations"
import { Connected } from "@/views/settings/integrations/plugins/MercadoLivre/Connected"

export default async function Connect() {

    return <Connected></Connected>

}