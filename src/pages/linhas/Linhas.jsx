import LinhaSearch from "../../components/LinhaSearch/LinhaSearch"
import { useLinhas } from "../../hooks/useLinhas"

function Linhas(){

  const linhas = useLinhas()

  return (

    <div>

      <h2>Buscar linha</h2>

      <LinhaSearch linhas={linhas} />

    </div>

  )

}

export default Linhas