mapboxgl.accessToken = 'pk.eyJ1IjoicGVydGlsZSIsImEiOiJjaWhqa2Fya2gwbmhtdGNsemtuaW14YmNlIn0.67aoJXemP7021X6XxsF71g';

function checkWebGLSupport() {
  try {
    
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
      console.error('❌ Coudl not get WebGL context');
      return false;
    }
    
    const renderer = gl.getParameter(gl.RENDERER);
    const vendor = gl.getParameter(gl.VENDOR);
    const version = gl.getParameter(gl.VERSION);
    
    return true;
    
  } catch (e) {
    console.error('❌ Error when detecting WebGL:', e);
    return false;
  }
}

function isFirefox() {
  return navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
}

function getMapConfig() {
  const baseConfig = {
    container: 'mapColectivos',
    center: [-59.0058, -27.4348],
    zoom: 10,
    bearing: 45,
    style: 'mapbox://styles/mapbox/streets-v11'
  };

  if (isFirefox()) {
    return {
      ...baseConfig,
      preserveDrawingBuffer: false,
      antialias: false,
      failIfMajorPerformanceCaveat: false,
      attributionControl: false,
      maxZoom: 18,
      maxPitch: 0
    };
  }
  
  return {
    ...baseConfig,
    preserveDrawingBuffer: true,
    antialias: true,
    failIfMajorPerformanceCaveat: false
  };
}

function showWebGLError(diagnosticInfo = '') {
  const mapContainer = document.getElementById('mapColectivos');
  if (mapContainer) {
    const browserInfo = navigator.userAgent;
    const webglInfo = getWebGLInfo();
    
    mapContainer.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f5f5f5; border: 2px dashed #ccc; flex-direction: column; text-align: center; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h3 style="color: #666; margin-bottom: 15px;">⚠️ Error de WebGL</h3>
        <p style="color: #666; margin: 5px 0;">No se pudo inicializar el mapa 3D.</p>
        <button onclick="location.reload()" style="margin-top: 15px; padding: 10px 20px; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer;">🔄 Reintentar</button>
      </div>
    `;
  }
}

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

const LINE_COLORS = [
  '#FF1744', '#00E676', '#FF6D00', '#E91E63', '#2196F3',
  '#FFEB3B', '#9C27B0', '#00BCD4', '#8BC34A', '#F44336',
  '#3F51B5', '#FF9800', '#4CAF50', '#E91E63', '#607D8B',
  '#795548', '#009688', '#FFC107', '#673AB7', '#FF5722'
];

function calculateRouteLength(segments) {
  return segments.reduce((total, segment) => {
    return total + (segment.properties.length_km || 0);
  }, 0);
}

function createFiltersPanel() {
  const filtersPanel = document.createElement('div');
  filtersPanel.id = 'filters-panel';
  filtersPanel.innerHTML = `
    <h2><i class="fas fa-filter"></i> Filtros</h2>
    <div class="filters-section" id="filter-lines">
      <h3>Líneas de Colectivos</h3>
      <div style="margin-bottom: 0.5rem;">
        <button id="check-all-lines" style="background: #27ae60; color: white; border: none; padding: 0.3rem 0.8rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem; margin-right: 0.5rem;">
          Marcar todo
        </button>
        <button id="uncheck-all-lines" style="background: #e74c3c; color: white; border: none; padding: 0.3rem 0.8rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
          Desmarcar todo
        </button>
      </div>
      <div class="filters-options"></div>
    </div>
    <div class="filters-section" id="filter-surface">
      <h3>Tipo de superficie</h3>
      <div class="filters-options"></div>
    </div>
  `;
  return filtersPanel;
}

function generateStats(data, filteredData) {
  const allLines = new Set();
  let totalKmPaved = 0;
  let totalKmUnpaved = 0;

  data.features.forEach(feature => {
    const busLines = feature.properties.bus_lines ? feature.properties.bus_lines.split(',') : [];
    busLines.forEach(line => {
      allLines.add(line);
    });
    
    const length = feature.properties.length_km || 0;
    if (feature.properties.surface === 'paved') {
      totalKmPaved += length;
    } else {
      totalKmUnpaved += length;
    }
  });

  const visibleLines = new Set();
  let visibleKmPaved = 0;
  let visibleKmUnpaved = 0;
  
  filteredData.features.forEach(feature => {
    const busLines = feature.properties.bus_lines ? feature.properties.bus_lines.split(',') : [];
    busLines.forEach(line => {
      visibleLines.add(line);
    });
    
    const length = feature.properties.length_km || 0;
    if (feature.properties.surface === 'paved') {
      visibleKmPaved += length;
    } else {
      visibleKmUnpaved += length;
    }
  });

  return {
    totalLineas: allLines.size,
    totalKmPaved: totalKmPaved,
    totalKmUnpaved: totalKmUnpaved,
    lineasVisibles: visibleLines.size,
    visibleKmPaved: visibleKmPaved,
    visibleKmUnpaved: visibleKmUnpaved
  };
}

function updateStats(stats) {
  
  const kmPavimentadasElement = document.getElementById('km-pavimentadas');
  const kmSinPavimentarElement = document.getElementById('km-sin-pavimentar');
  
  if (kmPavimentadasElement) {
    kmPavimentadasElement.textContent = stats.visibleKmPaved.toFixed(1);
  } else {
    console.warn('⚠️ Element km-pavimentadas not found');
  }
  
  if (kmSinPavimentarElement) {
    kmSinPavimentarElement.textContent = stats.visibleKmUnpaved.toFixed(1);
  } else {
    console.warn('⚠️ Element km-sin-pavimentar not found');
  }
}

function addRouteLayers(map, data) {
  map.addSource('colectivos-routes', {
    type: 'geojson',
    data: data
  });
  
  map.addLayer({
    id: 'routes-unpaved',
    type: 'line',
    source: 'colectivos-routes',
    filter: ['==', ['get', 'surface'], 'unpaved'],
    paint: {
      'line-color': '#e74c3c',
      'line-width': 4,
      'line-opacity': 0.8
    }
  });
  
  map.addLayer({
    id: 'routes-paved',
    type: 'line',
    source: 'colectivos-routes',
    filter: ['==', ['get', 'surface'], 'paved'],
    paint: {
      'line-color': '#27ae60',
      'line-width': 2,
      'line-opacity': 0.6
    }
  });
}

function initializeMap() {
  const webglStatus = checkWebGLSupport();
  if (!webglStatus) {
    console.warn('⚠️ WebGL no se detectó correctamente, pero intentaremos cargar el mapa de todos modos');
  }

  try {
    const mapConfig = getMapConfig();
    console.log('Creando mapa con configuración:', isFirefox() ? 'Firefox' : 'Estándar');
    
    var mapColectivos = new mapboxgl.Map(mapConfig);
    
    const filtersPanel = createFiltersPanel();
    document.body.appendChild(filtersPanel);
    
    let allColectivosData = [];
    let filteredData = { type: "FeatureCollection", features: [] };
    let filterLines = new Set();
    let filterSurfaces = new Set();
    let markers = [];

    mapColectivos.on('error', function(e) {
      console.error('Mapbox map error:', e.error);
      showWebGLError(`Map error: ${e.error.message}`);
    });

    mapColectivos.on('load', function() {
      
      fetch('/buses-simple.geojson')
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response.json();
        })
        .then(data => {
          
          allColectivosData = data;
          
          const routesData = {};
          
          const busRoutesSummary = data.bus_routes_summary || {};
          
          data.features.forEach(feature => {
            // Obtener las líneas de este feature desde bus_lines
            const busLines = feature.properties.bus_lines ? feature.properties.bus_lines.split(',') : [];
            
            busLines.forEach(lineRef => {
              if (!routesData[lineRef]) {
                routesData[lineRef] = {
                  name: busRoutesSummary[lineRef]?.name || lineRef,
                  route_id: busRoutesSummary[lineRef]?.route_id || null,
                  segments: []
                };
              }
              routesData[lineRef].segments.push(feature);
            });
          });
          
          
          addRouteLayers(mapColectivos, data);
          
          createLineFilters(data.features);
          createSurfaceFilters(data.features);
          
          updateView();
          
        })
        .catch(error => {
          console.error('❌ Error when loading buses-simple.geojson:', error);
          const mapContainer = document.getElementById('mapColectivos');
          if (mapContainer) {
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); padding: 20px; background: #ffe6e6; color: #d00; border: 1px solid #faa; border-radius: 8px; z-index: 1000;';
            errorDiv.innerHTML = `
              <h3>⚠️ Error al cargar datos</h3>
              <p>No se pudo cargar el archivo buses-simple.geojson</p>
              <p><strong>Error:</strong> ${error.message}</p>
              <button onclick="location.reload()" style="margin-top: 10px; padding: 5px 15px; background: #d00; color: white; border: none; border-radius: 4px; cursor: pointer;">Reintentar</button>
            `;
            mapContainer.appendChild(errorDiv);
          }
        });
    });

    function createLineFilters(features) {
      const linesContainer = document.querySelector('#filter-lines .filters-options');
      const lineCount = {};
      
      features.forEach(feature => {
        const busLines = feature.properties.bus_lines ? feature.properties.bus_lines.split(',') : [];
        
        busLines.forEach(line => {
          lineCount[line] = (lineCount[line] || 0) + 1;
          filterLines.add(line);
        });
      });
      
      const sortedLines = Object.entries(lineCount).sort(([a], [b]) => {
        const numA = parseInt(a.match(/\d+/)?.[0] || '999');
        const numB = parseInt(b.match(/\d+/)?.[0] || '999');
        return numA !== numB ? numA - numB : a.localeCompare(b);
      });
      
      sortedLines.forEach(([line, count], index) => {
        const option = document.createElement('div');
        option.className = 'filter-option';
        option.innerHTML = `
          <input type="checkbox" id="line-${line}" checked data-line="${line}">
          <label for="line-${line}">${line}</label>
          <span class="filter-count">${count}</span>
        `;
        
        const colorBox = document.createElement('div');
        colorBox.style.cssText = `
          width: 12px;
          height: 12px;
          background: ${LINE_COLORS[index % LINE_COLORS.length]};
          border-radius: 2px;
          margin-left: 0.5rem;
        `;
        option.appendChild(colorBox);
        
        linesContainer.appendChild(option);
      });
      
      linesContainer.addEventListener('change', updateView);
      
      document.getElementById('check-all-lines').addEventListener('click', () => {
        document.querySelectorAll('#filter-lines input[type="checkbox"]').forEach(cb => {
          cb.checked = true;
        });
        updateView();
      });
      
      document.getElementById('uncheck-all-lines').addEventListener('click', () => {
        document.querySelectorAll('#filter-lines input[type="checkbox"]').forEach(cb => {
          cb.checked = false;
        });
        updateView();
      });
    }

    function createSurfaceFilters(features) {
      const surfacesContainer = document.querySelector('#filter-surface .filters-options');
      const surfaceCount = { 'paved': 0, 'unpaved': 0 };
      
      features.forEach(feature => {
        const surface = feature.properties.surface || 'unpaved';
        surfaceCount[surface] = (surfaceCount[surface] || 0) + 1;
        filterSurfaces.add(surface);
      });
      
      const surfaceConfig = [
        { key: 'unpaved', label: 'Sin pavimentar', defaultChecked: true },
        { key: 'paved', label: 'Pavimentadas', defaultChecked: true }
      ];
      
      surfaceConfig.forEach(({ key, label, defaultChecked }) => {
        if (surfaceCount[key] > 0) {
          const option = document.createElement('div');
          option.className = 'filter-option';
          option.innerHTML = `
            <input type="checkbox" id="surface-${key}" ${defaultChecked ? 'checked' : ''} data-surface="${key}">
            <label for="surface-${key}">${label}</label>
            <span class="filter-count">${surfaceCount[key]}</span>
          `;
          surfacesContainer.appendChild(option);
        }
      });
      
      surfacesContainer.addEventListener('change', updateView);
    }

    function updateView() {
      const activeLines = new Set();
      const activeSurfaces = new Set();
      
      document.querySelectorAll('#filter-lines input:checked').forEach(cb => {
        activeLines.add(cb.dataset.line);
      });
      
      document.querySelectorAll('#filter-surface input:checked').forEach(cb => {
        activeSurfaces.add(cb.dataset.surface);
      });
      
      const filtered = allColectivosData.features.filter(feature => {
        const surface = feature.properties.surface || 'desconocida';
        if (!activeSurfaces.has(surface)) return false;
        
        const busLines = feature.properties.bus_lines ? feature.properties.bus_lines.split(',') : [];
        return busLines.some(line => activeLines.has(line));
      });
      
      filteredData = {
        type: "FeatureCollection",
        features: filtered
      };
      
      const stats = generateStats(allColectivosData, filteredData);
      updateStats(stats);
      
      markers.forEach(({ marker, ref }) => {
        const isVisible = activeLines.has(ref);
        marker.getElement().style.display = isVisible ? 'flex' : 'none';
      });
      
      updateMapLayers(activeLines, activeSurfaces);
      
    }
    
    function updateMapLayers(activeLines, activeSurfaces) {
      if (!mapColectivos.getSource('colectivos-routes')) return;
      
      let lineFilter = null;
      if (activeLines.size > 0) {
        const lineChecks = Array.from(activeLines).map(line => {
          return ['>=', ['index-of', line, ['get', 'bus_lines']], 0];
        });
        
        if (lineChecks.length === 1) {
          lineFilter = lineChecks[0];
        } else {
          lineFilter = ['any', ...lineChecks];
        }
      }
      
      if (activeSurfaces.has('unpaved')) {
        let unpavedFilter = ['==', ['get', 'surface'], 'unpaved'];
        
        if (lineFilter) {
          unpavedFilter = ['all', unpavedFilter, lineFilter];
        }
        
        mapColectivos.setFilter('routes-unpaved', unpavedFilter);
        mapColectivos.setLayoutProperty('routes-unpaved', 'visibility', 'visible');
      } else {
        mapColectivos.setLayoutProperty('routes-unpaved', 'visibility', 'none');
      }

      if (activeSurfaces.has('paved')) {
        let pavedFilter = ['==', ['get', 'surface'], 'paved'];
        
        if (lineFilter) {
          pavedFilter = ['all', pavedFilter, lineFilter];
        }
        
        mapColectivos.setFilter('routes-paved', pavedFilter);
        mapColectivos.setLayoutProperty('routes-paved', 'visibility', 'visible');
      } else {
        mapColectivos.setLayoutProperty('routes-paved', 'visibility', 'none');
      }
    }

  } catch (mapError) {
    console.error('Error fatal creando el mapa:', mapError);
    showWebGLError(`Error al crear mapa: ${mapError.message}`);
  }
}

// Inicialite map when DOM is read
document.addEventListener('DOMContentLoaded', function() {
  initializeMap();
});

if (document.readyState === 'loading') {
} else {
  initializeMap();
}
