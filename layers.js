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
  zoom: 7,
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
  homeZoom: 7
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
// ---------------------------------------------------------------------------
// Escala
L.control.scale({
  position: 'bottomright',
  imperial: false
}).addTo(map);
//Créditos
map.attributionControl.setPrefix(
  '&copy; <a href="https://sites.google.com/view/alminhas">Projecto Alminhas</a>' + ' &copy; Mapa Interactivo: <a href="mailto:ezcorreia@gmail.com">Ezequiel Correia</a> | <a href="http://leafletjs.com" title="A JS library for interactive maps">Leaflet</a>'
);
// -------------- ler e acarregar os atibutos
function atributos(feature, layer) {
  counter++;
  //Topónimo original e Atual
  layer.bindTooltip(feature.properties.Top_Orig + "<br>" + feature.properties.Top_Atual);
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
          realce = L.circleMarker([lat, long], {
            "radius": 15,
            "fillColor": "#9c5f1f",
            "color": "red",
            "weight": 1,
            "opacity": 1
          }).addTo(map);
        } else {
          //se já existir, apenas muda de sítio
          realce.setLatLng([lat, long]);
        }
        document.getElementById('topInfo').innerHTML = "<div>Nº de Ordem: " + feature.properties.NO_1 + "&nbsp;&nbsp;&nbsp;Fólio: " + feature.properties.Folio + "</p><p>Topónimos :</p></div>";
        document.getElementById("tablePonto").innerHTML = "<td><p>Códice: " + feature.properties.Top_Orig + "</p><p>S.Daveau: " + feature.properties.Top_SD + "</p><p>Atual: " + feature.properties.Top_Atual + "</p></td><td><p>Distrito: " + feature.properties.Distrito + "</p><p>Concelho: " + feature.properties.Concelho + "</p><p>Freguesia: " + feature.properties.Freguesia + "</p></td>";
        document.getElementById("botInfo").innerHTML = "<p>Nota: " + obs + "</p>";

        var x = document.getElementById("caixaInfo");
        if (x.style.display === "none") {
          x.style.display = "block";
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
            realce = L.circleMarker([lat, long], {
                "radius": 15,
                "fillColor": "#9c5f1f",
                "color": "red",
                "weight": 1,
                "opacity": 1
            }).addTo(map);
        } else {
          //se já existir, apenas muda de sítio
          realce.setLatLng([lat, long]);
        }
        document.getElementById('topInfo').innerHTML = "<div>Nº de Ordem: " + feature.properties.NO_1 + "&nbsp;&nbsp;&nbsp;Fólio: " + feature.properties.Folio + "</p><p>Topónimos :</p></div>";
        document.getElementById("tablePonto").innerHTML = "<td><p>Códice: " + feature.properties.Top_Orig + "</p><p>S.Daveau: " + feature.properties.Top_SD + "</p><p>Atual: " + feature.properties.Top_Atual + "</p></td><td><p>Distrito: " + feature.properties.Distrito + "</p><p>Concelho: " + feature.properties.Concelho + "</p><p>Freguesia: " + feature.properties.Freguesia + "</p></td>";
        document.getElementById("botInfo").innerHTML = "<p>Nota: " + obs + "</p>";
        var x = document.getElementById("caixaInfo");
        if (x.style.display === "none") {
          x.style.display = "block";
        }
        var y = document.getElementById("tabToponimos");
        if (y.style.display === "none") {
          y.style.display = "block";
        }
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
    document.getElementById('btn' + letraSel).style.background = "none";
    letraSel=null;
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
  //Limpa a tabela antes de atualizar; é feito através do jQuery e remove apenas as linhas, deixando o cabeçalho
  //Limpa o conteúdo da tabela
  $("#jsoncontent tbody tr").remove();
  linhasTabela = null;
  //$("#jsoncontent tbody tr").remove();
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
      onEachFeature: atributos_filter
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

    /* removido com jQueryTableSorter
  if (document.getElementById('codice').checked == true) {
    document.getElementById("COD").style.color = "grey";
    document.getElementById("AT").style.color = "#A52A2A";
  } else {
    document.getElementById("COD").style.color = "#A52A2A";
    document.getElementById("AT").style.color = "grey";
  }
  document.getElementById("NO").style.color = "#A52A2A";
  document.getElementById("SD").style.color = "#A52A2A";
*/
  document.getElementById('contador').innerHTML = "Nº de topónimos: " + counter;
  //acrescenta à tabela todas as linhas com o tbody
  var tableBody = $("#jsoncontent tbody");
  tableBody.append(linhasTabela);
  $("#jsoncontent").trigger("update");
  $("#jsoncontent:has(tbody tr)").tablesorter();
  $("#jsoncontent").trigger("update");

  var y = document.getElementById("tabToponimos");
  if (y.style.display === "none") {
    y.style.display = "block";
  }
  if (miDist =="Todos") {
    y.style.display = "none"; //esconde a tabela
    map.fitBounds(geojson.getBounds());
  } else {
    map.addLayer(lugs);
    map.fitBounds(lugs.getBounds());
  }
}

function selConc() {
  if (letraSel != null) {
    document.getElementById('btn' + letraSel).style.background = "none";
    letraSel=null;
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
  //document.getElementById("jsoncontent").innerHTML ="";
  $("#jsoncontent tbody tr").remove();
  linhasTabela = null;
  //$("#jsoncontent tbody tr").remove();
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
        onEachFeature: atributos_filter
      });
  }
  /* removido com jQueryTableSorter
  if (document.getElementById('codice').checked == true) {
    document.getElementById("COD").style.color = "grey";
    document.getElementById("AT").style.color = "#A52A2A";
  } else {
    document.getElementById("COD").style.color = "#A52A2A";
    document.getElementById("AT").style.color = "grey";
  }
  document.getElementById("NO").style.color = "#A52A2A";
  document.getElementById("SD").style.color = "#A52A2A";
  */
  document.getElementById('contador').innerHTML = "Nº de topónimos: " + counter;
  //acrescenta à tabela todas as linhas com o tbody
  var tableBody = $("#jsoncontent tbody");
  tableBody.append(linhasTabela);
  $("#jsoncontent").trigger("update");
  $("#jsoncontent:has(tbody tr)").tablesorter();
  $("#jsoncontent").trigger("update");

  //$("#jsoncontent tr:nth-child(2n)").css("background-color","#f2f2f2");

  var y = document.getElementById("tabToponimos");
  if (y.style.display === "none") {
    y.style.display = "block";
  }
  if (miDist =="Todos" && miConc == "Todos") {
    y.style.display = "none"; //esconde a tabela
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
  //Limpa o conteúdo da tabela
  $("#jsoncontent tbody tr").remove();
  linhasTabela = null;
  //document.getElementById("jsoncontent").innerHTML = "<tbody>";

  miConc = document.getElementById('selbx_conc').value;
  miDist = document.getElementById('selbx_dist').value;
  if (letraSel != null){
    document.getElementById('btn' + letraSel).style.background = "none";
  }

  letraSel = n;

  document.getElementById('btn' + letraSel).style.background = "red";
  //Progress bar pode ir para aqui

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
        onEachFeature: atributos_filter
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
        onEachFeature: atributos_filter
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
        onEachFeature: atributos_filter
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
        onEachFeature: atributos_filter
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
        onEachFeature: atributos_filter
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
        onEachFeature: atributos_filter
      });
    }
  }

  /* removido com jQueryTableSorter
  if (document.getElementById('codice').checked == true) {
    document.getElementById("COD").style.color = "grey";
    document.getElementById("AT").style.color = "#A52A2A";
  } else {
    document.getElementById("COD").style.color = "#A52A2A";
    document.getElementById("AT").style.color = "grey";
  }
  document.getElementById("NO").style.color = "#A52A2A";
  document.getElementById("SD").style.color = "#A52A2A";
  */
  document.getElementById('contador').innerHTML = "Nº de topónimos: " + counter;

  //document.getElementById("jsoncontent").innerHTML = "</tbody>";
  //Mostra a tabela e é muito rápido a carregar o A, mas não ordena
  //$("#jsoncontent").trigger("sorton", [ [[1,0]]]);

  //acrescenta à tabela todas as linhas com o tbody
  var tableBody = $("#jsoncontent tbody");
  tableBody.append(linhasTabela);
  $("#jsoncontent").trigger("update");
  $("#jsoncontent:has(tbody tr)").tablesorter();
  $("#jsoncontent").trigger("update");
  /*
  $("#jsoncontent").tablesorter({
      textSorter: function(a,b) {
        return a,localeCompare(b);
      },
      sortList: [1,0]
    });*/
  //$("#jsoncontent").trigger("sorton", [$("#jsoncontent")[1,0].config.sortList]);
  //$("#jsoncontent").trigger("update");
  //sortTable();

  //$("#jsoncontent tr:nth-child(2n)").css("background-color","#f2f2f2");
  var y = document.getElementById("tabToponimos");
  if (y.style.display === "none") {
    y.style.display = "block";
  }
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


      //Acrescentar o fecho da caixa info; talvez possa incluir no removeluglayer
      counter = 1383;
      document.getElementById('contador').innerHTML = "Nº de topónimos: " + counter;
      document.getElementById("tabToponimos").style.display = "none";
    } else if (miDist != "Todos" && miConc == "Todos") {
      //Não faz isto no letra Sel
      selDist();
    } else if (miConc != "Todos") {
      selConc();
    }
    document.getElementById('btn' + letraSel).style.background = "none";
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
          realce = L.circleMarker(latlng, {
              "radius": 15,
              "fillColor": "#9c5f1f",
              "color": "red",
              "weight": 1,
              "opacity": 1
          }).addTo(map);
      } else {
          //se já existir, apenas muda de sítio
          realce.setLatLng(latlng);
      }
      map.setView(latlng, 14);
      var obs = feature.properties.Obs_VDigit;
       if (obs == null) {
          obs = "--";
      }
      document.getElementById('topInfo').innerHTML = "<div>Nº de Ordem: " + feature.properties.NO_1 + "&nbsp;&nbsp;&nbsp;Fólio: " + feature.properties.Folio + "</p><p>Topónimos :</p></div>";
      document.getElementById("tablePonto").innerHTML = "<td><p>Códice: " + feature.properties.Top_Orig + "</p><p>S.Daveau: " + feature.properties.Top_SD + "</p><p>Atual: " + feature.properties.Top_Atual + "</p></td><td><p>Distrito: " + feature.properties.Distrito + "</p><p>Concelho: " + feature.properties.Concelho + "</p><p>Freguesia: " + feature.properties.Freguesia + "</p></td>";
      //com as observações já não aparece. Porquê?
      document.getElementById("botInfo").innerHTML = "<p>Nota: " + obs + "</p>";
      var cx = document.getElementById("caixaInfo");
      if (cx.style.display == "none") {
        cx.style.display = "block";
      }
    }
  });
}

function ordenaNO(col) {
  /*document.getElementById("NO").style.color = "grey";
  document.getElementById("COD").style.color = "#A52A2A";
  document.getElementById("SD").style.color = "#A52A2A";
  document.getElementById("AT").style.color = "#A52A2A";*/
  var table, rows, switching, i, x, y, shouldSwitch;
  table = document.getElementById("jsoncontent");
  switching = true;
  /*Make a loop that will continue until
  no switching has been done:*/
  while (switching) {
    //start by saying: no switching is done:
    switching = false;
    rows = table.rows;
    /*Loop through all table rows (except the
    first, which contains table headers):*/
    for (i = 1; i < (rows.length - 1); i++) {
      //start by saying there should be no switching:
      shouldSwitch = false;
      /*Get the two elements you want to compare,
      one from current row and one from the next:*/
      x = rows[i].getElementsByTagName("td")[0];
      y = rows[i + 1].getElementsByTagName("td")[0];
      //check if the two rows should switch place:
      if (Number(x.innerHTML) > Number(y.innerHTML)) {
        //if so, mark as a switch and break the loop:
        shouldSwitch = true;
        break;
      }
    }
    if (shouldSwitch) {
      /*If a switch has been marked, make the switch
      and mark that a switch has been done:*/
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
    }
  }
}

function ordenaCol(col){

  var coluna = col.cellIndex;
  //Estilo da marca de ordenação
  /*
  if (coluna == 1) {
    document.getElementById("COD").style.color = "grey";
    document.getElementById("NO").style.color = "#A52A2A";
    document.getElementById("SD").style.color = "#A52A2A";
    document.getElementById("AT").style.color = "#A52A2A";
  } else if (coluna == 2) {
    document.getElementById("SD").style.color = "grey";
    document.getElementById("NO").style.color = "#A52A2A";
    document.getElementById("COD").style.color = "#A52A2A";
    document.getElementById("AT").style.color = "#A52A2A";
  } else if (coluna == 3) {
  document.getElementById("AT").style.color = "grey";
  document.getElementById("NO").style.color = "#A52A2A";
  document.getElementById("COD").style.color = "#A52A2A";
  document.getElementById("SD").style.color = "#A52A2A";
}*/
  //FONTE: https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_sort_table
  var table, rows, switching, i, x, y, shouldSwitch;
  table = document.getElementById("jsoncontent");
  switching = true;
  /*Make a loop that will continue until
  no switching has been done:*/
  while (switching) {
    //start by saying: no switching is done:
    switching = false;
    rows = table.rows;
    /*Loop through all table rows (except the
    first, which contains table headers):*/
    for (i = 1; i < (rows.length - 1); i++) {
      //start by saying there should be no switching:
      shouldSwitch = false;
      /*Get the two elements you want to compare,
      one from current row and one from the next:*/
      if (coluna == 0) {
        x = Number(rows[i].getElementsByTagName("td")[0]);
        y = Number(rows[i + 1].getElementsByTagName("td")[0]);
      } else if (coluna == 1) {
        x = rows[i].getElementsByTagName("td")[1];
        y = rows[i + 1].getElementsByTagName("td")[1];
      } else if (coluna == 2) {
        x = rows[i].getElementsByTagName("td")[2];
        y = rows[i + 1].getElementsByTagName("td")[2];
      } else {
        x = rows[i].getElementsByTagName("td")[3];
        y = rows[i + 1].getElementsByTagName("td")[3];
      }

    //EC: fazer com localCompare para poder ordenar sem ter em conta os acentos
      var topx = x.innerHTML.toLowerCase();
      var topy = y.innerHTML.toLowerCase();
      var result = topx.localeCompare(topy);
      //alert (result);
      if (result > 0) {
        //if so, mark as a switch and break the loop:
        shouldSwitch = true;
        break;
      }
    }
    if (shouldSwitch) {
      /*If a switch has been marked, make the switch
      and mark that a switch has been done:*/
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
    }
  }
}

function fechaInfo() {
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

//-------------------------
function sortTable() {
  //FONTE: https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_sort_table
  var table, rows, switching, i, x, y, shouldSwitch;
  table = document.getElementById("jsoncontent");
  switching = true;
  /*Make a loop that will continue until
  no switching has been done:*/
  while (switching) {
    //start by saying: no switching is done:
    switching = false;
    rows = table.rows;
    /*Loop through all table rows (except the
    first, which contains table headers):*/
    for (i = 1; i < (rows.length - 1); i++) {
      //start by saying there should be no switching:
      shouldSwitch = false;
      /*Get the two elements you want to compare,
      one from current row and one from the next:*/
      if (document.getElementById('codice').checked == true) {
        x = rows[i].getElementsByTagName("td")[1];
        y = rows[i + 1].getElementsByTagName("td")[1];
      } else {
        x = rows[i].getElementsByTagName("td")[3];
        y = rows[i + 1].getElementsByTagName("td")[3];
      }
      //check if the two rows should switch place:
//      if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
        //if so, mark as a switch and break the loop:
//        shouldSwitch = true;
//        break;
//      }

      //EC: fazer com localCompare para poder ordenar sem ter em conta os acentos
      var topx = x.innerHTML.toLowerCase();
      var topy = y.innerHTML.toLowerCase();
      var result = topx.localeCompare(topy);
      //alert (result);
      if (result > 0) {
        //if so, mark as a switch and break the loop:
        shouldSwitch = true;
        break;
      }
    }
    if (shouldSwitch) {
      /*If a switch has been marked, make the switch
      and mark that a switch has been done:*/
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
    }
  }
}

function fonte() {
  if (letraSel != null){
    selLetra(letraSel);
  }
}
