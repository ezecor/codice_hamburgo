/// --------------
//1. Mapas de baseMaps
//2. Configuração do alojamento do Mapa
//3. Elementos do mapa: controles
//4. Variáveis globais
//5. Carregamento do ficheiro geojson
//6. Preenche as dropdown lists com os nomes dos distritos
//7. Funções:
//7.1 atributos() : lê o ficheiro geojson e
//7.2 atributos_filter() : lê o ficheiro com o filtro aplicado; para poder manter sempre todos os pontos, cria-se uma nova função atributos
//7.3 selDist() : seleccionao um distritos
//7.4 selConc() : selecciona uma concelho
//7.5 selLetra() : selecciona todos os topónimos começados por uma letra do alfabeto
//7.6 linhaSel() : "selecciona" o topónimo da lista para poder deslocar o mapa para esse ponto (na verdade não deve ser uma selcção; deve ser um pan
//7.7 sortTable() : apresenta a tabela ordenada alfabeticamente
//7.8 removeLugLayer() : remove o layer de lugares seleccionados

// -------------
var osm_mapnik = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });
// ------------
var map = L.map('mapCanvas', {
  center: [40.85, -8.41],
  /*zoom: 7,*/
  maxZoom: 14,
  zoomControl: false,
  layers: [osm_mapnik]
    });
//plugin para incluir o botão de full extent. O zoomControl do leaflet passa a false
var zoomHome = L.Control.zoomHome({
  position: 'topleft',
  zoomHomeIcon: 'globe',
  zoomHomeTitle: 'Full extent',
  homeCoordinates: [39.5, -8.00],
  homeZoom: 6
});
zoomHome.addTo(map);
//----- VARIÁVEIS GLOBAIS
var counter = 0; // nº de elementos seleccionados
var dist = []; // array com o nome dos distritos
var conc = []; // array com o nome dos concelhos
var lugar = L.featureGroup(); // layer group para conter o ponto seleccionado na tabela
var lugs = L.featureGroup(); // layer group para conter os pontos seleccionados
var lugsel = false; // boleano para controlar a existência de lugares seleccionados
var realce = null; // para construir um layer coma seleçã
// variáveis para conter o nome do distrito ou do concelho que for seleccionado
var miDist = document.getElementById('selbx_dist').value;
var miConc = document.getElementById('selbx_conc').value;
var letraSel = null;
var linhasTabela = null;
var linhaSeleccionada = null;

//-------------- carregamento do ficheiro geojson
var geojson = L.geoJSON(toponimos, {
  //vai ler os atributos para a tooltip
  onEachFeature: atributos,
  // altera o estilo das marcas
  //2- Com CircleMarker; o raio é dado em pixeis e permanece fixo, não se ajusta ao zoom
  pointToLayer: function(feature, latlng) {
    return L.circleMarker (latlng, {
      fillColor: 'A9A9A', //'#7FFF00',
      color: '00000', //'#537898',
      radius: 3,
      weight: 1,
      fillOpacity: 0.6
    })
  }
}).addTo(map);

//Ajusta o mapa ao extent
map.fitBounds(geojson.getBounds());

//var centro = map.getCenter();
//alert(centro);
//Atualiza o nº de topónimos
document.getElementById('contador').innerHTML = "Nº de topónimos: " + counter;

//------------------- Drop-down lists com os nomes dos distritos e concelhos
// Distritos
var lista_dist = document.getElementById('selbx_dist');
var uniqueNames = []; //array com os nomes dos distritos
$.each(dist, function (i, el) {
  if ($.inArray(el, uniqueNames) === -1) {
    uniqueNames.push(el);
  }
});
//Ordena os nomes por ordem alfabética
uniqueNames.sort(function(a, b) {
  return a.localeCompare(b);
});
//adiciona os nomes à dropdown list
var i;
for (i = 0; i < uniqueNames.length; i++) {
  var opt = document.createElement('option');
  opt.value = uniqueNames[i];
  opt.innerHTML = uniqueNames[i];
  lista_dist.appendChild(opt);
}
//Concelhos
var lista_conc = document.getElementById('selbx_conc');
var uniqueNames = []; //array com os nomes dos concelhos
$.each(conc, function (i, el) {
  if ($.inArray(el, uniqueNames) === -1) {
    uniqueNames.push(el);
  }
});
uniqueNames.sort(function(a, b) {
  return a.localeCompare(b);
});
var i;
for (i = 0; i < uniqueNames.length; i++) {
  var opt = document.createElement('option');
  opt.value = uniqueNames[i];
  opt.innerHTML = uniqueNames[i];
  lista_conc.appendChild(opt);
}

//área de info a sobrepor-se ao Mapa
//Caixa de texto com os atributos
var info = L.control({position: "topright"});
info.onAdd = function(map){
    var div_info = L.DomUtil.create('div', 'cxInfo');
    div_info.setAttribute('id', 'caixaInfo');
    div_info.setAttribute('style', 'display: none');
    div_info.innerHTML = '<button id="close-btn" onclick="fechaInfo()">X</button>' + '<div id="topInfo"></div>' + '<table id="tablePonto"></table>' + '<div id="botInfo"></div>';
    return div_info;
};
info.addTo(map);
var info_top = document.getElementById("topInfo");
var info_tbl = document.getElementById("tablePonto");
//info_tbl.setAttribute('style', 'padding-right: 20px')
var info_bot = document.getElementById("botInfo");

// ---------------------------------------------------------------------------
// Escala
L.control.scale({
  position: 'bottomright',
  imperial: false
}).addTo(map);
//Créditos
map.attributionControl.setPrefix(
  '&copy; Mapa Interactivo: <a href="mailto:ezcorreia@gmail.com">Ezequiel Correia</a> | <a href="http://leafletjs.com" title="A JS library for interactive maps">Leaflet</a>'
);

//-------------tabela com os topónimos
var tableBody = $("#jsoncontent tbody");
tableBody.append(linhasTabela);
$("#jsoncontent").trigger("update");
$("#jsoncontent:has(tbody tr)").tablesorter({
  widgets: ["stickyHeaders"],
  widgetOptions: {stickyHeaders_attachTo: "#tabToponimos"},
    widthFixed: true,
  textSorter: function(a, b, direction, columnIndex, table) {
    return a.localeCompare(b);},
  sortList: [[1,0]]
});
$("#jsoncontent").trigger("update");

/*
$("#jsoncontent").tablesorter.tr:hover {
  background: yellow;
}*/

//-----
document.getElementById("tabToponimos").style.display = 'block';

// -------------- ler e acarregar os atibutos
function atributos(feature, layer) {
  counter++;
  //Topónimo original e Atual
  layer.bindTooltip(feature.properties.Top_Orig + "<br>" + feature.properties.Top_Atual);
  linhasTabela += "<tr onclick='linhaSel(this)'><td style='text-align:right'>" + feature.properties.NO_1 + "</td><td>" + feature.properties.Top_Orig + "</td><td>" + feature.properties.Top_SD + "</td><td>" + feature.properties.Top_Atual + "</td></tr>";
  layer.on({
    click:
      function populate() {
        var obs = feature.properties.Obs_VDigit;
        if (obs == null) {
          obs = "--";
        }
        //Armazena as coordenadas contidas nas propriedades em variáveis para serem atribuídas ao L.circleMarker
        var lat = feature.geometry.coordinates[1];
        var long = feature.geometry.coordinates[0];
        if (realce == null) {
          /*realce = L.circleMarker([lat, long], {
            "radius": 15,
            "fillColor": "#9c5f1f",
            "color": "red",
            "weight": 1,
            "opacity": 1
          }).addTo(map);*/
          var pulsingIcon = L.icon.pulse({iconSize:[20,20],color:'#A52A2A'});
          realce = L.marker([lat, long], {
            icon: pulsingIcon
          }).addTo(map);
        } else {
          //se já existir, apenas muda de sítio
          realce.setLatLng([lat, long]);
        }
        map.setView([lat, long], 10);
        /*
          document.getElementById('topInfo').innerHTML = "<div>Nº de Ordem: " + feature.properties.NO_1 + "&nbsp;&nbsp;&nbsp;Fólio: " + feature.properties.Folio + "</p><p>Topónimos :</p></div>";
        document.getElementById("tablePonto").innerHTML = "<td><p>Códice: " + feature.properties.Top_Orig + "</p><p>S.Daveau: " + feature.properties.Top_SD + "</p><p>Atual: " + feature.properties.Top_Atual + "</p></td><td><p>Distrito: " + feature.properties.Distrito + "</p><p>Concelho: " + feature.properties.Concelho + "</p><p>Freguesia: " + feature.properties.Freguesia + "</p></td>";
        document.getElementById("botInfo").innerHTML = "<p>Nota: " + obs + "</p>";
          */
      document.getElementById('topInfo').innerHTML = "<p><i>Nº de Ordem</i>: " + feature.properties.NO_1 + "&nbsp;&nbsp;&nbsp;<i>Fólio</i>: " + feature.properties.Folio +"</p><span class='brmedium'></span>";
      document.getElementById("tablePonto").innerHTML = "<td><p><i>Códice</i>: " + feature.properties.Top_Orig + "</p><p><i>S.Daveau</i>: " + feature.properties.Top_SD + "</p><p><i>Actual</i>: " + feature.properties.Top_Atual + "</p></td><td><p><i>&nbsp;&nbsp;Distrito</i>: " + feature.properties.Distrito + "</p><p><i>&nbsp;&nbsp;Concelho</i>: " + feature.properties.Concelho + "</p><p><i>&nbsp;&nbsp;Freguesia</i>: " + feature.properties.Freguesia + "</p></td>";
      document.getElementById("botInfo").innerHTML = "<p>Nota: " + obs + "</p>";

        var x = document.getElementById("caixaInfo");
        if (x.style.display === "none") {
          x.style.display = "inline-block";
        }
    }
  });
  dist.push(feature.properties.Distrito);
  conc.push(feature.properties.Concelho);
}

function atributos_filter(feature, layer) {
  counter++;
  layer.bindTooltip(feature.properties.Top_Orig + "<br>" + feature.properties.Top_Atual);
  //Cria uma tabela com os lugares
  //document.getElementById("jsoncontent").innerHTML += "<tr onclick='linhaSel(this)'><td style='text-align:right'>" + feature.properties.NO_1 + "</td><td>" + feature.properties.Top_Orig + "</td><td>" + feature.properties.Top_SD + "</td><td>" + feature.properties.Top_Atual + "</td></tr>";
  //document.getElementById("jsoncontent").innerHTML += "<tr><td style='text-align:right'>" + feature.properties.NO_1 + "</td><td>" + feature.properties.Top_Orig + "</td><td>" + feature.properties.Top_SD + "</td><td>" + feature.properties.Top_Atual + "</td></tr>";
  //Carrega para uma variável para poder ser usada com o jQuery
  linhasTabela += "<tr onclick='linhaSel(this)'><td style='text-align:right'>" + feature.properties.NO_1 + "</td><td>" + feature.properties.Top_Orig + "</td><td>" + feature.properties.Top_SD + "</td><td>" + feature.properties.Top_Atual + "</td></tr>";
  layer.on({
    click:
      function populate() {
        var obs = feature.properties.Obs_VDigit;
         if (obs == null) {
            obs = "--";
        }
        //Armazena as coordenadas contidas nas propriedades em variáveis para serem aatribuídas ao L.circleMarker
        var lat = feature.geometry.coordinates[1];
        var long = feature.geometry.coordinates[0];
        if (realce == null) {
            /*realce = L.circleMarker([lat, long], {
                "radius": 15,
                "fillColor": "#9c5f1f",
                "color": "red",
                "weight": 1,
                "opacity": 1
            }).addTo(map);*/
            var pulsingIcon = L.icon.pulse({iconSize:[20,20],color:'#A52A2A'});
            realce = L.marker([lat, long], {
              icon: pulsingIcon
            }).addTo(map);
        } else {
          //se já existir, apenas muda de sítio
          realce.setLatLng([lat, long]);
        }
        map.setView([lat, long], 10);
        /*
          document.getElementById('topInfo').innerHTML = "<div>Nº de Ordem: " + feature.properties.NO_1 + "&nbsp;&nbsp;&nbsp;Fólio: " + feature.properties.Folio + "</p><p>Topónimos :</p></div>";
        document.getElementById("tablePonto").innerHTML = "<td><p>Códice: " + feature.properties.Top_Orig + "</p><p>S.Daveau: " + feature.properties.Top_SD + "</p><p>Atual: " + feature.properties.Top_Atual + "</p></td><td><p>Distrito: " + feature.properties.Distrito + "</p><p>Concelho: " + feature.properties.Concelho + "</p><p>Freguesia: " + feature.properties.Freguesia + "</p></td>";
        document.getElementById("botInfo").innerHTML = "<p>Nota: " + obs + "</p>";
*/
      document.getElementById('topInfo').innerHTML = "<p><i>Nº de Ordem</i>: " + feature.properties.NO_1 + "&nbsp;&nbsp;&nbsp;<i>Fólio</i>: " + feature.properties.Folio +"</p><span class='brmedium'></span>";
      document.getElementById("tablePonto").innerHTML = "<td><p><i>Códice</i>: " + feature.properties.Top_Orig + "</p><p><i>S.Daveau</i>: " + feature.properties.Top_SD + "</p><p><i>Actual</i>: " + feature.properties.Top_Atual + "</p></td><td><p><i>&nbsp;&nbsp;Distrito</i>: " + feature.properties.Distrito + "</p><p><i>&nbsp;&nbsp;Concelho</i>: " + feature.properties.Concelho + "</p><p><i>&nbsp;&nbsp;Freguesia</i>: " + feature.properties.Freguesia + "</p></td>";
      document.getElementById("botInfo").innerHTML = "<p>Nota: " + obs + "</p>";

        var x = document.getElementById("caixaInfo");
        if (x.style.display === "none") {
          x.style.display = "inline-block";
        }
        /*
          var y = document.getElementById("tabToponimos");
        if (y.style.display === "none") {
          y.style.display = "block";
        }*/
      }
  });
  dist.push(feature.properties.Distrito);
  conc.push(feature.properties.Concelho);
}

function removeLugLayer(){
  if (map.hasLayer(lugs)) {
      map.removeLayer(lugs);
      lugsel=false;
  }
}

function selDist() {
  if (letraSel != null) {
    //document.getElementById('btn' + letraSel).style.background = "inherit";
    document.getElementById('btn' + letraSel).style.background = "#F0F0F0";
    document.getElementById('btn' + letraSel).style.color = "#444";
    letraSel=null;
    //document.getElementById("btnAZ").style.display = "inherit";
    document.getElementById("btnAZ").style.display = "none";
  }
  if (map.hasLayer(lugs)) {
      removeLugLayer();
  }
  //Limpa o realce
  if (realce != null) {
      map.removeLayer(realce);
      realce = null;
      document.getElementById("caixaInfo").style.display = "none";
  }
  counter = 0;

      //repõe o estilo do texto da linha seleccionada: problema, se seleccionar distrito deixa de funcionar
  if (linhaSeleccionada != null) {
    document.getElementById("jsoncontent").rows[linhaSeleccionada.rowIndex].style.fontWeight = "inherit"; //volta ao estado inicial
    document.getElementById("jsoncontent").rows[linhaSeleccionada.rowIndex].style.color = "inherit"; //Atenção: a fonte original não é black
    linhaSeleccionada = null;
  }

  //Limpa o conteúdo da tabela
  $("#jsoncontent tbody tr").remove();
  linhasTabela = null;

  miDist = document.getElementById('selbx_dist').value;
  //Esvazia o array dos concelhos para criar uma lista subordinada ao distrito
  conc=[];
  if (miDist == "Todos") {
    var geojson = L.geoJSON(toponimos, {
      //vai ler os atributos para a tooltip
      onEachFeature: atributos,
      // altera o estilo das marcas
      pointToLayer: function(feature, latlng) {
        return L.circleMarker (latlng, {
          fillColor: 'A9A9A', //'#7FFF00',
          color: '00000', //'#537898',
          radius: 3,
          weight: 1,
          fillOpacity: 0.6
        })
      }
    }).addTo(map);
    //Cria a lista de concelhos - com todos os concelhos
    var uniqueNames = [];
    $.each(conc, function (i, el) {
        if ($.inArray(el, uniqueNames) === -1) {
            uniqueNames.push(el);
        }
    });
    uniqueNames.sort(Intl.Collator().compare);
    //Esvazia a dropdown
    $(lista_conc).empty();
    //Cria o primeiro elemento da lista, que fica no topo: todos
    var opt = document.createElement('option');
    opt.value = "Todos";
    opt.innerHTML = "Todos";
    lista_conc.appendChild(opt);
    //Prrenche o resto da lista com a lista dos concelhos contida no array conc e ordena
    var i;
    for (i = 0; i < uniqueNames.length; i++) {
        opt = document.createElement('option');
        opt.value = uniqueNames[i];
        opt.innerHTML = uniqueNames[i];
        lista_conc.appendChild(opt);
    }
  } else {
    lugs = L.geoJSON(toponimos, {
      filter: function (feature, layer) {
        if (miDist != "Todos") {
          return (feature.properties.Distrito == miDist);
        } else {
          return true;
        }
      },
      onEachFeature: atributos_filter,
      pointToLayer: function(feature, latlng) {
        return L.circleMarker (latlng, {
          fillColor: '#2B82CB', //'red',
          color: 'white', //'#A52A2A',
          radius: 6,
          weight: 1,
          fillOpacity: 1 //0.8
        })
      }
    });
    //Cria a lista de concelhos
    var uniqueNames = [];
    $.each(conc, function (i, el) {
        if ($.inArray(el, uniqueNames) === -1) {
            uniqueNames.push(el);
        }
    });

    uniqueNames.sort(Intl.Collator().compare);

    //Esvazia a dropdown
    $(lista_conc).empty();
    //Cria o primeiro elemento da lista, que fica no topo: todos
    var opt = document.createElement('option');
    opt.value = "Todos";
    opt.innerHTML = "Todos";
    lista_conc.appendChild(opt);
    //Prrenche o resto da lista com a lista dos concelhos contida no array conc e ordena
    var i;
    for (i = 0; i < uniqueNames.length; i++) {
        opt = document.createElement('option');
        opt.value = uniqueNames[i];
        opt.innerHTML = uniqueNames[i];
        lista_conc.appendChild(opt);
    }
  }
  document.getElementById('contador').innerHTML = "Nº de topónimos: " + counter;

  //acrescenta à tabela todas as linhas com o tbody

    var tableBody = $("#jsoncontent tbody");
  tableBody.append(linhasTabela);
  $("#jsoncontent").trigger("update");
  $("#jsoncontent:has(tbody tr)").tablesorter();
  $("#jsoncontent").trigger("update");

/*
    var tableBody = $("#jsoncontent tbody");
tableBody.append(linhasTabela);
$("#jsoncontent").trigger("update");
$("#jsoncontent:has(tbody tr)").tablesorter({
  widgets: ["stickyHeaders"],
  widgetOptions: {stickyHeaders_attachTo: "#tabToponimos"},
  textSorter: function(a, b, direction, columnIndex, table) {
    return a.localeCompare(b);},
  sortList: [[1,0]]
});
$("#jsoncontent").trigger("update");
*/
    /*
  var y = document.getElementById("tabToponimos");
  if (y.style.display === "none") {
    y.style.display = "block";
  }*/
  if (miDist =="Todos") {
    //y.style.display = "none"; //esconde a tabela
    map.fitBounds(geojson.getBounds());
  } else {
    map.addLayer(lugs);
    map.fitBounds(lugs.getBounds());
  }
}

function selConc() {
  if (letraSel != null) {
    //document.getElementById('btn' + letraSel).style.background = "inherit";
    document.getElementById('btn' + letraSel).style.background = "#F0F0F0";
    document.getElementById('btn' + letraSel).style.color = "#444";
    letraSel=null;
    document.getElementById("btnAZ").style.display = "inherit";
  }
  if (map.hasLayer(lugs)) {
      removeLugLayer();
  }
  //Limpa o realce
  if (realce != null) {
      map.removeLayer(realce);
      realce = null;
      document.getElementById("caixaInfo").style.display = "none";
  }
  counter = 0;

          //repõe o estilo do texto da linha seleccionada: problema, se seleccionar distrito deixa de funcionar
  if (linhaSeleccionada != null) {
    document.getElementById("jsoncontent").rows[linhaSeleccionada.rowIndex].style.fontWeight = "inherit"; //volta ao estado inicial
    document.getElementById("jsoncontent").rows[linhaSeleccionada.rowIndex].style.color = "inherit"; //Atenção: a fonte original não é black
    linhaSeleccionada = null;
  }

  $("#jsoncontent tbody tr").remove();
  linhasTabela = null;

  miConc = document.getElementById('selbx_conc').value;
    //Esvazia o array dos distritos para criar uma lista subordinada ao concelho
    //dist=[];
  miDist = document.getElementById('selbx_dist').value;
  //Se não houver um distrito seleccionado
  if (miDist == "Todos" && miConc == "Todos") {
    var geojson = L.geoJSON(toponimos, {
      onEachFeature: atributos,
      //2- Com CircleMarker; o raio é dado em pixeis e permanece fixo, não se ajusta ao zoom
      pointToLayer: function(feature, latlng) {
        return L.circleMarker (latlng, {
          fillColor: 'A9A9A', //'#7FFF00',
          color: '00000', //'#537898',
          radius: 3,
          weight: 1,
          fillOpacity: 0.6
        })
      }
    }).addTo(map);
  } else {
      lugs = L.geoJSON(toponimos, {
        filter: function (feature, layer) {
          if (miConc != "Todos") {
            return (feature.properties.Concelho == miConc);
          } else {
            return (feature.properties.Distrito == miDist);
          }
        },
        onEachFeature: atributos_filter,
        pointToLayer: function(feature, latlng) {
          return L.circleMarker (latlng, {
            fillColor: '#2B82CB', //'red',
            color: 'white', //'#A52A2A',
            radius: 6,
            weight: 1,
            fillOpacity: 1 //0.8
          })
        }
      });
  }
  document.getElementById('contador').innerHTML = "Nº de topónimos: " + counter;

  //acrescenta à tabela todas as linhas com o tbody
  var tableBody = $("#jsoncontent tbody");
  tableBody.append(linhasTabela);
  $("#jsoncontent").trigger("update");
  $("#jsoncontent:has(tbody tr)").tablesorter();
  $("#jsoncontent").trigger("update");
/*
  var y = document.getElementById("tabToponimos");
  if (y.style.display === "none") {
    y.style.display = "block";
  }*/
  if (miDist =="Todos" && miConc == "Todos") {
    //y.style.display = "none"; //esconde a tabela
    map.fitBounds(geojson.getBounds());
  } else {
    map.addLayer(lugs);
    map.fitBounds(lugs.getBounds());
  }
}

function selLetra(n){

    if (map.hasLayer(lugs)) {
      removeLugLayer();
  }
  //Limpa o realce
  if (realce != null) {
      map.removeLayer(realce);
      realce = null;
      document.getElementById("caixaInfo").style.display = "none";
  }
  document.getElementById("btnAZ").style.display = "inline";
  counter = 0;
          //repõe o estilo do texto da linha seleccionada: problema, se seleccionar distrito deixa de funcionar
  if (linhaSeleccionada != null) {
    document.getElementById("jsoncontent").rows[linhaSeleccionada.rowIndex].style.fontWeight = "inherit"; //volta ao estado inicial
    document.getElementById("jsoncontent").rows[linhaSeleccionada.rowIndex].style.color = "inherit"; //Atenção: a fonte original não é black
    linhaSeleccionada = null;
  }
  //Limpa o conteúdo da tabela
  $("#jsoncontent tbody tr").remove();
  linhasTabela = null;

  miConc = document.getElementById('selbx_conc').value;
  miDist = document.getElementById('selbx_dist').value;
  if (letraSel != null){
    document.getElementById('btn' + letraSel).style.background = "#F0F0F0";
    document.getElementById('btn' + letraSel).style.color = "#444";
    //document.getElementById('btn' + letraSel).style.background = "none";
  }

  letraSel = n;

  document.getElementById('btn' + letraSel).style.background = "#A52A2A";
  document.getElementById('btn' + letraSel).style.color = "#fff";


  if (miDist == "Todos" && miConc == "Todos") {
    if (letraSel != "C") {
      lugs = L.geoJSON(toponimos, {
        filter: function (feature, layer) {
          if (document.getElementById('codice').checked == true) {
            /*document.getElementById("NO").style.color = "#A52A2A";
            document.getElementById("COD").style.color = "grey";
            document.getElementById("SD").style.color = "#A52A2A";
            document.getElementById("AT").style.color = "#A52A2A";*/
            if (feature.properties.Top_Orig.charAt(0) == letraSel) return true
          } else  {
            if (feature.properties.Top_Atual.charAt(0) == letraSel) return true
          }
        },
        onEachFeature: atributos_filter,
        pointToLayer: function(feature, latlng) {
          return L.circleMarker (latlng, {
            fillColor: '#2B82CB', //'red',
            color: 'white', //'#A52A2A',
            radius: 6,
            weight: 1,
            fillOpacity: 1 //0.8
          })
        }
        });
    } else {
      lugs = L.geoJSON(toponimos, {
        filter: function (feature, layer) {
          if (document.getElementById('codice').checked == true) {
            if (feature.properties.Top_Orig.charAt(0) == "C" || feature.properties.Top_Orig.charAt(0) == "Ç") return true
          } else  {
            if (feature.properties.Top_Atual.charAt(0) == "C" || feature.properties.Top_Atual.charAt(0) == "Ç") return true
          }
        },
        //if (feature.properties.Top_Orig.charAt(0) == "C" || feature.properties.Top_Orig.charAt(0) == "Ç") return true },
        onEachFeature: atributos_filter,
        pointToLayer: function(feature, latlng) {
          return L.circleMarker (latlng, {
            fillColor: '#2B82CB', //'red',
            color: 'white', //'#A52A2A',
            radius: 6,
            weight: 1,
            fillOpacity: 1 //0.8
          })
        }
      });
    }
  } else if (miDist != "Todos" && miConc == "Todos") {
    if (letraSel != "C") {
      lugs = L.geoJSON(toponimos, {
        filter: function (feature, layer) {
          if (document.getElementById('codice').checked == true) {
            if ((feature.properties.Distrito == miDist) && (feature.properties.Top_Orig.charAt(0) == letraSel)) return true
          } else {
            if ((feature.properties.Distrito == miDist) && (feature.properties.Top_Atual.charAt(0) == letraSel)) return true
          }
        },
        onEachFeature: atributos_filter,
        pointToLayer: function(feature, latlng) {
          return L.circleMarker (latlng, {
            fillColor: '#2B82CB', //'red',
            color: 'white', //'#A52A2A',
            radius: 6,
            weight: 1,
            fillOpacity: 1 //0.8
          })
        }
        });
    } else {
      lugs = L.geoJSON(toponimos, {
        filter: function (feature, layer) {
          if (document.getElementById('codice').checked == true) {
            if ((feature.properties.Distrito == miDist) &&  (feature.properties.Top_Orig.charAt(0) == "C" || feature.properties.Top_Orig.charAt(0) == "Ç")) return true
          } else {
            if ((feature.properties.Distrito == miDist) &&  (feature.properties.Top_Atual.charAt(0) == "C" || feature.properties.Top_Atual.charAt(0) == "Ç")) return true
          }
        },
        onEachFeature: atributos_filter,
        pointToLayer: function(feature, latlng) {
          return L.circleMarker (latlng, {
            fillColor: 'red', /*'#A52A2A',*/
            color: '#A52A2A',
            radius: 6,
            weight: 1,
            fillOpacity: 0.8
          })
        }
      });
    }
  } else if (miConc != "Todos") {
    if (letraSel != "C") {
      lugs = L.geoJSON(toponimos, {
        filter: function (feature, layer) {
          if (document.getElementById('codice').checked == true) {
            if ((feature.properties.Concelho == miConc) && (feature.properties.Top_Orig.charAt(0) == letraSel)) return true
          } else {
            if ((feature.properties.Concelho == miConc) && (feature.properties.Top_Atual.charAt(0) == letraSel)) return true
          }
        },
        onEachFeature: atributos_filter,
        pointToLayer: function(feature, latlng) {
          return L.circleMarker (latlng, {
            fillColor: '#2B82CB', //'red',
            color: 'white', //'#A52A2A',
            radius: 6,
            weight: 1,
            fillOpacity: 1 //0.8
          })
        }
        });
    } else {
      lugs = L.geoJSON(toponimos, {
        filter: function (feature, layer) {
          if (document.getElementById('codice').checked == true) {
            if ((feature.properties.Concelho == miConc) &&  (feature.properties.Top_Orig.charAt(0) == "C" || feature.properties.Top_Orig.charAt(0) == "Ç")) return true
          } else {
            if ((feature.properties.Concelho == miConc) &&  (feature.properties.Top_Atual.charAt(0) == "C" || feature.properties.Top_Atual.charAt(0) == "Ç")) return true
          }
        },
        onEachFeature: atributos_filter,
        pointToLayer: function(feature, latlng) {
          return L.circleMarker (latlng, {
            fillColor: '#2B82CB', //'red',
            color: 'white', //'#A52A2A',
            radius: 6,
            weight: 1,
            fillOpacity: 1 //0.8
          })
        }
      });
    }
  }

  document.getElementById('contador').innerHTML = "Nº de topónimos: " + counter;

  //acrescenta à tabela todas as linhas com o tbody
  var tableBody = $("#jsoncontent tbody");
  tableBody.append(linhasTabela);
  $("#jsoncontent").trigger("update");

  if (document.getElementById('codice').checked == true) {
    $("#jsoncontent:has(tbody tr)").tablesorter({
      textSorter: function(a, b, direction, columnIndex, table) {
        return a.localeCompare(b);},
      sortList: [[1,0]] //basta mexer aqui para atualizar
    });
    $("#jsoncontent").trigger("sorton", [[[1,0]]]);
  } else if (document.getElementById('atual').checked == true) {
    $("#jsoncontent:has(tbody tr)").tablesorter({
      textSorter: function(a, b, direction, columnIndex, table) {
        return a.localeCompare(b);},
      sortList: [[3,0]]        //basta mexer aqui para atualizar
    });
    $("#jsoncontent").trigger("sorton", [[[3,0]]]);
  }

  //eperiencia
  $("#jsoncontent").trigger("update");

/*
    var y = document.getElementById("tabToponimos");
  if (y.style.display === "none") {
    y.style.display = "block";
  }*/

  map.addLayer(lugs);
  map.fitBounds(lugs.getBounds());

}

function limpaSelLetra() {
  //se houver uma letra seleccionada:
  //muda o estado do botão,
  //se não houver seleção geográfica
  //passa o contador a zero, esconde a tabela e remove os lugares seleccionados
  if (letraSel != null){
    if (miDist == "Todos" && miConc == "Todos") {
      if (map.hasLayer(lugs)) {
          removeLugLayer();
      }
      //Limpa o realce
      if (realce != null) {
          map.removeLayer(realce);
          realce = null;
          document.getElementById("caixaInfo").style.display = "none";
      }

      //Limpa o conteúdo da tabela
      $("#jsoncontent tbody tr").remove();
      linhasTabela = null;

      counter = null;
      var geojson = L.geoJSON(toponimos, {
          //vai ler os atributos para a tooltip
          onEachFeature: atributos
        });

      document.getElementById('contador').innerHTML = "Nº de topónimos: " + counter;

      //acrescenta à tabela todas as linhas com o tbody
      var tableBody = $("#jsoncontent tbody");
      tableBody.append(linhasTabela);
      $("#jsoncontent").trigger("update");
      $("#jsoncontent:has(tbody tr)").tablesorter();
      $("#jsoncontent").trigger("update");
/*
      var y = document.getElementById("tabToponimos");
      if (y.style.display === "none") {
        y.style.display = "block";
      }
*/

      //document.getElementById("tabToponimos").style.display = "none";
    } else if (miDist != "Todos" && miConc == "Todos") {
      //Não faz isto no letra Sel
      selDist();
    } else if (miConc != "Todos") {
      selConc();
    }

    document.getElementById('btn' + letraSel).style.background = "#F0F0F0";
    document.getElementById('btn' + letraSel).style.color = "#444";
    letraSel=null;
    document.getElementById("btnAZ").style.display = "none";
  }
  //Extent de todos os pontos
  map.fitBounds(geojson.getBounds());
}

function linhaSel(x){

  //Limpa os lugares seleccionados
  if (map.hasLayer(lugar)) {
      map.removeLayer(lugar);
      lugar = null;
  }
  //Limpa o realce
  if (realce != null) {
      map.removeLayer(realce);
      realce = null;
  }
  //repõe o estulo do texto da linha seleccionada: problema, se seleccionar distrito deixa de funcionar
  if (linhaSeleccionada != null) {
    document.getElementById("jsoncontent").rows[linhaSeleccionada.rowIndex].style.fontWeight = "inherit"; //volta ao estado inicial
    document.getElementById("jsoncontent").rows[linhaSeleccionada.rowIndex].style.color = "inherit"; //Atenção: a fonte original não é black
    //linhaSeleccionada = null;
  }

  linhaSeleccionada = x;
  //Estilo de realce da seleção da linha
  //document.getElementById("jsoncontent").rows[x.rowIndex].style.backgroundColor = "red";
  document.getElementById("jsoncontent").rows[x.rowIndex].style.fontWeight = "bold";
  document.getElementById("jsoncontent").rows[x.rowIndex].style.color = "#A52A2A";
  //document.getElementById("jsoncontent").rows[x.rowIndex].setAttribute("style", "background-color:red;");

  //document.getElementById("jsoncontent").rows[x.rowIndex].addClass("highlight");

  //tENTATIVA DE LINHA COM COR DE SELECÇÃO
  //const linha = document.querySelector("#jsoncontent tr:nth-child(" + x.rowIndex + ")");
  //linha.style.background = "red";

  //$("#jsoncontent tr:nth-child(" + x.rowIndex + ")").css("background", "red");
  //$("#jsoncontent tr:nth-child(odd)").css("background-color", "#ff0000");
  //$("#jsoncontent tr:nth-child(odd) { background-color: red; }");

  //Número de Ordem
  var nordem = document.getElementById("jsoncontent").rows[x.rowIndex].cells.item(0).innerHTML;
  var lugar = L.geoJSON(toponimos, {
    filter: function(feature, layer) {
      //if (feature.properties.NO_1 == nordem) return true;
      return (feature.properties.NO_1 == nordem);
    },
    pointToLayer: function(feature, latlng) {
      //Cria marcade realce
      if (realce == null) {
          /*realce = L.circleMarker(latlng, {
              "radius": 15,
              "fillColor": "#9c5f1f",
              "color": "red",
              "weight": 1,
              "opacity": 1
          }).addTo(map);*/
          var pulsingIcon = L.icon.pulse({iconSize:[20,20],color:'#A52A2A'});
          realce = L.marker(latlng, {
            icon: pulsingIcon
          }).addTo(map);
      } else {
          //se já existir, apenas muda de sítio
          realce.setLatLng(latlng);
      }
      map.setView(latlng, 10);
      var obs = feature.properties.Obs_VDigit;
       if (obs == null) {
          obs = "--";
      }
      //Preenche a caixaInfo
      //document.getElementById('topInfo').innerHTML = "<div>Nº de Ordem: " + feature.properties.NO_1 + "&nbsp;&nbsp;&nbsp;Fólio: " + feature.properties.Folio + "</p><p>Topónimos :</p></div>";
      //document.getElementById("tablePonto").innerHTML = "<td><p>Códice: " + feature.properties.Top_Orig + "</p><p>S.Daveau: " + feature.properties.Top_SD + "</p><p>Atual: " + feature.properties.Top_Atual + "</p></td><td><p>Distrito: " + feature.properties.Distrito + "</p><p>Concelho: " + feature.properties.Concelho + "</p><p>Freguesia: " + feature.properties.Freguesia + "</p></td>";
      //document.getElementById("botInfo").innerHTML = "<p>Nota: " + obs + "</p>";

      //info_top.innerHTML = "<i>Nº de Ordem:</i> " + feature.properties.NO_1 + "&nbsp;&nbsp;&nbsp;Fólio: " + feature.properties.Folio + "</p><p>Topónimos :</p>";
      info_top.innerHTML = "<p><i>Nº de Ordem</i>: " + feature.properties.NO_1 + "&nbsp;&nbsp;&nbsp;<i>Fólio</i>: " + feature.properties.Folio +"</p><span class='brmedium'></span>";
      info_tbl.innerHTML = "<td><p><i>Códice</i>: " + feature.properties.Top_Orig + "</p><p><i>S.Daveau</i>: " + feature.properties.Top_SD + "</p><p><i>Actual</i>: " + feature.properties.Top_Atual + "</p></td><td><p><i>&nbsp;&nbsp;Distrito</i>: " + feature.properties.Distrito + "</p><p><i>&nbsp;&nbsp;Concelho</i>: " + feature.properties.Concelho + "</p><p><i>&nbsp;&nbsp;Freguesia</i>: " + feature.properties.Freguesia + "</p></td>";
      info_bot.innerHTML = "<p>Nota: " + obs + "</p>";

      var cx = document.getElementById("caixaInfo");
      if (cx.style.display == "none") {
        cx.style.display = "inline-block";
      }
    }
  });
}

function fechaInfo() {

  //repõe o estulo do texto da linha seleccionada
  if (linhaSeleccionada != null) {
    document.getElementById("jsoncontent").rows[linhaSeleccionada.rowIndex].style.fontWeight = "inherit"; //volta ao estado inicial
    document.getElementById("jsoncontent").rows[linhaSeleccionada.rowIndex].style.color = "inherit"; //Atenção: a fonte original não é black
    linhaSeleccionada = null;
  }
  //limpa a caixaInfo
  var cx = document.getElementById("caixaInfo");
  if (cx.style.display != "none") {
    cx.style.display = "none";
  }
  //Limpa o realce
  if (realce != null) {
      map.removeLayer(realce);
      realce = null;
  }
  //Extent dos pontos seleccionados
  map.fitBounds(lugs.getBounds());
}

function fonte() {
  if (letraSel != null){
    selLetra(letraSel);
  }
}
