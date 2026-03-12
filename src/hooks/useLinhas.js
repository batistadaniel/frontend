import { useState, useEffect } from "react"
import { getLinhas } from "../services/linhasService"

export function useLinhas(){

  const [linhas,setLinhas] = useState([])

  useEffect(()=>{

    async function carregar(){

      const dados = await getLinhas()

      setLinhas(dados)

    }

    carregar()

  },[])

  return linhas

}