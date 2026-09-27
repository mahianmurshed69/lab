// State Management
let currentPokemonData = null;
let isShiny = false;

// DOM Element References
const searchForm = document.getElementById('search-form');
const pokemonInput = document.getElementById('pokemon-input');
const statusMessage = document.getElementById('status-message');
const cardContainer = document.getElementById('card-container');

const pokeCard = document.getElementById('pokemon-card');
const pokeName = document.getElementById('poke-name');
const pokeId = document.getElementById('poke-id');
const pokeImage = document.getElementById('poke-image');
const pokeTypes = document.getElementById('poke-types');
const pokeHeight = document.getElementById('poke-height');
const pokeWeight = document.getElementById('poke-weight');
const pokeAbilities = document.getElementById('poke-abilities');
const pokeStats = document.getElementById('poke-stats');

const shinyToggleBtn = document.getElementById('shiny-toggle-btn');
const quickButtons = document.querySelectorAll('.btn-quick[data-name]');
const randomButton = document.getElementById('btn-random');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  // Load default Pokémon on initial visit
  fetchPokemon('pikachu');
});

// Event Listeners
searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const query = pokemonInput.value.trim().toLowerCase();
  if (query) {
    fetchPokemon(query);
  }
});

quickButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const name = btn.getAttribute('data-name');
    pokemonInput.value = name;
    fetchPokemon(name);
  });
});

randomButton.addEventListener('click', () => {
  // Total count of Pokémon currently available in National Pokédex
  const randomId = Math.floor(Math.random() * 1025) + 1;
  pokemonInput.value = randomId;
  fetchPokemon(randomId);
});

shinyToggleBtn.addEventListener('click', () => {
  if (!currentPokemonData) return;
  isShiny = !isShiny;
  shinyToggleBtn.classList.toggle('active', isShiny);
  updatePokemonImage();
});

// Main Fetch & Controller Logic
async function fetchPokemon(query) {
  showLoading();

  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${query}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Pokémon "${query}" not found. Please check spelling or ID.`);
      } else {
        throw new Error('Network error occurred. Please try again later.');
      }
    }

    const data = await response.json();
    currentPokemonData = data;
    isShiny = false; // Reset shiny state on new search
    shinyToggleBtn.classList.remove('active');

    renderPokemonCard(data);
    showCard();
  } catch (error) {
    showError(error.message);
  }
}

// UI State Renderers
function showLoading() {
  statusMessage.textContent = 'Fetching Pokémon data...';
  statusMessage.className = 'status-message loading';
  cardContainer.classList.add('hidden');
}

function showError(message) {
  statusMessage.textContent = message;
  statusMessage.className = 'status-message error';
  cardContainer.classList.add('hidden');
}

function showCard() {
  statusMessage.className = 'status-message hidden';
  cardContainer.classList.remove('hidden');
}

// Data Extraction & DOM Manipulation
function renderPokemonCard(data) {
  // Name and Formatted ID (#001, #025)
  pokeName.textContent = data.name;
  pokeId.textContent = `#${String(data.id).padStart(3, '0')}`;

  // Physical stats (Height: decimetres to meters, Weight: hectograms to kg)
  pokeHeight.textContent = `${(data.height / 10).toFixed(1)} m`;
  pokeWeight.textContent = `${(data.weight / 10).toFixed(1)} kg`;

  // Image artwork
  updatePokemonImage();

  // Types
  pokeTypes.innerHTML = '';
  const primaryType = data.types[0].type.name;

  data.types.forEach((typeInfo) => {
    const badge = document.createElement('span');
    badge.className = `type-badge type-${typeInfo.type.name}`;
    badge.textContent = typeInfo.type.name;
    pokeTypes.appendChild(badge);
  });

  // Apply card border style corresponding to the primary type
  pokeCard.className = `pokemon-card type-border-${primaryType}`;
  
  // Dynamic border color styling fallback
  const primaryTypeBadge = document.querySelector(`.type-${primaryType}`);
  if (primaryTypeBadge) {
    const computedColor = getComputedStyle(primaryTypeBadge).backgroundColor;
    pokeCard.style.borderColor = computedColor;
    pokeCard.style.boxShadow = `0 10px 25px ${computedColor}33`;
  }

  // Abilities (Extracting up to 3)
  pokeAbilities.innerHTML = '';
  data.abilities.slice(0, 3).forEach((abilityObj) => {
    const li = document.createElement('li');
    li.textContent = abilityObj.ability.name.replace('-', ' ');
    if (abilityObj.is_hidden) {
      li.textContent += ' (Hidden)';
    }
    pokeAbilities.appendChild(li);
  });

  // Base Stats
  pokeStats.innerHTML = '';
  const statNames = {
    hp: 'HP',
    attack: 'ATK',
    defense: 'DEF',
    'special-attack': 'SpA',
    'special-defense': 'SpD',
    speed: 'SPD'
  };

  data.stats.forEach((stat) => {
    const statRow = document.createElement('div');
    statRow.className = 'stat-row';

    const shortName = statNames[stat.stat.name] || stat.stat.name;
    const statValue = stat.base_stat;
    // Calculate percentage based on max possible base stat (~255)
    const percentage = Math.min(100, Math.round((statValue / 200) * 100));

    statRow.innerHTML = `
      <span class="stat-name">${shortName}</span>
      <span class="stat-num">${statValue}</span>
      <div class="stat-bar-bg">
        <div class="stat-bar-fill" style="width: ${percentage}%"></div>
      </div>
    `;

    pokeStats.appendChild(statRow);
  });
}

// Artwork Handler with Fallback Chain
function updatePokemonImage() {
  if (!currentPokemonData) return;

  const sprites = currentPokemonData.sprites;
  
  // Prefer official high-res artwork, fallback to default sprites
  if (isShiny) {
    pokeImage.src =
      sprites.other?.['official-artwork']?.front_shiny ||
      sprites.front_shiny ||
      sprites.front_default;
  } else {
    pokeImage.src =
      sprites.other?.['official-artwork']?.front_default ||
      sprites.front_default;
  }

  pokeImage.alt = `${currentPokemonData.name} ${isShiny ? 'shiny' : ''} artwork`;
}