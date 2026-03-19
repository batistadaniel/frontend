import { useParams, Link } from "react-router-dom"
import { useEffect, useState, useRef } from "react"
import "./LinhaDetalhada.css"
import Loader from "../../components/Loader/Loader"

function LinhaDetalhada(){

  const { id } = useParams()
  const [linha,setLinha] = useState(null)

  const [modo, setModo] = useState("grade")
  const [sentidoSelecionado, setSentidoSelecionado] = useState(0)

  const [horarioSelecionado, setHorarioSelecionado] = useState(null)

  const dropdownRef = useRef(null)

  useEffect(()=>{

    async function carregar(){
      const response = await fetch(`http://localhost:3000/linha/${id}`)
      const data = await response.json()
      setLinha(data)
    }

    carregar()

  },[id])

  // fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        dropdownRef.current.removeAttribute("open")
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  if(!linha){
    return <Loader />
  }

  const viagem = linha.grade_horaria[sentidoSelecionado]

  const viagemInfo = linha.viagens.find(
    v => v.sentido === viagem.sentido
  )

  const itinerario = linha.itinerarios.find(
    it => it.sentido === viagem.sentido
  )

  const embarque = itinerario?.paradas[0]?.nome
  const desembarque = itinerario?.paradas[itinerario.paradas.length - 1]?.nome

  function formatarNome(nome){
    if(!nome) return ""

    if(
      nome.toLowerCase().includes("ceilandia") ||
      nome.toLowerCase().includes("samambaia")
    ){
      return nome.replace("-", "").trim()
    }

    return nome
  }

  // 🔥 calcular previsão
  function calcularHorarioPrevisto(horario, segundos){
    if(!horario) return ""

    const [h, m] = horario.split(":").map(Number)

    const data = new Date()
    data.setHours(h)
    data.setMinutes(m)
    data.setSeconds(0)

    data.setSeconds(data.getSeconds() + segundos)

    const hh = String(data.getHours()).padStart(2, "0")
    const mm = String(data.getMinutes()).padStart(2, "0")

    return `${hh}:${mm}`
  }

  return (

    <div className="linha-container">

      {/* TOPO */}
      <div className="linha-topo">
        <h1
          style={{
            backgroundColor: linha.cor_operadora,
            color: linha.cor_operadora === "#bbff00" || linha.cor_operadora === "#ffd200" ? "#000" : "#fff"
          }}
        >
          {linha.numero && linha.nome
            ? `${linha.numero} - ${formatarNome(linha.nome)}`
            : linha.numero
          }
        </h1>

        <Link to="/linhas" className="btn-mudar">
          Mudar linha
        </Link>
      </div>

      {/* ABAS */}
      <div className="abas">
        <div className="aba ativa">Horários</div>
        <div className="aba">Mapa</div>
      </div>

      {/* SELEÇÃO */}
      <div className="selecoes">

        <div className="linha-select">
          <span>Selecione um itinerário:</span>

          <details 
            ref={dropdownRef}
            className={`custom-dropdown ${linha.grade_horaria.length === 1 ? "disabled" : ""}`}
            onClick={(e) => {
              if (linha.grade_horaria.length === 1) {
                e.preventDefault()
              }
            }}
          >
            <summary>
              <span>{formatarNome(viagem.sentido)}</span>
              <div className="main-chevron"></div>
            </summary>

            <div className="options-list">
              {linha.grade_horaria.map((g, index)=>(
                <div
                  key={index}
                  className={`option ${index === sentidoSelecionado ? "selected" : ""}`}
                  onClick={(e) => {
                    setSentidoSelecionado(index)
                    setHorarioSelecionado(null) // 🔥 limpa previsão
                    e.currentTarget.closest("details").removeAttribute("open")
                  }}
                >
                  <span>{formatarNome(g.sentido)}</span>

                  <span className={`chevron-icon ${index === sentidoSelecionado ? "up" : "down"}`}></span>
                </div>
              ))}
            </div>
          </details>

        </div>

        <div className="destino">
          <b>Destino:</b> {formatarNome(viagemInfo?.destino)}
        </div>

        <div className="preco">
          <b>Preço:</b> {linha?.preco ? `R$ ${linha.preco.toFixed(2)}` : "Não disponível"}
        </div>

        <div className="locais">
          <p><b>Local de embarque:</b> {formatarNome(embarque)}</p>
          <p><b>Local de desembarque:</b> {formatarNome(desembarque)}</p>
        </div>

      </div>

      {/* MODO */}
      <div className="modo">
        <span 
          className={modo === "grade" ? "ativo" : ""}
          onClick={()=>{
            setModo("grade")
            setHorarioSelecionado(null)
          }}
        >
          Grade
        </span>

        <span 
          className={modo === "lista" ? "ativo" : ""}
          onClick={()=>{
            setModo("lista")
            setHorarioSelecionado(null)
          }}
        >
          Tabela
        </span>

        <span 
          className={modo === "itinerario" ? "ativo" : ""}
          onClick={()=>setModo("itinerario")}
        >
          Itinerário
        </span>
      </div>

      {/* CONTEÚDO */}
      <div className="horarios">

        {/* ITINERÁRIO */}
        {modo === "itinerario" && itinerario && (
          <table className="tabela itinerario-tabela">
            <thead>
              <tr>
                <th>Sequencial:</th>
                <th>Ponto de Parada:</th>
                {horarioSelecionado && <th>Previsto: {horarioSelecionado}</th>}
              </tr>
            </thead>
            <tbody>
              {itinerario.paradas.map((p, index)=>(
                <tr key={p.id}>
                  <td className="col-numero">{index + 1}</td>
                  <td>{formatarNome(p.nome)}</td>

                  {horarioSelecionado && (
                    <td>
                      {calcularHorarioPrevisto(
                        horarioSelecionado,
                        p.previsao_chegada_segundos
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* HORÁRIOS */}
        {modo !== "itinerario" && viagem.servicos.map((s, i)=>(
          <div key={i} className="bloco-servico">

            <p className="dias">{s.dias}</p>

            {modo === "grade" ? (
              <div className="grade">
                {s.partidas.map((h, index)=>(
                  <div 
                    key={index} 
                    className="card-horario"
                    onClick={()=>{
                      setHorarioSelecionado(h)
                      setModo("itinerario")
                    }}
                  >
                    {h}
                  </div>
                ))}
              </div>
            ) : (
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Horário:</th>
                    <th>Partida:</th>
                    <th>Destino:</th>
                  </tr>
                </thead>
                <tbody>
                  {s.partidas.map((h, index)=>(
                    <tr 
                      key={index}
                      onClick={()=>{
                        setHorarioSelecionado(h)
                        setModo("itinerario")
                      }}
                    >
                      <td>{h}</td>
                      <td>{formatarNome(embarque)}</td>
                      <td>{formatarNome(desembarque)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

          </div>
        ))}

      </div>

    </div>

  )

}

export default LinhaDetalhada