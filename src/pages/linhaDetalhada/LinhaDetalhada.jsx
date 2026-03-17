import { useParams, Link } from "react-router-dom"
import { useEffect, useState } from "react"
import "./LinhaDetalhada.css"
import Loader from "../../components/Loader/Loader"

function LinhaDetalhada(){

  const { id } = useParams()
  const [linha,setLinha] = useState(null)

  const [modo, setModo] = useState("grade")
  const [sentidoSelecionado, setSentidoSelecionado] = useState(0)

  useEffect(()=>{

    async function carregar(){
      const response = await fetch(`http://localhost:3000/linha/${id}`)
      const data = await response.json()
      setLinha(data)
    }

    carregar()

  },[id])

  // ✅ loader corrigido
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

  // ✅ remover "-" apenas para metrô específico
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

  return (

    <div className="linha-container">

      {/* TOPO */}
      <div className="linha-topo">
        <h1>
          {linha.numero} {formatarNome(linha.nome)}
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

          <select
            value={sentidoSelecionado}
            onChange={(e)=>setSentidoSelecionado(Number(e.target.value))}
            disabled={linha.grade_horaria.length === 1}
          >
            {linha.grade_horaria.map((g, index)=>(
              <option key={index} value={index}>
                {/* ✅ padronização aqui */}
                {formatarNome(g.sentido)}
              </option>
            ))}
          </select>
        </div>

        <div className="destino">
          <b>Destino:</b> {formatarNome(viagemInfo?.destino)}
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
          onClick={()=>setModo("grade")}
        >
          Grade
        </span>

        <span 
          className={modo === "lista" ? "ativo" : ""}
          onClick={()=>setModo("lista")}
        >
          Tabela
        </span>
      </div>

      {/* HORÁRIOS */}
      <div className="horarios">

        {viagem.servicos.map((s, i)=>(
          <div key={i} className="bloco-servico">

            <p className="dias">{s.dias}</p>

            {modo === "grade" ? (
              <div className="grade">
                {s.partidas.map((h, index)=>(
                  <div key={index} className="card-horario">
                    {h}
                  </div>
                ))}
              </div>
            ) : (
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Horário</th>
                    <th>Partida</th>
                    <th>Destino</th>
                  </tr>
                </thead>
                <tbody>
                  {s.partidas.map((h, index)=>(
                    <tr key={index}>
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