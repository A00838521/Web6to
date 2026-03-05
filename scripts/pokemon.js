// Variables para guardar los datos
let allPokemons = [];
let pokemonTypes = [];
let currentTypeFilter = 'all';

// Obtener los tipos de pokemones de la API
async function loadPokemonTypes() {
  let response = await fetch('https://pokeapi.co/api/v2/type');
  let data = await response.json();
  
  // Filtrar los tipos para quitar 'unknown' y 'shadow'
  pokemonTypes = data.results.filter(t => t.name !== 'unknown' && t.name !== 'shadow');
  
  // Mostrar los botones de filtro
  renderTypeFilter();
}

// Crear los botones de filtro por tipo
function renderTypeFilter() {
  let container = document.getElementById('typeFilter');
  // Crear botón de Todos
  let html = '<button class="btn btn-outline-primary me-2 mb-2 filter-btn active" data-type="all">Todos</button>';
  
  // Crear un botón para cada tipo
  for (let type of pokemonTypes) {
    let name = type.name.charAt(0).toUpperCase() + type.name.slice(1);
    html += `<button class="btn btn-outline-primary me-2 mb-2 filter-btn" data-type="${type.name}">${name}</button>`;
  }
  
  // Agregar los botones al HTML
  container.innerHTML = html;
  
  // Agregar eventos a cada botón
  let buttons = document.querySelectorAll('.filter-btn');
  for (let btn of buttons) {
    btn.addEventListener('click', function(e) {
      for (let b of buttons) b.classList.remove('active');
      e.target.classList.add('active');
      currentTypeFilter = e.target.dataset.type;
      applyFilters();
    });
  }
}

// Traer todos los pokemones de la API
async function loadAllPokemons() {
  let response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1025&offset=0');
  let data = await response.json();
  
  // Obtener los detalles de cada pokémon
  for (let poke of data.results) {
    let res = await fetch(poke.url);
    let pokemon = await res.json();
    
    // Guardar solo los tipos del pokémon
    let types = [];
    for (let t of pokemon.types) {
      types.push(t.type.name);
    }
    
    // Guardar la información importante del pokémon
    allPokemons.push({
      id: pokemon.id,
      name: pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1),
      image: pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default,
      types: types
    });
  }
  
  // Filtrar y mostrar los pokemones
  applyFilters();
}

// Filtrar los pokemones por tipo, nombre e id
function applyFilters() {
  // Obtener los valores de búsqueda
  let name = document.getElementById('searchName').value.toLowerCase();
  let id = document.getElementById('searchId').value;
  let filtered = [];
  
  // Filtrar los pokemones por tipo, nombre e id
  for (let pokemon of allPokemons) {
    let match = true;
    
    // Revisar si el tipo coincide
    if (currentTypeFilter !== 'all' && !pokemon.types.includes(currentTypeFilter)) {
      match = false;
    }
    
    // Revisar si el nombre coincide
    if (name && !pokemon.name.toLowerCase().includes(name)) {
      match = false;
    }
    
    // Revisar si el id coincide
    if (id && pokemon.id.toString() !== id) {
      match = false;
    }
    
    // Si todo coincide, agregar a la lista filtrada
    if (match) {
      filtered.push(pokemon);
    }
  }
  
  // Mostrar los pokemones filtrados
  renderPokemons(filtered);
}

// Dibujar los pokemones en la página
function renderPokemons(pokemons) {
  let gallery = document.getElementById('pokemonGallery');
  
  // Si no hay pokemones, mostrar mensaje
  if (pokemons.length === 0) {
    gallery.innerHTML = '<p class="text-center text-muted col-12">No se encontraron pokemones.</p>';
    return;
  }
  
  let html = '';
  // Crear tarjeta para cada pokémon
  for (let pokemon of pokemons) {
    // Crear los badges de tipo
    let typesBadges = '';
    for (let type of pokemon.types) {
      typesBadges += `<span class="type-badge type-${type}">${type}</span>`;
    }
    
    // Agregar HTML de la tarjeta del pokémon
    html += `
      <div class="col-lg-2 col-md-3 col-sm-4 col-6">
        <div class="pokemon-card" onclick="showPokemonDetail(${pokemon.id})">
          <div class="pokemon-image-container">
            <img src="${pokemon.image}" alt="${pokemon.name}" class="pokemon-image">
          </div>
          <div class="pokemon-info">
            <h6 class="pokemon-name">#${pokemon.id} ${pokemon.name}</h6>
            <div class="pokemon-types">${typesBadges}</div>
          </div>
        </div>
      </div>
    `;
  }
  
  // Mostrar las tarjetas en la página
  gallery.innerHTML = html;
}

// Obtener detalles de un pokémon
async function showPokemonDetail(pokemonId) {
  let response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
  let data = await response.json();
  
  // Obtener nombre con primera letra mayúscula
  let name = data.name.charAt(0).toUpperCase() + data.name.slice(1);
  // Obtener imagen
  let image = data.sprites.other['official-artwork'].front_default || data.sprites.front_default;
  
  // Obtener tipos separados por coma
  let types = '';
  for (let t of data.types) {
    if (types) types += ', ';
    let typename = t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1);
    types += typename;
  }
  
  // Convertir altura y peso a números decimales
  let height = (data.height / 10).toFixed(1);
  let weight = (data.weight / 10).toFixed(1);
  
  // Mostrar el modal con los detalles
  showPokemonModal(name, image, types, height, weight);
}

// Mostrar el modal con información del pokémon
function showPokemonModal(name, image, types, height, weight) {
  let modal = document.getElementById('pokemonDetailModal');
  
  // Si el modal no existe, crearlo
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'pokemonDetailModal';
    modal.className = 'modal fade';
    modal.tabIndex = '-1';
    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Detalles del Pokémon</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-center">
            <img id="detailImage" src="" alt="Pokémon" style="max-width: 250px; margin-bottom: 1rem;">
            <h4 id="detailName"></h4>
            <p><strong>Tipos:</strong> <span id="detailTypes"></span></p>
            <p><strong>Altura:</strong> <span id="detailHeight"></span> m</p>
            <p><strong>Peso:</strong> <span id="detailWeight"></span> kg</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  
  // Llenar el modal con los datos del pokémon
  document.getElementById('detailImage').src = image;
  document.getElementById('detailName').textContent = name;
  document.getElementById('detailTypes').textContent = types;
  document.getElementById('detailHeight').textContent = height;
  document.getElementById('detailWeight').textContent = weight;
  
  // Mostrar el modal
  let bsModal = new bootstrap.Modal(modal);
  bsModal.show();
}

// Limpiar todos los filtros
function clearFilters() {
  // Vaciar los campos de búsqueda
  document.getElementById('searchName').value = '';
  document.getElementById('searchId').value = '';
  // Desactivar todos los botones de tipo
  let buttons = document.querySelectorAll('.filter-btn');
  for (let b of buttons) b.classList.remove('active');
  // Activar el botón "Todos"
  document.querySelector('.filter-btn[data-type="all"]').classList.add('active');
  // Resetear el filtro
  currentTypeFilter = 'all';
  // Aplicar los filtros
  applyFilters();
}

// Cuando carga la página, cargar los datos
document.addEventListener('DOMContentLoaded', function() {
  // Cargar los tipos de pokemones
  loadPokemonTypes();
  // Cargar todos los pokemones
  loadAllPokemons();
  
  // Agregar evento al campo de búsqueda por nombre
  document.getElementById('searchName').addEventListener('input', applyFilters);
  // Agregar evento al campo de búsqueda por id
  document.getElementById('searchId').addEventListener('input', applyFilters);
  // Agregar evento al botón de limpiar filtros
  document.getElementById('clearFilters').addEventListener('click', clearFilters);
});
