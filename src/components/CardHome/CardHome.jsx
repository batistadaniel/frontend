import './CardHome.css'
import { Link } from "react-router-dom"

function CardHome({ icon, titulo, descricao, to }) {
  return (
    <Link to={to} className="card-home">

      <span className="icon">{icon}</span>

      <h3>{titulo}</h3>

      <p>{descricao}</p>

    </Link>
  )
}

export default CardHome