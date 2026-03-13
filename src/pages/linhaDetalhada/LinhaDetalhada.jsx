import { useParams } from "react-router-dom"
import { useEffect, useState } from "react"

function LinhaDetalhada(){

  const { id } = useParams()

  const [linha,setLinha] = useState(null)

  useEffect(()=>{

    async function carregar(){

      const response = await fetch(`http://localhost:3000/linha/${id}`)

      const data = await response.json()

      setLinha(data)

    }

    carregar()

  },[id])

  if(!linha){
    return <p>Carregando...</p>
  }

  return (

    <div>

      <h1>Linha {linha.numero?.toString()}</h1>

      <p><b>Nome:</b> {linha.nome?.toString()}</p>

      <p><b>Preço:</b> R$ {linha.preco?.toFixed(2)}</p>

      <p><b>Tempo da API:</b> {linha.tempo_execucao?.toString()}</p>

      <p><b>Route ID:</b> {linha.route_id?.toString()}</p>


      <h2>Viagens</h2>

      {linha.viagens.map((viagem)=>(
        <div key={viagem.id_viagem?.toString()}>

          <h3>{viagem.sentido?.toString()}</h3>

          <p><b>Destino:</b> {viagem.destino?.toString()}</p>

          <h4>Veículos operando</h4>

          {viagem.veiculos_operando.map((v)=>(
            <div key={v.prefixo?.toString()}>

              <p>Ônibus: {v.prefixo?.toString()}</p>

              <p>Status: {v.status?.toString()}</p>

              <p>Horário início: {v.horario_inicio?.toString()}</p>

              <p>Última atualização: {v.ultima_atualizacao?.toString()}</p>

              <p>Progresso: {v.progresso_percentual?.toString()}%</p>

              <p>Diferenca: {v.delay_formatado?.toString()}</p>

              <p>Lat: {v.localizacao.lat}</p>

              <p>Lng: {v.localizacao.lng}</p>

              <hr/>

            </div>
          ))}

        </div>
      ))}


      <h2>Grade Horária</h2>

      {linha.grade_horaria.map((g)=>(
        <div key={g.sentido}>

          <h3>{g.sentido}</h3>

          <p>Ponto de partida: {g.ponto_partida}</p>

          {g.servicos.map((s)=>(
            <div key={s.dias}>

              <p><b>{s.dias}</b></p>

              <p>
                {s.partidas.join(" | ")}
              </p>

            </div>
          ))}

        </div>
      ))}


      <h2>Itinerário</h2>

      {linha.itinerarios.map((it)=>(
        <div key={it.id_viagem}>

          <h3>{it.sentido}</h3>

          {it.paradas.map((p)=>(
            <div key={p.id}>

              <p>{p.id} - {p.nome}</p>

              <p>Lat: {p.coordenadas.lat}</p>

              <p>Lng: {p.coordenadas.lng}</p>

              <p>Chegada prevista: {p.previsao_chegada_segundos}s</p>

              <hr/>

            </div>
          ))}

        </div>
      ))}

    </div>

  )

}

export default LinhaDetalhada