import { useParams, Link } from "react-router-dom"
import { useEffect, useState, useRef } from "react"
import "./LinhaDetalhada.css"
import Loader from "../../components/Loader/Loader"
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

  const dropdownRef = useRef(null)
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markersRef = useRef([])
  const layersRef = useRef({})
  const layerControlRef = useRef(null)

  useEffect(() => {
    async function carregar() {
      const response = await fetch(`http://localhost:3000/linha/${id}`)
      const data = await response.json()
      setLinha(data)
    }
    carregar()
  }, [id])

  // useEffect PARA CRIAR O MAPA (sem redimensionamento ao trocar de mapa)
  useEffect(() => {
    if (modo === "mapa" && linha && mapRef.current) {
      if (mapInstance.current) {
        mapInstance.current.remove()
      }
      markersRef.current = []
      layersRef.current = {}

      // Tiles com melhor nitidez
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

      // Armazena referências das layers
      layersRef.current = tiles

      const map = L.map(mapRef.current, {
        center: [-15.793889, -47.882778],
        zoom: 12,
        layers: [tiles[mapaEstilo]],
        zoomControl: false
      })

      mapInstance.current = map

      L.control.zoom({ position: 'topleft' }).addTo(map)

      // Adiciona controle de camadas base (compacto)
      layerControlRef.current = L.control.layers(tiles, null, { 
        position: 'topright',
        collapsed: true
      }).addTo(map)

      // Event listener para salvar o mapa escolhido (SEM redimensionar)
      map.on('baselayerchange', (e) => {
        localStorage.setItem("map_style", e.name)
        setMapaEstilo(e.name)
      })

      const viagemAtual = linha.viagens[sentidoSelecionado]

      // Desenhar Itinerário com BORDA PRETA
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

      // Redimensiona SÓ quando o mapa é criado
      setTimeout(() => map.invalidateSize(), 200)
    }
  }, [modo, linha, sentidoSelecionado])

  // useEffect SEPARADO para gerenciar APENAS os MARKERS (paradas)
  useEffect(() => {
    if (
      mapInstance.current &&
      modo === "mapa" &&
      linha &&
      linha.viagens &&
      linha.itinerarios
    ) {
      // Remove markers antigos
      markersRef.current.forEach(marker => marker.remove())
      markersRef.current = []

      const viagemAtual = linha.viagens[sentidoSelecionado]
      const itinerarioAtual = linha.itinerarios.find(
        it => it.sentido === viagemAtual.sentido
      )

      // Adiciona markers apenas se mostrarParadas for true
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

    // Cleanup
    return () => {
      if (markersRef.current && mapInstance.current) {
        markersRef.current.forEach(marker => marker.remove())
        markersRef.current = []
      }
    }
  }, [mostrarParadas, modo, linha, sentidoSelecionado])

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

  // fechar ao clicar fora
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
      )}
    </div>
  )
}

export default LinhaDetalhada