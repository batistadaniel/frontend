import { useParams, Link } from "react-router-dom"
import { useEffect, useState, useRef } from "react"
import "./LinhaDetalhada.css"
import Loader from "../../components/Loader/Loader"
import BusIcon from "../../components/BusIcon/BusIcon"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import polyline from "@mapbox/polyline"

function LinhaDetalhada() {
  const { id } = useParams()
  const [linha, setLinha] = useState(null)
  const [modo, setModo] = useState("grade")
  const [sentidoSelecionado, setSentidoSelecionado] = useState(0)
  const [horarioSelecionado, setHorarioSelecionado] = useState(null)
  const [mostrarParadas, setMostrarParadas] = useState(true)
  const [mapaEstilo, setMapaEstilo] = useState(() => {
    return localStorage.getItem("map_style") || "Padrão"
  })
  const [veiculos, setVeiculos] = useState([])
  const [proximaAtualizacao, setProximaAtualizacao] = useState(15)
  const [veiculosMarkers, setVeiculosMarkers] = useState({})
  const [mapaCriado, setMapaCriado] = useState(false)

  const dropdownRef = useRef(null)
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markersRef = useRef([])
  const layersRef = useRef({})
  const layerControlRef = useRef(null)
  const linhaRef = useRef(null)

  // Carregamento inicial
  useEffect(() => {
    async function carregar() {
      const response = await fetch(`http://localhost:3000/linha/${id}`)
      const data = await response.json()
      setLinha(data)
      linhaRef.current = data
      
      // Extrai veículos do sentido selecionado
      if (data.viagens[sentidoSelecionado]) {
        setVeiculos(data.viagens[sentidoSelecionado].veiculos_operando || [])
      }
    }
    carregar()
  }, [id])

  // Atualiza veículos quando muda o sentido
  useEffect(() => {
    if (linhaRef.current && linhaRef.current.viagens[sentidoSelecionado]) {
      setVeiculos(linhaRef.current.viagens[sentidoSelecionado].veiculos_operando || [])
    }
  }, [sentidoSelecionado])

  // Timer de atualização (15 segundos) - SEM recriar o mapa
  useEffect(() => {
    if (modo !== "mapa") return

    setProximaAtualizacao(15)

    const interval = setInterval(async () => {
      setProximaAtualizacao(prev => {
        if (prev <= 1) {
          // Faz requisição para atualizar veículos APENAS
          fetch(`http://localhost:3000/linha/${id}`)
            .then(res => res.json())
            .then(data => {
              linhaRef.current = data
              if (data.viagens[sentidoSelecionado]) {
                setVeiculos(data.viagens[sentidoSelecionado].veiculos_operando || [])
              }
            })
            .catch(err => console.error("Erro ao atualizar veículos:", err))
          
          return 15
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [modo, id, sentidoSelecionado])

  // useEffect PARA CRIAR O MAPA - SÓ EXECUTA UMA VEZ
  useEffect(() => {
    if (modo === "mapa" && linha && mapRef.current && !mapaCriado) {
      if (mapInstance.current) {
        mapInstance.current.remove()
      }
      markersRef.current = []
      layersRef.current = {}

      const tiles = {
        "Ruas": L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 20,
          attribution: '© OpenStreetMap contributors'
        }),
        "Híbrido": L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
          maxZoom: 20,
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
          attribution: '© Google'
        }),
        "Padrão": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors'
        }),
        "Satélite": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 18,
          attribution: '© Esri'
        })
      }

      layersRef.current = tiles

      const map = L.map(mapRef.current, {
        center: [-15.793889, -47.882778],
        zoom: 12,
        layers: [tiles[mapaEstilo]],
        zoomControl: false
      })

      mapInstance.current = map

      L.control.zoom({ position: 'topleft' }).addTo(map)

      layerControlRef.current = L.control.layers(tiles, null, { 
        position: 'topright',
        collapsed: true
      }).addTo(map)

      map.on('baselayerchange', (e) => {
        localStorage.setItem("map_style", e.name)
        setMapaEstilo(e.name)
      })

      const viagemAtual = linha.viagens[sentidoSelecionado]

      if (viagemAtual?.shape) {
        const decoded = polyline.decode(viagemAtual.shape)
        const latlngs = decoded.map(coord => [coord[0], coord[1]])

        L.polyline(latlngs, { color: '#000000', weight: 8, opacity: 0.9 }).addTo(map)
        const poly = L.polyline(latlngs, {
          color: linha.cor_operadora || '#385EA9',
          weight: 5
        }).addTo(map)

        map.fitBounds(poly.getBounds())
      }

      setTimeout(() => map.invalidateSize(), 200)
      setMapaCriado(true)
    }

    // Cleanup
    return () => {
      if (modo !== "mapa") {
        setMapaCriado(false)
      }
    }
  }, [modo, linha, sentidoSelecionado, mapaCriado])

  // useEffect para MARKERS de PARADAS
  useEffect(() => {
    if (
      mapInstance.current &&
      modo === "mapa" &&
      linha &&
      linha.viagens &&
      linha.itinerarios
    ) {
      markersRef.current.forEach(marker => marker.remove())
      markersRef.current = []

      const viagemAtual = linha.viagens[sentidoSelecionado]
      const itinerarioAtual = linha.itinerarios.find(
        it => it.sentido === viagemAtual.sentido
      )

      if (itinerarioAtual && mostrarParadas) {
        const carregarMarkers = (mapaParadasLocal = null) => {
          itinerarioAtual.paradas.forEach(pAPI => {
            let lat, lon
            if (pAPI.coordenadas?.lat) {
              lat = pAPI.coordenadas.lat
              lon = pAPI.coordenadas.lng
            } else if (mapaParadasLocal) {
              const pReal = mapaParadasLocal[pAPI.nome.trim().toLowerCase()]
              if (pReal) { lat = pReal.lat; lon = pReal.lon }
            }
            if (lat && lon) {
              const marker = L.marker([lat, lon], { icon: criarIcone(pAPI.id) })
                .addTo(mapInstance.current)
                .bindPopup(formatarNome(pAPI.nome))
              markersRef.current.push(marker)
            }
          })
        }

        const precisaDeJson = itinerarioAtual.paradas.some(p => !p.coordenadas)
        if (precisaDeJson) {
          fetch("/src/json/paradas_df_v2026.json")
            .then(res => res.json())
            .then(paradasDF => {
              const mapaParadas = {}
              paradasDF.forEach(p => mapaParadas[p.nome.trim().toLowerCase()] = p)
              carregarMarkers(mapaParadas)
            }).catch(err => console.error(err))
        } else {
          carregarMarkers()
        }
      }
    }

    return () => {
      if (markersRef.current && mapInstance.current) {
        markersRef.current.forEach(marker => marker.remove())
        markersRef.current = []
      }
    }
  }, [mostrarParadas, modo, sentidoSelecionado])

  // useEffect para MARKERS dos VEÍCULOS - ATUALIZA POSIÇÕES SEM RECRIAR
  useEffect(() => {
    if (!mapInstance.current || modo !== "mapa") {
      return
    }

    if (!veiculos.length) {
      // Remove todos os marcadores de veículos
      Object.values(veiculosMarkers).forEach(marker => marker.remove())
      setVeiculosMarkers({})
      return
    }

    const novosMarcadores = { ...veiculosMarkers }

    veiculos.forEach(veiculo => {
      const { lat, lng } = veiculo.localizacao
      const prefixo = veiculo.prefixo

      // Se o marker já existe, atualiza a posição
      if (novosMarcadores[prefixo]) {
        novosMarcadores[prefixo].setLatLng([lat, lng])
      } else {
        // Se não existe, cria novo marker
        const marker = L.marker([lat, lng], { icon: criarIconeVeiculo() })
          .addTo(mapInstance.current)
          .bindPopup(`<strong>Prefixo:</strong> ${veiculo.prefixo}<br/><strong>Status:</strong> ${veiculo.status}`)
        
        novosMarcadores[prefixo] = marker
      }
    })

    // Remove markers de veículos que não estão mais em operação
    Object.keys(veiculosMarkers).forEach(prefixoAntigo => {
      if (!veiculos.find(v => v.prefixo === prefixoAntigo)) {
        veiculosMarkers[prefixoAntigo].remove()
        delete novosMarcadores[prefixoAntigo]
      }
    })

    setVeiculosMarkers(novosMarcadores)
  }, [veiculos, modo])

  function criarIcone(numero) {
    return L.divIcon({
      className: "custom-stop-icon",
      html: `
        <div class="icon-map">
          <div class="placa-azul-map">
            <div class="borda-map">
              <div class="info-placa-map">${numero}</div>
            </div>
          </div>
          <div class="poste-map"></div>
        </div>
      `,
      iconSize: [100, 145],
      iconAnchor: [50, 145]
    })
  }

  function criarIconeVeiculo() {
    return L.divIcon({
      className: "veiculo-marker",
      html: `
        <div class="veiculo-icon-circle">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
            <path d="M192 64C139 64 96 107 96 160L96 448C96 477.8 116.4 502.9 144 510L144 544C144 561.7 158.3 576 176 576L192 576C209.7 576 224 561.7 224 544L224 512L416 512L416 544C416 561.7 430.3 576 448 576L464 576C481.7 576 496 561.7 496 544L496 510C523.6 502.9 544 477.8 544 448L544 160C544 107 501 64 448 64L192 64zM160 192C160 174.3 174.3 160 192 160L448 160C465.7 160 480 174.3 480 192L480 288C480 305.7 465.7 320 448 320L192 320C174.3 320 160 305.7 160 288L160 192zM192 384C209.7 384 224 398.3 224 416C224 433.7 209.7 448 192 448C174.3 448 160 433.7 160 416C160 398.3 174.3 384 192 384zM448 384C465.7 384 480 398.3 480 416C480 433.7 465.7 448 448 448C430.3 448 416 433.7 416 416C416 398.3 430.3 384 448 384z"/>
          </svg>
        </div>
      `,
      iconSize: [50, 50],
      iconAnchor: [25, 25],
      popupAnchor: [0, -25]
    })
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        dropdownRef.current.removeAttribute("open")
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (!linha) return <Loader />

  const viagem = linha.grade_horaria[sentidoSelecionado]
  const viagemInfo = linha.viagens.find(v => v.sentido === viagem.sentido)
  const itinerario = linha.itinerarios.find(it => it.sentido === viagem.sentido)
  const embarque = itinerario?.paradas[0]?.nome
  const desembarque = itinerario?.paradas[itinerario.paradas.length - 1]?.nome
  const duracaoTotalSegundos = itinerario?.paradas?.[itinerario.paradas.length - 1]?.previsao_chegada_segundos

  function formatarNome(nome) {
    if (!nome) return ""
    if (nome.toLowerCase().includes("ceilandia") || nome.toLowerCase().includes("samambaia")) {
      return nome.replace("-", "").trim()
    }
    return nome
  }

  function calcularDuracaoViagem(segundos) {
    if (!segundos && segundos !== 0) return ""
    const minutosTotais = Math.floor(segundos / 60)
    const horas = Math.floor(minutosTotais / 60)
    const minutosRestantes = minutosTotais % 60
    return horas > 0 ? `${horas}h ${minutosRestantes} min` : `${minutosTotais} min`
  }

  function calcularHorarioPrevisto(horario, segundos) {
    if (!horario) return ""
    const [h, m] = horario.split(":").map(Number)
    const data = new Date()
    data.setHours(h); data.setMinutes(m); data.setSeconds(0)
    data.setSeconds(data.getSeconds() + segundos)
    return `${String(data.getHours()).padStart(2, "0")}:${String(data.getMinutes()).padStart(2, "0")}`
  }

  function formatarDelay(atrasoSegundos, status) {
    const minutosTotais = Math.floor(atrasoSegundos / 60)
    const horas = Math.floor(minutosTotais / 60)
    const minutos = minutosTotais % 60

    if (minutosTotais < 60) {
      return `${Math.abs(minutosTotais)} min`
    } else {
      return `${Math.abs(horas)}h ${Math.abs(minutos)} min`
    }
  }

  return (
    <div className="linha-container">
      {/* TOPO E ABAS */}
      <div className="linha-topo">
        <h1 style={{
          backgroundColor: linha.cor_operadora,
          color: (linha.cor_operadora === "#bbff00" || linha.cor_operadora === "#ffd200") ? "#000" : "#fff"
        }}>
          {linha.numero && linha.nome ? `${linha.numero} - ${formatarNome(linha.nome)}` : linha.numero}
        </h1>
        <Link to="/linhas" className="btn-mudar">Mudar linha</Link>
      </div>

      <div className="abas">
        <div className={`aba ${modo !== "mapa" ? "ativa" : ""}`} onClick={() => setModo("grade")}>Horários</div>
        <div className={`aba ${modo === "mapa" ? "ativa" : ""}`} onClick={() => setModo("mapa")}>Mapa</div>
      </div>

      {modo !== "mapa" ? (
        <>
          <div className="selecoes">
            <div className="linha-select">
              <span>Selecione um itinerário:</span>
              <details ref={dropdownRef} className={`custom-dropdown ${linha.grade_horaria.length === 1 ? "disabled" : ""}`}
                onClick={(e) => linha.grade_horaria.length === 1 && e.preventDefault()}>
                <summary>
                  <span>{formatarNome(viagem.sentido)}</span>
                  <div className="main-chevron"></div>
                </summary>
                <div className="options-list">
                  {linha.grade_horaria.map((g, index) => (
                    <div key={index} className={`option ${index === sentidoSelecionado ? "selected" : ""}`}
                      onClick={(e) => {
                        setSentidoSelecionado(index)
                        setHorarioSelecionado(null)
                        e.currentTarget.closest("details").removeAttribute("open")
                      }}>
                      <span>{formatarNome(g.sentido)}</span>
                      <span className={`chevron-icon ${index === sentidoSelecionado ? "up" : "down"}`}></span>
                    </div>
                  ))}
                </div>
              </details>
            </div>
            <div className="destino"><b>Destino:</b> {formatarNome(viagemInfo?.destino)}</div>
            <div className="preco"><b>Preço:</b> {linha?.preco ? `R$ ${linha.preco.toFixed(2)}` : "Não disponível"}</div>
            <div className="duracao"><b>Duração prevista:</b> {duracaoTotalSegundos != null ? calcularDuracaoViagem(duracaoTotalSegundos) : "Não disponível"}</div>
            <div className="locais">
              <p><b>Local de embarque:</b> {formatarNome(embarque)}</p>
              <p><b>Local de desembarque:</b> {formatarNome(desembarque)}</p>
            </div>
            <h2 className="spam-previto">Horarios previstos:</h2>
          </div>

          <div className="modo">
            <span className={modo === "grade" ? "ativo" : ""} onClick={() => { setModo("grade"); setHorarioSelecionado(null) }}>Grade</span>
            <span className={modo === "lista" ? "ativo" : ""} onClick={() => { setModo("lista"); setHorarioSelecionado(null) }}>Tabela</span>
            <span className={modo === "itinerario" ? "ativo" : ""} onClick={() => setModo("itinerario")}>Itinerário</span>
          </div>

          <div className="horarios">
            {modo === "itinerario" && itinerario && (
              <table className="tabela itinerario-tabela">
                <thead>
                  <tr>
                    <th>Sequencial:</th>
                    <th className="col-meio">Ponto de Parada:</th>
                    {horarioSelecionado && <th>Previsto: {horarioSelecionado}</th>}
                  </tr>
                </thead>
                <tbody>
                  {itinerario.paradas.map((p, index) => (
                    <tr key={p.id}>
                      <td className="col-numero">{index + 1}</td>
                      <td>{formatarNome(p.nome)}</td>
                      {horarioSelecionado && <td>{calcularHorarioPrevisto(horarioSelecionado, p.previsao_chegada_segundos)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {modo !== "itinerario" && viagem.servicos.map((s, i) => (
              <div key={i} className="bloco-servico">
                <p className="dias">{s.dias}</p>
                {modo === "grade" ? (
                  <div className="grade">
                    {s.partidas.map((h, index) => (
                      <div key={index} className="card-horario" onClick={() => { setHorarioSelecionado(h); setModo("itinerario") }}>{h}</div>
                    ))}
                  </div>
                ) : (
                  <table className="tabela">
                    <thead><tr><th>Horário:</th><th>Partida:</th><th>Destino:</th></tr></thead>
                    <tbody>
                      {s.partidas.map((h, index) => (
                        <tr key={index} onClick={() => { setHorarioSelecionado(h); setModo("itinerario") }}>
                          <td>{h}</td><td>{formatarNome(embarque)}</td><td>{formatarNome(desembarque)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="mapa-container">
          <div className="mapa-wrapper">
            <div className="map-controls">
              <div className="map-controls-group">
                <label>
                  <input
                    type="checkbox"
                    checked={mostrarParadas}
                    onChange={e => setMostrarParadas(e.target.checked)}
                  />
                  Mostrar paradas
                </label>
              </div>
            </div>
            <div id="map-container" ref={mapRef}></div>
          </div>

          <div className="veiculos-panel">
            <div className="veiculos-header">
              <h3>Veículos</h3>
              <div className="atualizacao-timer">
                Atualiza em: <span className="timer-valor">{proximaAtualizacao}s</span>
              </div>
            </div>

            <div className="veiculos-separator"></div>

            <div className="veiculos-lista">
              {veiculos.length > 0 ? (
                veiculos.map((veiculo) => (
                  <div key={veiculo.prefixo} className="veiculo-card">
                    <div className="veiculo-row">
                      <span className="veiculo-label">Sentido:</span>
                      <span className="veiculo-valor">{ formatarNome(viagem.sentido)}</span>
                    </div>
                    <div className="veiculo-row">
                      <span className="veiculo-label">Prefixo:</span>
                      <span className="veiculo-valor">{veiculo.prefixo}</span>
                    </div>
                    <div className="veiculo-row">
                      <span className="veiculo-label">Horário de saída:</span>
                      <span className="veiculo-valor">{veiculo.horario_inicio}</span>
                    </div>
                    <div className="veiculo-row">
                      <span className="veiculo-label">Último sinal:</span>
                      <span className="veiculo-valor">{veiculo.ultima_atualizacao}</span>
                    </div>
                    <div className="veiculo-row">
                      <span className="veiculo-label">Progresso:</span>
                      <span className="veiculo-valor">{veiculo.progresso_percentual}%</span>
                    </div>
                    <div className="veiculo-row">
                      <span className="veiculo-label">Situação:</span>
                      <span className="veiculo-valor">{veiculo.status} {formatarDelay(veiculo.atraso_segundos, veiculo.status)}</span>
                    </div>
                    <div className="veiculo-row">
                      <span className="veiculo-label">Parada atual:</span>
                      <span className="veiculo-valor">{veiculo.sequencia_parada}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="sem-veiculos">Nenhum veículo em operação</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LinhaDetalhada