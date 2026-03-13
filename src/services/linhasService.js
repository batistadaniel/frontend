import API_URL from "./api"

export async function getLinhas(){

  const response = await fetch(`${API_URL}/linhas`)

  const data = await response.json()

  return data.linhas

}

// export async function getLinha(id){

//   const response = await fetch(`${API_URL}/linha/${id}`)

//   return await response.json()

// }