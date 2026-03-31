import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import "./LinhaSearch.css"
import Loader from "../Loader/Loader"

function LinhaSearch({ linhas }) {

  const [busca, setBusca] = useState("")
  const [indiceAtivo, setIndiceAtivo] = useState(-1)

  const navigate = useNavigate()
  const itensRef = useRef([])

  if (!linhas || linhas.length === 0) {
    return <Loader />
  }

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

      const prioridade = ["Ceilândia", "Samambaia"]

      if (prioridade.includes(a.nome) && !prioridade.includes(b.nome)) return -1
      if (!prioridade.includes(a.nome) && prioridade.includes(b.nome)) return 1

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

  function teclado(e) {

    if (e.key === "ArrowDown") {
      e.preventDefault()

      const novo = Math.min(indiceAtivo + 1, filtradas.length - 1)
      setIndiceAtivo(novo)

      itensRef.current[novo]?.scrollIntoView({ block: "nearest" })
    }

    if (e.key === "ArrowUp") {
      e.preventDefault()

      const novo = Math.max(indiceAtivo - 1, 0)
      setIndiceAtivo(novo)

      itensRef.current[novo]?.scrollIntoView({ block: "nearest" })
    }

    if (e.key === "Enter" && indiceAtivo >= 0) {
      selecionar(filtradas[indiceAtivo])
    }

  }

  return (

    <div className="linha-search">

      <div className="search-wrapper">

        <input
          className="search-input"
          placeholder="Busque por sua linha"
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value)
            setIndiceAtivo(-1)
          }}
          onKeyDown={teclado}
        />

      </div>

      <div className="lista-opcoes">

        {filtradas.map((linha, index) => (

          <div
            ref={(el) => itensRef.current[index] = el}
            key={linha.id}
            className={`card-opcao ${index === indiceAtivo ? "ativa" : ""}`}
            onClick={() => selecionar(linha)}
          >

            {linha.numero && (

              <span
                className="badge"
                style={{ borderColor: linha.cor_operadora }}
              >
                {linha.numero}
              </span>

            )}

            <span
              className="nome-linha"
              style={!linha.numero ? { color: linha.cor_operadora } : {}}
            >
              {linha.nome}
            </span>

          </div>

        ))}

      </div>

    </div>

  )
}

export default LinhaSearch