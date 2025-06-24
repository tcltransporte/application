// plugins/index.jsx
import * as MercadoLivre from './MercadoPago'
import * as Tiny from './Tiny'
//import * as Itau from './Itau'

const plugins = [
  MercadoLivre,
  Tiny,
  //Itau,
]

// Mapeia os plugins pelo ID para acesso rápido
const pluginsById = plugins.reduce((acc, plugin) => {
  acc[plugin.ID] = plugin
  return acc
}, {})

/**
 * Retorna o plugin pelo ID
 * @param {string} id - ID do plugin
 * @returns {object|null} plugin com Statement e Install
 */
export function getPluginById(id) {
  return pluginsById[id] || null
}

export const PluginRenderer = ({ pluginId, componentName, data, onChange }) => {

  const plugin = getPluginById(pluginId)

  if (!plugin) return <div>Plugin não encontrado</div>

  const ComponentToRender = plugin[componentName]

  if (!ComponentToRender)
    return <div>Componente "{componentName}" não encontrado no plugin</div>

  return <ComponentToRender data={data} onChange={onChange} />

}