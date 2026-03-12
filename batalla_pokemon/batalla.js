// ================================================
//  batalla.js — Simulador de Batalla Pokémon
// ================================================

// Estado de los dos luchadores
let p1 = { nombre: '', img: '', hp: 100, turnosPasados: 0, defendiendo: false, defEspecial: false };
let p2 = { nombre: '', img: '', hp: 100, turnosPasados: 0, defendiendo: false, defEspecial: false };

let turnoActual     = 1;   // 1 → p1 ataca | 2 → p2 ataca
let movimientosTotales = 0;
const MAX_MOVIMIENTOS  = 10;

// Pokémon seleccionados en la grid: [{id, name}]
let seleccionados = [];

// ── Carga inicial ──────────────────────────────────────────────
window.onload = async function () {
    // Filtrado en tiempo real en la grid
    document.getElementById('buscador').addEventListener('input', function () {
        const query = this.value.toLowerCase().trim();
        document.querySelectorAll('.poke-card').forEach(card => {
            card.style.display = card.dataset.name.includes(query) ? '' : 'none';
        });
    });

    // Cargar los 151 Pokémon de Kanto desde la PokeAPI
    try {
        const res  = await fetch('https://pokeapi.co/api/v2/pokemon?limit=151');
        const data = await res.json();
        document.getElementById('loading-msg').style.display = 'none';
        renderizarGrid(data.results);
    } catch (err) {
        document.getElementById('loading-msg').innerText =
            '❌ Error al cargar. Comprueba tu conexión y recarga la página.';
        console.error(err);
    }
};

// ── Grid de selección ──────────────────────────────────────────
function renderizarGrid(lista) {
    const grid = document.getElementById('pokemon-grid');

    lista.forEach(poke => {
        // Extraemos el ID del URL devuelto por la API (ej. ".../pokemon/25/")
        const id     = poke.url.split('/').filter(Boolean).pop();
        const sprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

        const card = document.createElement('div');
        card.className    = 'poke-card';
        card.dataset.id   = id;
        card.dataset.name = poke.name;
        card.innerHTML = `
            <img src="${sprite}" alt="${poke.name}" loading="lazy">
            <p class="poke-name">${poke.name}</p>
        `;
        card.addEventListener('click', () => toggleSeleccion(card, id, poke.name));
        grid.appendChild(card);
    });
}

function toggleSeleccion(card, id, name) {
    const idx = seleccionados.findIndex(p => p.id === id);

    if (idx !== -1) {
        // Ya estaba seleccionado → deseleccionar
        seleccionados.splice(idx, 1);
    } else {
        if (seleccionados.length >= 2) return; // Slots llenos
        seleccionados.push({ id, name });
    }

    // Reasignar clases visuales a las cartas
    document.querySelectorAll('.poke-card').forEach(c =>
        c.classList.remove('selected-p1', 'selected-p2')
    );
    if (seleccionados[0]) {
        document.querySelector(`.poke-card[data-id="${seleccionados[0].id}"]`).classList.add('selected-p1');
    }
    if (seleccionados[1]) {
        document.querySelector(`.poke-card[data-id="${seleccionados[1].id}"]`).classList.add('selected-p2');
    }

    // Actualizar los slots de la barra superior
    document.getElementById('slot-p1-nombre').innerText =
        seleccionados[0]?.name ?? 'Sin elegir';
    document.getElementById('slot-p2-nombre').innerText =
        seleccionados[1]?.name ?? 'Sin elegir';
    document.getElementById('btn-pelear').disabled = seleccionados.length < 2;
}

// ── Inicio de la batalla ───────────────────────────────────────
async function iniciarBatalla() {
    if (seleccionados.length < 2) return;

    try {
        // Obtenemos los datos completos (artwork oficial) de ambos Pokémon en paralelo
        const [data1, data2] = await Promise.all([
            fetch(`https://pokeapi.co/api/v2/pokemon/${seleccionados[0].name}`).then(r => r.json()),
            fetch(`https://pokeapi.co/api/v2/pokemon/${seleccionados[1].name}`).then(r => r.json()),
        ]);

        configurarLuchador(p1, data1, 'p1');
        configurarLuchador(p2, data2, 'p2');

        // Resetear estado de batalla
        turnoActual        = 1;
        movimientosTotales = 0;
        document.getElementById('log-list').innerHTML = '';
        actualizarBarrasHP();

        document.getElementById('selection-screen').classList.remove('active');
        document.getElementById('battle-screen').classList.add('active');

        actualizarNarrador(`¡${p1.nombre} VS ${p2.nombre}! ¡Que empiece el combate!`);
        setTimeout(simularTurno, 1800);

    } catch (err) {
        console.error(err);
        alert('Error al obtener los datos. Inténtalo de nuevo.');
    }
}

function configurarLuchador(obj, data, prefix) {
    obj.nombre       = data.name.toUpperCase();
    obj.img          = data.sprites.other['official-artwork'].front_default || data.sprites.front_default;
    obj.hp           = 100;
    obj.turnosPasados = 0;
    obj.defendiendo  = false;
    obj.defEspecial  = false;

    document.getElementById(`${prefix}-name`).innerText = obj.nombre;
    document.getElementById(`${prefix}-img`).src        = obj.img;
}

// ── Lógica de turno ────────────────────────────────────────────
function simularTurno() {
    if (p1.hp <= 0 || p2.hp <= 0) return;

    movimientosTotales++;

    // Límite de movimientos alcanzado
    if (movimientosTotales > MAX_MOVIMIENTOS) {
        finalizarPorLimite();
        return;
    }

    const atacante = turnoActual === 1 ? p1 : p2;
    const defensor  = turnoActual === 1 ? p2 : p1;

    // Movimientos disponibles según turnos pasados del atacante
    // - Ataque especial: requiere >= 3 turnos propios jugados
    // - Defensa especial: requiere >= 2 turnos propios jugados
    const opciones = ['ataque', 'defensa'];
    if (atacante.turnosPasados >= 3) opciones.push('especial');
    if (atacante.turnosPasados >= 2) opciones.push('def-especial');

    const accion = opciones[Math.floor(Math.random() * opciones.length)];
    const falla  = Math.random() < 0.20; // 20 % de probabilidad de fallar

    if (falla) {
        actualizarNarrador(
            `[Turno ${movimientosTotales}] ${atacante.nombre} intentó "${accion}"... ¡pero FALLÓ!`
        );
    } else {
        procesarAccion(atacante, defensor, accion);
    }

    atacante.turnosPasados++;

    if (defensor.hp <= 0) {
        setTimeout(() => mostrarGanador(atacante), 1200);
    } else {
        turnoActual = turnoActual === 1 ? 2 : 1;
        setTimeout(simularTurno, 2200);
    }
}

function procesarAccion(atacante, defensor, tipo) {
    let danio = 0;
    // Al realizar acción, los estados de defensa del atacante se reinician
    atacante.defendiendo = false;
    atacante.defEspecial = false;

    let msg = `[Turno ${movimientosTotales}] ${atacante.nombre} `;

    if (tipo === 'ataque') {
        danio = Math.floor(Math.random() * 15) + 10; // 10 – 24 %
        msg  += 'usó Ataque Normal.';

    } else if (tipo === 'especial') {
        danio = Math.floor(Math.random() * 25) + 20; // 20 – 44 %
        msg  += 'usó ✨ ATAQUE ESPECIAL.';
        atacante.turnosPasados = -1; // Reset cooldown (se suma +1 al final del turno → queda en 0)

    } else if (tipo === 'defensa') {
        atacante.defendiendo = true;
        msg += 'activó 🛡️ Defensa.';

    } else if (tipo === 'def-especial') {
        atacante.defEspecial = true;
        msg += 'activó 🔰 Defensa Especial.';
        atacante.turnosPasados = -1;
    }

    // Resolver el daño contra las defensas del defensor
    if (danio > 0) {
        if (defensor.defEspecial) {
            // Defensa especial absorbe todo el daño
            msg  += ` ¡BLOQUEADO! La Defensa Especial de ${defensor.nombre} anuló el ataque.`;
            danio = 0;
        } else if (defensor.defendiendo) {
            // Defensa normal reduce el daño a la mitad
            danio = Math.floor(danio / 2);
            msg  += ` ¡Mitigado por el escudo de ${defensor.nombre}! Daño reducido a ${danio}%.`;
        } else {
            msg += ` Causó ${danio}% de daño.`;
        }
    }

    // Aplicar daño si queda alguno
    if (danio > 0) {
        defensor.hp = Math.max(0, defensor.hp - danio);
        msg += ` ${defensor.nombre} tiene ${defensor.hp}% de HP restante.`;

        // Animación de sacudida en quien recibe el daño
        const imgId = turnoActual === 1 ? 'p2-img' : 'p1-img';
        const img   = document.getElementById(imgId);
        img.classList.add('shake');
        setTimeout(() => img.classList.remove('shake'), 400);
    }

    actualizarNarrador(msg);
    actualizarBarrasHP();
}

// ── Fin por límite de movimientos ─────────────────────────────
function finalizarPorLimite() {
    if (p1.hp === p2.hp) {
        actualizarNarrador(
            '¡Se alcanzó el límite de movimientos! ¡EMPATE TÉCNICO! Ambos Pokémon lucharon con honor.'
        );
        setTimeout(() => location.reload(), 3500);
    } else {
        const ganador = p1.hp > p2.hp ? p1 : p2;
        actualizarNarrador(
            `¡Límite de movimientos alcanzado! Por mayor HP restante, ¡${ganador.nombre} gana la batalla!`
        );
        setTimeout(() => mostrarGanador(ganador), 1500);
    }
}

// ── Funciones de UI ────────────────────────────────────────────
function actualizarNarrador(mensaje) {
    document.getElementById('narrator-text').innerText = mensaje;

    // Añadir al historial (el más reciente primero)
    const li     = document.createElement('li');
    li.innerText = mensaje;
    document.getElementById('log-list').prepend(li);
}

function actualizarBarrasHP() {
    actualizarBarra('p1-hp-bar', 'p1-hp-text', p1.hp);
    actualizarBarra('p2-hp-bar', 'p2-hp-text', p2.hp);
}

function actualizarBarra(barId, textId, hp) {
    const bar = document.getElementById(barId);
    document.getElementById(textId).innerText = hp;
    bar.style.width = hp + '%';

    // Color dinámico: verde → naranja → rojo según el HP restante
    if (hp > 50)      bar.style.backgroundColor = '#2ecc71';
    else if (hp > 25) bar.style.backgroundColor = '#f39c12';
    else              bar.style.backgroundColor = '#e74c3c';
}

function mostrarGanador(ganador) {
    document.getElementById('battle-screen').classList.remove('active');
    document.getElementById('winner-screen').classList.add('active');
    document.getElementById('winner-name').innerText = ganador.nombre;
    document.getElementById('winner-img').src        = ganador.img;
}
