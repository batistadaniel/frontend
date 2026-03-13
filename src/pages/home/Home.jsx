import "./Home.css"
import CardHome from "../../components/CardHome/CardHome"

function Home(){

  return (

    <div className="content">

      <CardHome
        icon="📅"
        titulo="Linhas e Horários"
        descricao="Acesse informações de itinerários e horários de forma rápida para cada linha."
        to="/linhas"
      />

      <CardHome
        icon="📍"
        titulo="Mapa de Paradas"
        descricao="Visualização dos pontos de parada do Distrito Federal com previsão de chegada dos veículos."
        to="/mapa"
      />

      <CardHome
        icon="⚡"
        titulo="Veículos em Tempo Real (Simples)"
        descricao="Monitoramento de uma ou mais linhas em tempo real."
        to="/tempo-real"
      />

      <CardHome
        icon="🚀"
        titulo="Veículos em Tempo Real (Avançado)"
        descricao="Painel com filtros de linhas, prefixos e empresas."
        to="/tempo-real-avancado"
      />

      <CardHome
        icon="📊"
        titulo="Estatísticas da Frota"
        descricao="Informações técnicas sobre a composição da frota ativa."
        to="/frota"
      />

      <CardHome
        icon="ℹ️"
        titulo="Outros"
        descricao="Outras informações do sistema."
        to="/outros"
      />

    </div>

  )

}

export default Home