import "./Header.css"
import { Link } from "react-router-dom"
import logo from "../../assets/img/logo-mobilidade-df.jpg"


function Header(){
  return (
    <header>
        <img src={logo} alt="Logo Mobilidade DF" />
        <Link to="/" className="titulo">
            <h1>Mobilidade DF</h1>
        </Link>
    </header>
  )
}

export default Header