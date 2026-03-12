import { useState } from "react"
import { useNavigate } from "react-router-dom"

function LinhaSearch({ linhas }){

  const [busca,setBusca] = useState("")
  const navigate = useNavigate()

  const filtradas = linhas.filter((linha) =>
    linha?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    linha?.numero?.toLowerCase().includes(busca.toLowerCase())
  )

  function selecionar(linha){

    navigate(`/linha/${linha.numero}`)

  }

  return(

    <div>

      <input
        placeholder="Digite a linha"
        value={busca}
        onChange={(e)=>setBusca(e.target.value)}
      />

      <div>

        {filtradas.map((linha)=>(

          <div
            key={linha.id}
            onClick={()=>selecionar(linha)}
          >

            {linha.numero} - {linha.nome}

          </div>

        ))}

      </div>

    </div>

  )

}

export default LinhaSearch