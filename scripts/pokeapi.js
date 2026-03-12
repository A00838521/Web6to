// Obtener un pokémon al azar de la PokeAPI
async function getRandomPokemon() {
  try {
    // Generar un número aleatorio entre 1 y 1025 (cantidad de pokémon disponibles)
    const randomId = Math.floor(Math.random() * 1025) + 1;
    
    // Hacer fetch a la API
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
    const data = await response.json();
    
    // Extraer datos del pokémon
    const pokemonName = data.name.charAt(0).toUpperCase() + data.name.slice(1);
    const pokemonImage = data.sprites.other['official-artwork'].front_default || data.sprites.front_default;
    
    // Mostrar en modal
    showPokemonModal(pokemonName, pokemonImage);
  } catch (error) {
    console.error('Error al obtener el pokémon:', error);
    alert('Error al obtener pokémon. Intenta nuevamente.');
  }
}

// Mostrar el pokémon en un modal
function showPokemonModal(name, image) {
  // Crear o actualizar el modal
  let modal = document.getElementById('pokemonModal');
  
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'pokemonModal';
    modal.className = 'modal fade';
    modal.tabIndex = '-1';
    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Pokémon del Día</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body text-center">
            <img id="pokemonImage" src="" alt="Pokémon" style="max-width: 200px; margin-bottom: 1rem;">
            <h4 id="pokemonName"></h4>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  
  // Actualizar contenido
  document.getElementById('pokemonImage').src = image;
  document.getElementById('pokemonName').textContent = name;
  
  // Mostrar modal
  const bsModal = new bootstrap.Modal(modal);
  bsModal.show();
}
