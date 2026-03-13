import LinhaSearch from "../../components/LinhaSearch/LinhaSearch"
import { useLinhas } from "../../hooks/useLinhas"

function Linhas(){

  const linhas = useLinhas()

  return (

    <div>

      <LinhaSearch linhas={linhas} />

    </div>

  )

}

export default Linhas