"use server"

import { AppContext } from "@/database"
import { Successfully } from "@/views/settings/integrations"
import { headers } from "next/headers"

export default async function Connect() {

    return <Successfully></Successfully>

}