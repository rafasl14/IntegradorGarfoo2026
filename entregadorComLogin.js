const entregadorSalvo = localStorage.getItem("garfooUsuarioLogado");
let dadosEntregador = {};

if (entregadorSalvo) {
    try {
        dadosEntregador = JSON.parse(entregadorSalvo)?.dados || {};
    } catch (erro) {
        console.error("Não foi possível carregar o entregador:", erro);
    }
}

document.querySelectorAll("[data-entregador-nav]").forEach(item => {
    item.addEventListener("click", () => {
        document.querySelectorAll("[data-entregador-nav]").forEach(navItem => navItem.classList.remove("ativo"));
        item.classList.add("ativo");
    });
});

const coordenadasRota = {
    entregador: { lat: -18.9078, lng: -48.2824 },
    restaurante: { lat: -18.9146, lng: -48.2750 },
    cliente: { lat: -18.9228, lng: -48.2638 }
};

const pontosRota = [
    coordenadasRota.entregador,
    coordenadasRota.restaurante,
    coordenadasRota.cliente
];

const mapaRota = document.querySelector("[data-mapa-rota]");
const mapaFallback = document.querySelector("[data-mapa-fallback]");
const elevacaoRota = document.querySelector("[data-elevacao-rota]");
const tokenMapbox = window.GARFOO_MAPA_CONFIG?.mapboxAccessToken?.trim();
let mapaMapbox;
let mapaAlternativo;
let linhaAlternativa;
let coordenadasAlternativas = pontosRota.map(ponto => [ponto.lat, ponto.lng]);
let corridaAceita = false;
let rotaCalculada;
let localizacaoSolicitada = false;
let marcadorEntregadorMapbox;
let marcadorEntregadorLeaflet;
let marcadorRestauranteMapbox;
let marcadorClienteMapbox;
let marcadorRestauranteLeaflet;
let marcadorClienteLeaflet;
const linkMapa = document.querySelector("[data-link-mapa]");
if (linkMapa) {
    const origem = `${coordenadasRota.entregador.lat},${coordenadasRota.entregador.lng}`;
    const destino = `${coordenadasRota.cliente.lat},${coordenadasRota.cliente.lng}`;
    const paradaRestaurante = `${coordenadasRota.restaurante.lat},${coordenadasRota.restaurante.lng}`;
    linkMapa.href = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origem)}&destination=${encodeURIComponent(destino)}&waypoints=${encodeURIComponent(paradaRestaurante)}&travelmode=driving`;
}

function mostrarFallbackMapa(mensagem) {
    if (!mapaFallback) {
        return;
    }

    mapaFallback.textContent = mensagem;
    mapaFallback.hidden = false;
}

function atualizarResumoRota(rota) {
    const resumo = document.querySelector("[data-resumo-rota]");
    const tempoAteRestaurante = document.querySelector(".entregador-corrida-restaurante > b");
    if (resumo && rota.distance != null && rota.duration != null) {
        resumo.textContent = `${(rota.distance / 1000).toFixed(1).replace(".", ",")} km · ${Math.max(1, Math.round(rota.duration / 60))} min ◷`;
        window.GarfooCorridas?.registrarRota(rota.distance / 1000, Math.max(1, Math.round(rota.duration / 60)));
    }
    if (tempoAteRestaurante && rota.legs?.[0]?.duration != null) {
        tempoAteRestaurante.textContent = `${Math.max(1, Math.round(rota.legs[0].duration / 60))} min`;
        tempoAteRestaurante.hidden = false;
    }
}

function ativarRotaAceita() {
    corridaAceita = true;
    if (!localizacaoSolicitada) {
        localizacaoSolicitada = true;
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(posicao => {
                coordenadasRota.entregador = { lat: posicao.coords.latitude, lng: posicao.coords.longitude };
                pontosRota[0] = coordenadasRota.entregador;
                marcadorEntregadorMapbox?.setLngLat([coordenadasRota.entregador.lng, coordenadasRota.entregador.lat]);
                marcadorEntregadorLeaflet?.setLatLng([coordenadasRota.entregador.lat, coordenadasRota.entregador.lng]);
                recalcularRotaComLocalizacao();
            }, () => {
                if (elevacaoRota) elevacaoRota.textContent = "Localização indisponível; exibindo o caminho aproximado até o restaurante e o cliente.";
            }, { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 });
        }
    }
    if (mapaAlternativo) {
        [marcadorEntregadorLeaflet, marcadorRestauranteLeaflet, marcadorClienteLeaflet].forEach(marcador => {
            if (marcador && !mapaAlternativo.hasLayer(marcador)) marcador.addTo(mapaAlternativo);
        });
        if (!linhaAlternativa) {
            linhaAlternativa = L.polyline(coordenadasAlternativas, { color: "#e85c05", weight: 6, opacity: 0.95 }).addTo(mapaAlternativo);
        }
        linhaAlternativa.setLatLngs(coordenadasAlternativas);
        mapaAlternativo.fitBounds(linhaAlternativa.getBounds(), { padding: [35, 35], maxZoom: 16, animate: true });
        if (elevacaoRota) elevacaoRota.textContent = "Caminho da corrida aceita exibido no mapa.";
        return;
    }
    if (!mapaMapbox || !mapaMapbox.isStyleLoaded()) return;
    if (!mapaMapbox.getLayer("rota-entrega-linha")) return;

    [marcadorEntregadorMapbox, marcadorRestauranteMapbox, marcadorClienteMapbox].forEach(marcador => {
        if (marcador) marcador.getElement().style.visibility = "visible";
    });
    mapaMapbox.setLayoutProperty("rota-entrega-linha", "visibility", "visible");
    const coordenadas = rotaCalculada?.coordinates || pontosRota.map(ponto => [ponto.lng, ponto.lat]);
    const limites = coordenadas.reduce(
        (bounds, ponto) => bounds.extend(ponto),
        new mapboxgl.LngLatBounds(coordenadas[0], coordenadas[0])
    );
    mapaMapbox.fitBounds(limites, { padding: 50, maxZoom: 15, duration: 800 });
    if (elevacaoRota) elevacaoRota.textContent = "Rota da corrida aceita.";
}

function ocultarMarcadoresERota() {
    corridaAceita = false;
    if (mapaMapbox?.getLayer("rota-entrega-linha")) mapaMapbox.setLayoutProperty("rota-entrega-linha", "visibility", "none");
    [marcadorEntregadorMapbox, marcadorRestauranteMapbox, marcadorClienteMapbox].forEach(marcador => {
        if (marcador) marcador.getElement().style.visibility = "hidden";
    });
    if (mapaAlternativo) {
        if (linhaAlternativa) { mapaAlternativo.removeLayer(linhaAlternativa); linhaAlternativa = null; }
        [marcadorEntregadorLeaflet, marcadorRestauranteLeaflet, marcadorClienteLeaflet].forEach(marcador => {
            if (marcador && mapaAlternativo.hasLayer(marcador)) mapaAlternativo.removeLayer(marcador);
        });
    }
}

function usarCorridaAceitaAtual() {
    const corrida = window.GarfooCorridas?.obterAtual();
    if (!corrida) return;
    coordenadasRota.restaurante = corrida.restauranteCoord;
    coordenadasRota.cliente = corrida.clienteCoord;
    pontosRota.splice(0, pontosRota.length, coordenadasRota.entregador, coordenadasRota.restaurante, coordenadasRota.cliente);
    localizacaoSolicitada = false;
    const inicio = [coordenadasRota.entregador.lat, coordenadasRota.entregador.lng];
    const retirada = [coordenadasRota.restaurante.lat, coordenadasRota.restaurante.lng];
    const entrega = [coordenadasRota.cliente.lat, coordenadasRota.cliente.lng];
    marcadorEntregadorMapbox?.setLngLat([inicio[1], inicio[0]]);
    marcadorRestauranteMapbox?.setLngLat([retirada[1], retirada[0]]);
    marcadorClienteMapbox?.setLngLat([entrega[1], entrega[0]]);
    marcadorEntregadorLeaflet?.setLatLng(inicio);
    marcadorRestauranteLeaflet?.setLatLng(retirada);
    marcadorClienteLeaflet?.setLatLng(entrega);
    coordenadasAlternativas = [inicio, retirada, entrega];
    if (linkMapa) {
        const origem = `${coordenadasRota.entregador.lat},${coordenadasRota.entregador.lng}`;
        const destino = `${coordenadasRota.cliente.lat},${coordenadasRota.cliente.lng}`;
        const parada = `${coordenadasRota.restaurante.lat},${coordenadasRota.restaurante.lng}`;
        linkMapa.href = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origem)}&destination=${encodeURIComponent(destino)}&waypoints=${encodeURIComponent(parada)}&travelmode=driving`;
    }
    if (mapaMapbox?.getSource("rota-entrega")) {
        mapaMapbox.getSource("rota-entrega").setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: pontosRota.map(ponto => [ponto.lng, ponto.lat]) } });
    }
    ativarRotaAceita();
    recalcularRotaComLocalizacao();
}

window.addEventListener("garfoo:corrida-aceita", usarCorridaAceitaAtual);
window.addEventListener("garfoo:corrida-finalizada", ocultarMarcadoresERota);
window.addEventListener("garfoo:corrida-recusada", ocultarMarcadoresERota);
window.addEventListener("garfoo:corrida-sem-atual", ocultarMarcadoresERota);

async function recalcularRotaComLocalizacao() {
    try {
        const pontos = pontosRota.map(ponto => `${ponto.lng},${ponto.lat}`).join(";");
        if (mapaAlternativo) {
            const resposta = await fetch(`https://router.project-osrm.org/route/v1/driving/${pontos}?overview=full&geometries=geojson`);
            const dados = await resposta.json();
            if (!resposta.ok || !dados.routes?.[0]) throw new Error("Rota indisponível");
            if (corridaAceita) atualizarResumoRota(dados.routes[0]);
            coordenadasAlternativas = dados.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
            if (linhaAlternativa) {
                linhaAlternativa.setLatLngs(coordenadasAlternativas);
                mapaAlternativo.fitBounds(linhaAlternativa.getBounds(), { padding: [35, 35], maxZoom: 16, animate: true });
            }
            return;
        }
        if (!mapaMapbox?.getSource("rota-entrega")) return;
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${pontos}?geometries=geojson&overview=full&steps=false&access_token=${encodeURIComponent(tokenMapbox)}`;
        const resposta = await fetch(url);
        const dados = await resposta.json();
        if (!resposta.ok || !dados.routes?.[0]) throw new Error(dados.message || "Rota indisponível");
        atualizarResumoRota(dados.routes[0]);
        rotaCalculada = dados.routes[0].geometry;
        mapaMapbox.getSource("rota-entrega").setData({ type: "Feature", properties: {}, geometry: rotaCalculada });
        const limites = rotaCalculada.coordinates.reduce((bounds, ponto) => bounds.extend(ponto), new mapboxgl.LngLatBounds(rotaCalculada.coordinates[0], rotaCalculada.coordinates[0]));
        mapaMapbox.fitBounds(limites, { padding: 50, maxZoom: 15, duration: 800 });
    } catch (erro) {
        console.warn("Não foi possível atualizar a rota com a localização atual:", erro);
    }
}

function mostrarMapaAlternativo(mensagem) {
    const container = document.getElementById("mapa-rota-mapbox");
    if (!container) return;
    if (mapaMapbox) {
        mapaMapbox.remove();
        mapaMapbox = null;
    }
    container.replaceChildren();
    container.style.background = "#e9e7e2";
    if (!window.L) {
        if (!document.querySelector('link[data-leaflet-css]')) {
            const css = document.createElement("link");
            css.rel = "stylesheet";
            css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
            css.dataset.leafletCss = "";
            document.head.appendChild(css);
        }
        if (document.querySelector('script[data-leaflet-js]')) return;
        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.dataset.leafletJs = "";
        script.onload = () => iniciarMapaAlternativo(container, mensagem);
        script.onerror = () => mostrarFallbackMapa("Não foi possível carregar o mapa. Verifique sua conexão.");
        document.head.appendChild(script);
        return;
    }
    iniciarMapaAlternativo(container, mensagem);
}

function iniciarMapaAlternativo(container, mensagem) {
    const mapaDiv = document.createElement("div");
    mapaDiv.style.cssText = "position:absolute;inset:0;width:100%;height:100%";
    container.replaceChildren(mapaDiv);
    mapaAlternativo = L.map(mapaDiv).setView([coordenadasRota.restaurante.lat, coordenadasRota.restaurante.lng], 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(mapaAlternativo);
    marcadorEntregadorLeaflet = L.marker([coordenadasRota.entregador.lat, coordenadasRota.entregador.lng]).bindPopup("Entregador");
    marcadorRestauranteLeaflet = L.marker([coordenadasRota.restaurante.lat, coordenadasRota.restaurante.lng]).bindPopup("Restaurante — ponto de coleta");
    marcadorClienteLeaflet = L.marker([coordenadasRota.cliente.lat, coordenadasRota.cliente.lng]).bindPopup("Cliente");
    if (mapaFallback) mapaFallback.hidden = true;
    if (elevacaoRota) elevacaoRota.textContent = corridaAceita ? "Buscando o caminho da corrida aceita..." : mensagem;

    const pontos = pontosRota.map(ponto => `${ponto.lng},${ponto.lat}`).join(";");
    fetch(`https://router.project-osrm.org/route/v1/driving/${pontos}?overview=full&geometries=geojson`)
        .then(resposta => {
            if (!resposta.ok) throw new Error("Serviço de rota indisponível");
            return resposta.json();
        })
        .then(dados => {
            const rota = dados.routes?.[0];
            if (!rota) throw new Error("Rota não encontrada");
            coordenadasAlternativas = rota.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
            atualizarResumoRota(rota);
            if (corridaAceita) ativarRotaAceita();
        })
        .catch(erro => console.warn("Exibindo trajeto aproximado no mapa:", erro));
}

function adicionarCssMapbox() {
    if (document.querySelector('link[data-mapbox-css]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://api.mapbox.com/mapbox-gl-js/v3.15.0/mapbox-gl.css";
    link.dataset.mapboxCss = "";
    document.head.appendChild(link);
}

function carregarMapbox() {
    if (!mapaRota) return;
    if (!tokenMapbox) {
        mostrarMapaAlternativo("Mapa alternativo carregado; configure o token Mapbox para traçar a rota viária.");
        return;
    }

    adicionarCssMapbox();
    if (window.mapboxgl) {
        inicializarMapaRota();
        return;
    }
    const script = document.createElement("script");
    script.src = "https://api.mapbox.com/mapbox-gl-js/v3.15.0/mapbox-gl.js";
    script.async = true;
    script.onload = inicializarMapaRota;
    script.onerror = () => mostrarMapaAlternativo("Mapa alternativo carregado; o Mapbox não respondeu.");
    document.head.appendChild(script);
}

function inicializarMapaRota() {
    const container = document.getElementById("mapa-rota-mapbox");
    if (!window.mapboxgl || !container) {
        mostrarFallbackMapa("Não foi possível carregar o mapa.");
        return;
    }

    mapboxgl.accessToken = tokenMapbox;
    mapaMapbox = new mapboxgl.Map({
        container,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [coordenadasRota.restaurante.lng, coordenadasRota.restaurante.lat],
        zoom: 13
    });
    let estiloCarregado = false;
    mapaMapbox.on("error", evento => {
        console.error("Falha ao carregar o mapa Mapbox:", evento.error);
        if (!estiloCarregado) mostrarMapaAlternativo("Mapa alternativo carregado; verifique o token ou a conexão do Mapbox.");
    });
    mapaMapbox.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    [
        { ponto: coordenadasRota.entregador, rotulo: "E", titulo: "Entregador — início da rota" },
        { ponto: coordenadasRota.restaurante, rotulo: "R", titulo: "Restaurante — coleta do pedido" },
        { ponto: coordenadasRota.cliente, rotulo: "C", titulo: "Cliente" }
    ].forEach(({ ponto, rotulo, titulo }) => {
        const marcador = document.createElement("div");
        marcador.className = "marcador-rota-mapbox";
        marcador.textContent = rotulo;
        marcador.setAttribute("aria-label", titulo);
        marcador.style.visibility = "hidden";
        const instanciaMarcador = new mapboxgl.Marker({ element: marcador })
            .setLngLat([ponto.lng, ponto.lat])
            .setPopup(new mapboxgl.Popup({ offset: 18 }).setText(titulo))
            .addTo(mapaMapbox);
        if (titulo.startsWith("Entregador")) marcadorEntregadorMapbox = instanciaMarcador;
        else if (titulo.startsWith("Restaurante")) marcadorRestauranteMapbox = instanciaMarcador;
        else marcadorClienteMapbox = instanciaMarcador;
    });

    mapaMapbox.on("load", async () => {
        estiloCarregado = true;
        mapaFallback.hidden = true;
        const rotaDireta = {
            type: "Feature",
            properties: {},
            geometry: {
                type: "LineString",
                coordinates: pontosRota.map(ponto => [ponto.lng, ponto.lat])
            }
        };
        mapaMapbox.addSource("rota-entrega", { type: "geojson", data: rotaDireta });
        mapaMapbox.addLayer({
            id: "rota-entrega-linha",
            type: "line",
            source: "rota-entrega",
            layout: { "line-cap": "round", "line-join": "round", "visibility": corridaAceita ? "visible" : "none" },
            paint: { "line-color": "#e85c05", "line-width": 5, "line-dasharray": [2, 1] }
        });
        if (!corridaAceita) {
            if (elevacaoRota) elevacaoRota.textContent = "Aceite uma corrida para exibir os pontos e o caminho.";
            return;
        }
        const pontos = pontosRota.map(ponto => `${ponto.lng},${ponto.lat}`).join(";");
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${pontos}?geometries=geojson&overview=full&steps=false&access_token=${encodeURIComponent(tokenMapbox)}`;
        try {
            const resposta = await fetch(url);
            const dados = await resposta.json();
            const rota = dados.routes?.[0];
            if (!resposta.ok || !rota) throw new Error(dados.message || "Rota indisponível");

            mapaMapbox.getSource("rota-entrega").setData({ type: "Feature", properties: {}, geometry: rota.geometry });
            mapaMapbox.setPaintProperty("rota-entrega-linha", "line-dasharray", [1, 0]);
            const coordenadas = rota.geometry.coordinates;
            rotaCalculada = rota.geometry;
            if (corridaAceita) ativarRotaAceita();
            const resumo = document.querySelector("[data-resumo-rota]");
            if (resumo) resumo.textContent = `${(rota.distance / 1000).toFixed(1).replace(".", ",")} km · ${Math.max(1, Math.round(rota.duration / 60))} min ◷`;
            window.GarfooCorridas?.registrarRota(rota.distance / 1000, Math.max(1, Math.round(rota.duration / 60)));
            if (elevacaoRota) elevacaoRota.textContent = "Rota calculada pelo Mapbox.";
        } catch (erro) {
            console.error("Não foi possível calcular a rota:", erro);
            if (elevacaoRota) elevacaoRota.textContent = corridaAceita
                ? "Trajeto aproximado da corrida aceita."
                : "Aguardando uma corrida para exibir a rota.";
            if (corridaAceita) ativarRotaAceita();
        }
    });
}

carregarMapbox();
if (["aceita", "aguardando-retirada", "andamento"].includes(window.GarfooCorridas?.obterAtual()?.status)) {
    usarCorridaAceitaAtual();
}
