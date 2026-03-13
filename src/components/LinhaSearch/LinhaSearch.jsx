import { useState } from "react"
import { useNavigate } from "react-router-dom"

function LinhaSearch({ linhas }){

  const [busca,setBusca] = useState("")
  const navigate = useNavigate()

  function slug(texto) {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
  }

  const termo = slug(busca)

  const filtradas = linhas
  .filter((linha) =>
    slug(linha?.nome || "").includes(termo) ||
    slug(linha?.numero || "").includes(termo)
  )
  .sort((a, b) => {

    if (!a.numero && b.numero) return -1
    if (a.numero && !b.numero) return 1

    if (a.numero && b.numero) {
      return a.numero.localeCompare(b.numero)
    }

    return a.nome.localeCompare(b.nome)

  })

  function selecionar(linha) {

    const identificador = linha.numero
      ? linha.numero
      : slug(linha.nome)

    navigate(`/linha/${identificador}`)

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

            {linha.numero ? `${linha.numero} - ` : ""}
            {linha.nome}

          </div>

        ))}

      </div>

    </div>

  )

}

export default LinhaSearch