import { createBrowserRouter } from "react-router-dom"

import App from "../App"
import Home from "../pages/Home/Home"
import Linhas from "../pages/linhas/Linhas"
import LinhaDetalhada from "../pages/linhaDetalhada/LinhaDetalhada"
import ErrorPage from "../pages/error/ErrorPage"

const router = createBrowserRouter([

  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [

      {
        path: "/",
        element: <Home />
      },

      {
        path: "/linhas",
        element: <Linhas />
      },

      {
        path: "/linha/:id",
        element: <LinhaDetalhada />
      }

    ]
  }

])

export default router