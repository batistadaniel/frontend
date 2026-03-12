import './CardHome.css'
import { Link } from "react-router-dom"

function CardHome({ titulo, descricao, to }) {
  return (
    <Link to={to} className="card-home">
      <h2 className='titulo'>{titulo}</h2>
      <p className='descricao'>{descricao}</p>
    </Link>
  )
}

export default CardHome