let allPokemons = [];
let pokemonTypes = [];
let currentTypeFilter = 'all';

async function loadPokemonTypes() {
  let response = await fetch('https://pokeapi.co/api/v2/type');
  let data = await response.json();
  
  pokemonTypes = data.results.filter(t => t.name !== 'unknown' && t.name !== 'shadow');
  
  renderTypeFilter();
}

function renderTypeFilter() {
  let container = document.getElementById('typeFilter');
  let html = '<button class="btn btn-outline-primary me-2 mb-2 filter-btn active" data-type="all">Todos</button>';
  
  for (let type of pokemonTypes) {
    let name = type.name.charAt(0).toUpperCase() + type.name.slice(1);
    html += `<button class="btn btn-outline-primary me-2 mb-2 filter-btn" data-type="${type.name}">${name}</button>`;
  }
  
  container.innerHTML = html;
  
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

async function loadAllPokemons() {
  let response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1025&offset=0');
  let data = await response.json();
  
  for (let poke of data.results) {
    let res = await fetch(poke.url);
    let pokemon = await res.json();
    
    let types = [];
    for (let t of pokemon.types) {
      types.push(t.type.name);
    }
    
    allPokemons.push({
      id: pokemon.id,
      name: pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1),
      image: pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default,
      types: types
    });
  }
  
  applyFilters();
}

function applyFilters() {
  let name = document.getElementById('searchName').value.toLowerCase();
  let id = document.getElementById('searchId').value;
  let filtered = [];
  
  for (let pokemon of allPokemons) {
    let match = true;
    
    if (currentTypeFilter !== 'all' && !pokemon.types.includes(currentTypeFilter)) {
      match = false;
    }
    
    if (name && !pokemon.name.toLowerCase().includes(name)) {
      match = false;
    }
    
    if (id && pokemon.id.toString() !== id) {
      match = false;
    }
    
    if (match) {
      filtered.push(pokemon);
    }
  }
  
  renderPokemons(filtered);
}

function renderPokemons(pokemons) {
  let gallery = document.getElementById('pokemonGallery');
  
  if (pokemons.length === 0) {
    gallery.innerHTML = '<p class="text-center text-muted col-12">No se encontraron pokemones.</p>';
    return;
  }
  
  let html = '';
  for (let pokemon of pokemons) {
    let typesBadges = '';
    for (let type of pokemon.types) {
      typesBadges += `<span class="type-badge type-${type}">${type}</span>`;
    }
    
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
  
  gallery.innerHTML = html;
}

async function showPokemonDetail(pokemonId) {
  let response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
  let data = await response.json();
  
  let name = data.name.charAt(0).toUpperCase() + data.name.slice(1);
  let image = data.sprites.other['official-artwork'].front_default || data.sprites.front_default;
  
  let types = '';
  for (let t of data.types) {
    if (types) types += ', ';
    let typename = t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1);
    types += typename;
  }
  
  let height = (data.height / 10).toFixed(1);
  let weight = (data.weight / 10).toFixed(1);
  
  showPokemonModal(name, image, types, height, weight);
}

function showPokemonModal(name, image, types, height, weight) {
  let modal = document.getElementById('pokemonDetailModal');
  
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
  
  document.getElementById('detailImage').src = image;
  document.getElementById('detailName').textContent = name;
  document.getElementById('detailTypes').textContent = types;
  document.getElementById('detailHeight').textContent = height;
  document.getElementById('detailWeight').textContent = weight;
  
  let bsModal = new bootstrap.Modal(modal);
  bsModal.show();
}

function clearFilters() {
  document.getElementById('searchName').value = '';
  document.getElementById('searchId').value = '';
  let buttons = document.querySelectorAll('.filter-btn');
  for (let b of buttons) b.classList.remove('active');
  document.querySelector('.filter-btn[data-type="all"]').classList.add('active');
  currentTypeFilter = 'all';
  applyFilters();
}

document.addEventListener('DOMContentLoaded', function() {
  loadPokemonTypes();
  loadAllPokemons();
  
  document.getElementById('searchName').addEventListener('input', applyFilters);
  document.getElementById('searchId').addEventListener('input', applyFilters);
  document.getElementById('clearFilters').addEventListener('click', clearFilters);
});
