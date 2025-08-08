// JavaScript code for map and features

mapboxgl.accessToken = 'pk.eyJ1IjoicGVydGlsZSIsImEiOiJjaWhqa2Fya2gwbmhtdGNsemtuaW14YmNlIn0.67aoJXemP7021X6XxsF71g';

// Referencia a la hoja de estilos obras-en-curso.css
const cssLink = document.createElement('link');
cssLink.rel = 'stylesheet';
cssLink.href = '/obras-en-curso.css';
document.head.appendChild(cssLink);

// Función para detectar soporte de WebGL con diagnóstico detallado
function checkWebGLSupport() {
  try {
    console.log('🔍 Detectando soporte de WebGL...');
    
    // Crear canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    // Intentar obtener contexto WebGL
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
      console.error('❌ No se pudo obtener contexto WebGL');
      return false;
    }
    
    // Verificar que el contexto es funcional
    const renderer = gl.getParameter(gl.RENDERER);
    const vendor = gl.getParameter(gl.VENDOR);
    const version = gl.getParameter(gl.VERSION);
    
    console.log('✅ WebGL detectado exitosamente:');
    console.log('  - Renderer:', renderer);
    console.log('  - Vendor:', vendor);
    console.log('  - Version:', version);
    
    // Crear un shader simple para probar funcionalidad básica
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    if (!vertexShader) {
      console.error('❌ No se pudo crear vertex shader');
      return false;
    }
    
    // Limpiar recursos
    gl.deleteShader(vertexShader);
    
    return true;
    
  } catch (e) {
    console.error('❌ Error al detectar WebGL:', e);
    return false;
  }
}

// Detectar si es Firefox
function isFirefox() {
  return navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
}

// Configuración específica para navegadores con mejores fallbacks
function getMapConfig() {
  const baseConfig = {
    container: 'mapGranResistencia',
    center: [-59.0058, -27.4348],
    zoom: 11.5,
    bearing: 45,
    style: 'mapbox://styles/mapbox/streets-v11' // Usar estilo estándar primero
  };

  // Configuraciones adicionales para Firefox
  if (isFirefox()) {
    console.log('🦊 Configuración para Firefox');
    return {
      ...baseConfig,
      preserveDrawingBuffer: false, // Firefox funciona mejor con esto en false
      antialias: false, // Deshabilitar antialiasing en Firefox
      failIfMajorPerformanceCaveat: false, // Permitir WebGL incluso con advertencias de rendimiento
      attributionControl: false, // Reducir elementos que puedan causar problemas
      maxZoom: 18, // Limitar zoom máximo
      maxPitch: 0 // Deshabilitar pitch en Firefox
    };
  }
  
  console.log('🌐 Configuración estándar');
  return {
    ...baseConfig,
    preserveDrawingBuffer: true,
    antialias: true,
    failIfMajorPerformanceCaveat: false // Más tolerante
  };
}

// Función para mostrar mensaje de error con más información
function showWebGLError(diagnosticInfo = '') {
  const mapContainer = document.getElementById('mapGranResistencia');
  if (mapContainer) {
    // Obtener información del navegador
    const browserInfo = navigator.userAgent;
    const webglInfo = getWebGLInfo();
    
    mapContainer.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f5f5f5; border: 2px dashed #ccc; flex-direction: column; text-align: center; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h3 style="color: #666; margin-bottom: 15px;">⚠️ Error de WebGL</h3>
        <p style="color: #666; margin: 5px 0;">No se pudo inicializar el mapa 3D.</p>
        <details style="margin: 15px 0; width: 100%;">
          <summary style="cursor: pointer; color: #0074d9;">Ver información técnica</summary>
          <div style="text-align: left; margin-top: 10px; font-family: monospace; font-size: 12px; background: #fff; padding: 10px; border-radius: 5px;">
            <strong>Navegador:</strong> ${browserInfo}<br>
            <strong>WebGL Info:</strong> ${webglInfo}<br>
            ${diagnosticInfo ? '<strong>Diagnóstico:</strong> ' + diagnosticInfo : ''}
          </div>
        </details>
        <p style="color: #666; margin: 5px 0;"><strong>Soluciones sugeridas:</strong></p>
        <ul style="text-align: left; color: #666;">
          <li>Reinicie el navegador completamente</li>
          <li>Actualice su navegador a la última versión</li>
          <li>Habilite la aceleración por hardware en configuración</li>
          <li>Pruebe con otro navegador (Chrome, Firefox, Edge)</li>
          <li>Verifique que su tarjeta gráfica soporte WebGL</li>
        </ul>
        <button onclick="location.reload()" style="margin-top: 15px; padding: 10px 20px; background: #0074d9; color: white; border: none; border-radius: 5px; cursor: pointer;">🔄 Reintentar</button>
      </div>
    `;
  }
}

// Función para obtener información de WebGL
function getWebGLInfo() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      return `Renderer: ${gl.getParameter(gl.RENDERER)}, Vendor: ${gl.getParameter(gl.VENDOR)}`;
    }
    return 'No disponible';
  } catch (e) {
    return `Error: ${e.message}`;
  }
}

// Función principal para inicializar el mapa
function initializeMap() {
  // Verificar WebGL pero no bloquear si falla
  const webglStatus = checkWebGLSupport();
  if (!webglStatus) {
    console.warn('⚠️ WebGL no se detectó correctamente, pero intentaremos cargar el mapa de todos modos');
  }

  try {
    // Usar configuración específica según el navegador
    const mapConfig = getMapConfig();
    console.log('Creando mapa con configuración:', isFirefox() ? 'Firefox' : 'Estándar');
    
    var mapGranResistencia = new mapboxgl.Map(mapConfig);

    // Manejo de errores del mapa específico para Firefox
    mapGranResistencia.on('error', function(e) {
      console.error('Error del mapa Mapbox:', e.error);
      
      // Si es Firefox y hay problemas con el estilo, intentar con estilo predeterminado
      if (isFirefox() && e.error && e.error.message && e.error.message.includes('style')) {
        console.log('Intentando cargar mapa con estilo predeterminado para Firefox...');
        try {
          mapGranResistencia.setStyle('mapbox://styles/mapbox/streets-v11');
        } catch (fallbackError) {
          console.error('Error con estilo de fallback:', fallbackError);
          showWebGLError();
        }
      } else {
        showWebGLError();
      }
    });

    // Evento de carga del mapa
    mapGranResistencia.on('load', function () {
        try {
            mapGranResistencia.addLayer({
                id: 'obras',
                type: 'line',
                source: {
                    type: 'geojson',
                    data: '/Obras GeoResistencia.geojson'
                },
                "layout": {
                    "line-join": "round",
                    "line-cap": "round"
                },
                'paint': {
                    'line-color': '#ff0000',
                    'line-width': 4
                },
                "filter": ["==", ["get", "surface"], "construction"]
            });
        } catch (error) {
            console.error('Error al agregar la capa:', error);
        }
    });

    var layers = ['Obra nueva', 'Obra en ejecución', 'Calles pavimentadas', 'Calles de tierra', 'Avenidas pavimentadas', 'Avenidas de tierra'];
    var colors = ['#ff0000', '#009900', '#907e7d', '#FFFFFF', '#f3c4aa', '#f3f0b7'];

    // Add checkbox controls
    fetch('/Obras GeoResistencia.geojson')
        .then(response => response.json())
        .then(data => {
        const constructionFeatures = data.features.filter(f => f.properties.surface === 'construction');
        const groupedByObra = constructionFeatures.reduce((acc, feature) => {
          const obra = feature.properties.Obra;
          if (!acc[obra]) {
            acc[obra] = {
              features: [],
              bounds: new mapboxgl.LngLatBounds()
            };
          }
          acc[obra].features.push({
            coordinates: feature.geometry.coordinates,
            properties: feature.properties
          });

          // Extend bounds for LineString
          if (feature.geometry.type === 'LineString') {
            feature.geometry.coordinates.forEach(coord => {
              acc[obra].bounds.extend(coord);
            });
          }
          // Extend bounds for MultiLineString
          else if (feature.geometry.type === 'MultiLineString') {
            feature.geometry.coordinates.forEach(line => {
              line.forEach(coord => {
                acc[obra].bounds.extend(coord);
              });
            });
          }

          return acc;
        }, {});
        Object.entries(groupedByObra).forEach(([obraName, obraData]) => {
          const center = obraData.bounds.getCenter();
          const el = document.createElement('div');
          const data = obraData.features[0].properties;
          el.className = 'construction-marker';
          el.innerHTML = '<i class="fas fa-person-digging" style="font-size: 24px;"></i>';
          const marker = new mapboxgl.Marker({
              element: el,
              anchor: 'center',
              draggable: false,
          })
            .setLngLat(center)
            .addTo(mapGranResistencia);

          // Create popup with close button enabled
          const popup = new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: true
            }).setHTML(`<h2><a href="${data.link_progress}" target="_blank">${data.type}: ${data.title}</a></h2><h3>${data.municipality}</h3><h3>Longitud: ${data.length}&nbsp;m ${data.estimated ? '(estimado)' : ''}</h3><p>${data.short_description}</p><p>Fecha de inicio: ${(new Date(data.start).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }))}</p>`);

          // Show popup on mouse enter (escritorio) y touch/click (móvil)
          marker.getElement().addEventListener('mouseenter', () => {
            popup.setLngLat(center).addTo(mapGranResistencia);
          });

          // Soporte para dispositivos táctiles (móviles)
          marker.getElement().addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevenir zoom accidental
            popup.setLngLat(center).addTo(mapGranResistencia);
          });

          // Soporte adicional para click en móviles
          marker.getElement().addEventListener('click', (e) => {
            // Si ya hay un popup abierto en este marcador, hacer zoom
            if (popup._map) {
              mapGranResistencia.fitBounds(obraData.bounds, {
                padding: 50,
                duration: 1000,
                bearing: 45
              });
            } else {
              // Si no hay popup, mostrarlo
              popup.setLngLat(center).addTo(mapGranResistencia);
            }
          });

          // Hide popup on mouse leave (solo para escritorio)
          // Detectar si es dispositivo táctil
          const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
          
          if (!isTouchDevice) {
            // Solo en escritorio: ocultar popup al salir con el mouse
            popup.on('open', () => {
              const popupElement = popup.getElement();
              popupElement.addEventListener('mouseleave', () => {
                popup.remove();
              });
            });
          }
        });

        // --- Agregar lista de obras dentro de un div específico ---
        let listaObrasContainer = document.getElementById('lista-obras-container');
        if (!listaObrasContainer) {
          listaObrasContainer = document.createElement('div');
          listaObrasContainer.id = 'lista-obras-container';
          // Insertar después del mapa si existe, si no al final del body
          const mapaDiv = document.getElementById('mapGranResistencia');
          if (mapaDiv && mapaDiv.parentNode) {
            mapaDiv.parentNode.insertBefore(listaObrasContainer, mapaDiv.nextSibling);
          } else {
            document.body.appendChild(listaObrasContainer);
          }
        }
        // --- Listado principal con separadores ---
        const listaObras = document.createElement('div');
        listaObras.id = 'lista-obras';
        listaObras.innerHTML = '<h2>Listado de obras en ejecución</h2>' +
          Object.entries(groupedByObra).map(([obraName, obraData], idx, arr) => {
            const data = obraData.features[0].properties;
            return `
              <div style="margin-bottom:1.5em;">
                <h3><a href="${data.link_progress}" target="_blank">${data.type}: ${data.title}</a></h3>
                <div><strong>Municipio:</strong> ${data.municipality}</div>
                <div><strong>Longitud:</strong> ${data.length}&nbsp;m ${data.estimated ? '(estimado)' : ''}</div>
                <div><strong>Descripción:</strong> ${data.short_description}</div>
                <div><strong>Fecha de inicio:</strong> ${(new Date(data.start).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }))}</div>
                <div style="margin-top:0.5em;"><em>Nota: <a href="${data.link_progress}" target="_blank">Ver avance de obra</a></em></div>
                ${idx < arr.length - 1 ? '<hr style="margin:1.5em 0;">' : ''}
              </div>
            `;
          }).join('');
        listaObrasContainer.appendChild(listaObras);

        // --- Listado lateral derecho de obras ---
        let listaObrasLateral = document.getElementById('lista-obras-lateral');
        if (!listaObrasLateral) {
          listaObrasLateral = document.createElement('div');
          listaObrasLateral.id = 'lista-obras-lateral';
          listaObrasLateral.style.position = 'fixed';
          listaObrasLateral.style.top = '80px';
          listaObrasLateral.style.right = '0';
          listaObrasLateral.style.width = '320px';
          listaObrasLateral.style.maxHeight = '80vh';
          listaObrasLateral.style.overflowY = 'auto';
          listaObrasLateral.style.background = '#fff';
          listaObrasLateral.style.borderLeft = '2px solid #eee';
          listaObrasLateral.style.boxShadow = '-2px 0 8px #0001';
          listaObrasLateral.style.zIndex = '9999';
          listaObrasLateral.style.padding = '1em';
          document.body.appendChild(listaObrasLateral);
        }
        // Limpiar y agregar listado de títulos
        listaObrasLateral.innerHTML = '<h2>Obras</h2>' +
          '<ul style="list-style:none; padding:0;">' +
          Object.entries(groupedByObra).map(([obraName, obraData], idx) => {
            const data = obraData.features[0].properties;
            return `<li style="margin-bottom:0.7em;">
              <a href="#" style="font-weight:bold; color:#0074d9; text-decoration:underline;" data-obra="${obraName}">${data.title}</a>
            </li>`;
          }).join('') + '</ul>';

        // Agregar evento para hacer zoom al hacer clic en el título
        listaObrasLateral.querySelectorAll('a[data-obra]').forEach(a => {
          a.addEventListener('click', function(e) {
            e.preventDefault();
            const obraName = this.getAttribute('data-obra');
            const obraData = groupedByObra[obraName];
            if (obraData && obraData.bounds) {
              mapGranResistencia.fitBounds(obraData.bounds, {
                padding: 50,
                duration: 1000,
                bearing: 45
              });
            }
          });
        });
    })
    .catch(error => {
        console.error('Error al cargar el archivo GeoJSON:', error);
        const mapContainer = document.getElementById('mapGranResistencia');
        if (mapContainer) {
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = 'padding: 20px; background: #ffe6e6; color: #d00; border: 1px solid #faa; margin: 10px 0;';
            errorDiv.innerHTML = '⚠️ Error al cargar los datos de obras. Verifique la conexión y la disponibilidad del archivo.';
            mapContainer.parentNode.insertBefore(errorDiv, mapContainer.nextSibling);
        }
    });

  } catch (mapError) {
    console.error('Error fatal creando el mapa:', mapError);
    showWebGLError(`Error al crear mapa: ${mapError.message}`);
  }
}

// Intentar inicializar el mapa
initializeMap();