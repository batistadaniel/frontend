import { Link } from "react-router-dom"
import "./Home.css"
import CardHome  from "../../components/CardHome/CardHome"

function Home(){

  return (

    <div className="content">

      <CardHome 
        titulo="Buscar linhas"
        descricao="Pesquise sua linha de ônibus"
        to="/linhas"
      />

      <CardHome 
        titulo="Ver mapa"
        descricao="Visualize o mapa com as linhas de ônibus"
        to="/mapa"
      />


    </div>

  )

}

export default Home