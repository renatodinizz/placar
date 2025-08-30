// Estado global da aplicação, contendo todas as variáveis necessárias para o funcionamento do jogo.
const gameState = {
    currentPage: 'welcome', // Página atual exibida ao usuário
    players: [], // Array de objetos de jogadores (nome, pontuação, etc.)
    numPlayers: 2, // Número de jogadores selecionados (2, 3 ou 4)
    timeLimit: 60, // Limite de tempo para cada turno em segundos (padrão: 60s)
    currentPlayer: 0, // Índice do jogador atual (quem está jogando o turno)
    firstPlayer: 0, // Índice do jogador que iniciou a rodada
    rounds: [], // Array de arrays, onde cada sub-array representa os pontos de cada jogador em uma rodada
    scores: [], // Array de pontuações totais acumuladas para cada jogador
    timer: null, // Variável para armazenar o ID do setInterval do timer
    timeRemaining: 0, // Tempo restante no timer do turno atual
    currentScoringPlayer: 0, // Índice do jogador que está inserindo a pontuação na fase de scoring
    roundScores: [], // Array temporário para armazenar os pontos de cada jogador na rodada atual
    modalCallback: null // Função de callback a ser executada quando o modal de confirmação é aceito
};

// Configurações de tempo disponíveis para seleção no jogo.
const timeOptions = [
    { label: '30 segundos', value: 30 },
    { label: '45 segundos', value: 45 },
    { label: '1 minuto', value: 60 },
    { label: '1 minuto e meio', value: 90 },
    { label: '2 minutos', value: 120 }
];

let currentTimeIndex = 2; // Índice inicial para '1 minuto' na array timeOptions.

// Cores predefinidas para os ícones dos jogadores, para diferenciação visual.
const playerColors = ['color-1', 'color-2', 'color-3', 'color-4'];

// ====================================================================
// INICIALIZAÇÃO E EVENT LISTENERS
// ====================================================================

/**
 * Executa quando o DOM (Document Object Model) é completamente carregado.
 * Configura os event listeners e inicializa o display de jogadores na página de configuração.
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    updatePlayersDisplay(); // Garante que os ícones e inputs iniciais estejam visíveis
});

/**
 * Configura todos os event listeners para os botões e elementos interativos da aplicação.
 */
function initializeEventListeners() {
    // Página Welcome
    document.getElementById('new-game-btn').addEventListener('click', () => showPage('config'));
    
    // Página Configuração
    document.getElementById('back-btn-config').addEventListener('click', () => showPage('welcome'));
    document.getElementById('players-toggle').addEventListener('click', togglePlayers);
    document.getElementById('time-toggle').addEventListener('click', toggleTime);
    document.getElementById('continue-btn').addEventListener('click', validateAndContinue);
    
    // Página Seleção do Primeiro Jogador
    document.getElementById('back-btn-first').addEventListener('click', () => showPage('config'));
    document.getElementById('start-game-btn').addEventListener('click', startGame);
    
    // Página Jogo Principal
    document.getElementById('back-btn-game').addEventListener('click', () => showPage('first-player'));
    document.getElementById('end-turn-btn').addEventListener('click', endTurn);
    // Adiciona modal de confirmação para finalizar rodada
    document.getElementById('end-round-btn').addEventListener('click', () => showConfirmationModal('Tem certeza que deseja finalizar a rodada?', endRound));
    document.getElementById('start-timer-btn').addEventListener('click', startTimer);
    
    // Página Pontuação Individual
    document.getElementById('back-btn-scoring').addEventListener('click', () => showPage('game'));
    document.getElementById('points-input').addEventListener('input', function() {
        // Garante que apenas números sejam inseridos e que o valor seja positivo
        this.value = this.value.replace(/[^0-9]/g, '');
        if (parseInt(this.value) < 0) this.value = '0';
    });
    document.getElementById('confirm-points-btn').addEventListener('click', confirmPoints);
    // Este botão só será visível após o último jogador pontuar, para avançar para o scoreboard
    document.getElementById('next-scoring-btn').addEventListener('click', () => showPage('scoreboard'));
    
    // Página Tabela de Pontuação
    document.getElementById('back-btn-scoreboard').addEventListener('click', () => showPage('game'));
    document.getElementById('next-round-btn').addEventListener('click', nextRound);
    // Adiciona modal de confirmação para finalizar jogo
    document.getElementById('finish-game-btn').addEventListener('click', () => showConfirmationModal('Tem certeza que deseja finalizar o jogo?', finishGame));
    
    // Página Resultado Final
    document.getElementById('same-players-btn').addEventListener('click', restartWithSamePlayers);
    document.getElementById('new-players-btn').addEventListener('click', restartWithNewPlayers);
    
    // Modal de Confirmação
    document.getElementById('modal-yes').addEventListener('click', handleModalYes);
    document.getElementById('modal-no').addEventListener('click', hideModal);
    document.getElementById('modal-overlay').addEventListener('click', hideModal);
}

// ====================================================================
// NAVEGAÇÃO ENTRE PÁGINAS
// ====================================================================

/**
 * Exibe a página especificada e esconde todas as outras.
 * @param {string} pageId - O ID da página a ser exibida (ex: 'welcome', 'config', 'game').
 */
function showPage(pageId) {
    // Esconde todas as páginas removendo a classe 'active'
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Mostra a página específica adicionando a classe 'active'
    document.getElementById(pageId + '-page').classList.add('active');
    gameState.currentPage = pageId;
    
    // Executa ações específicas da página ao ser exibida
    switch(pageId) {
        case 'config':
            // Ao voltar para a configuração, apenas atualiza o display dos jogadores
            updatePlayersDisplay();
            break;
        case 'first-player':
            displayPlayersForSelection();
            break;
        case 'game':
            displayGamePlayers();
            resetTimer();
            break;
        case 'scoring':
            // Reseta o índice do jogador de pontuação e exibe o primeiro para inserção de pontos
            gameState.currentScoringPlayer = 0;
            displayCurrentScoringPlayer();
            // Esconde o botão 'PRÓXIMO' e mostra 'CONFIRMAR' inicialmente
            document.getElementById('confirm-points-btn').classList.remove('hidden');
            document.getElementById('next-scoring-btn').classList.add('hidden');
            break;
        case 'scoreboard':
            displayScoreboard();
            break;
        case 'result':
            displayFinalResults();
            break;
    }
}

// ====================================================================
// PÁGINA DE CONFIGURAÇÃO (PAGE 2)
// ====================================================================

/**
 * Alterna o número de jogadores entre 2, 3 e 4.
 * Atualiza o texto do botão e o display de ícones/inputs dos jogadores.
 */
function togglePlayers() {
    gameState.numPlayers = gameState.numPlayers >= 4 ? 2 : gameState.numPlayers + 1;
    document.getElementById('players-toggle').textContent = gameState.numPlayers;
    updatePlayersDisplay();
}

/**
 * Alterna o tempo limite por turno entre as opções predefinidas em `timeOptions`.
 * Atualiza o texto do botão de tempo e o `timeLimit` no `gameState`.
 */
function toggleTime() {
    currentTimeIndex = (currentTimeIndex + 1) % timeOptions.length;
    const timeOption = timeOptions[currentTimeIndex];
    gameState.timeLimit = timeOption.value;
    document.getElementById('time-toggle').textContent = timeOption.label;
}

/**
 * Atualiza os ícones e inputs de nome dos jogadores na página de configuração.
 * Garante que o layout não se desloque ao adicionar/remover inputs.
 */
function updatePlayersDisplay() {
    const iconsContainer = document.getElementById('players-icons');
    const inputsContainer = document.getElementById('players-inputs');
    
    // Limpa os containers existentes para recriar os elementos
    iconsContainer.innerHTML = '';
    inputsContainer.innerHTML = '';
    
    // Cria ícones e inputs para cada jogador com base em gameState.numPlayers
    for (let i = 0; i < gameState.numPlayers; i++) {
        // Ícone do jogador
        const icon = document.createElement('div');
        icon.className = `player-icon ${playerColors[i]}`;
        icon.textContent = '👤'; // Símbolo de usuário
        iconsContainer.appendChild(icon);
        
        // Input para o nome do jogador
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'player-input';
        input.placeholder = `Jogador ${i + 1}`;
        input.id = `player-${i}`;
        // Mantém o nome do jogador se já foi digitado antes (útil ao voltar para a página de config)
        input.value = gameState.players[i] || '';
        inputsContainer.appendChild(input);
    }
}

/**
 * Valida os nomes dos jogadores inseridos.
 * Se todos os nomes forem válidos, armazena-os no `gameState` e avança para a página de seleção do primeiro jogador.
 */
function validateAndContinue() {
    const players = [];
    let allValid = true;
    
    for (let i = 0; i < gameState.numPlayers; i++) {
        const input = document.getElementById(`player-${i}`);
        const name = input.value.trim();
        
        if (name === '') {
            // Destaca inputs vazios com borda vermelha
            input.style.borderColor = '#f44336';
            allValid = false;
        } else {
            input.style.borderColor = '#ddd'; // Volta a borda ao normal
            players.push(name);
        }
    }
    
    if (allValid) {
        gameState.players = players;
        showPage('first-player');
    }
}

// ====================================================================
// PÁGINA DE SELEÇÃO DO PRIMEIRO JOGADOR (PAGE 3)
// ====================================================================

/**
 * Exibe os jogadores para que o usuário selecione quem começará o jogo.
 * Destaca o jogador selecionado.
 */
function displayPlayersForSelection() {
    const container = document.getElementById('players-selection');
    container.innerHTML = ''; // Limpa seleções anteriores
    
    gameState.players.forEach((player, index) => {
        const selector = document.createElement('div');
        selector.className = 'player-selector';
        selector.onclick = () => selectFirstPlayer(index);
        
        const icon = document.createElement('div');
        icon.className = `player-icon ${playerColors[index]}`;
        icon.textContent = '👤';
        
        const name = document.createElement('div');
        name.className = 'player-name';
        name.textContent = player;
        
        selector.appendChild(icon);
        selector.appendChild(name);
        container.appendChild(selector);
    });
    // Seleciona o primeiro jogador por padrão se nenhum foi selecionado antes
    if (gameState.firstPlayer === undefined || gameState.firstPlayer === null) {
        selectFirstPlayer(0);
    } else {
        // Mantém a seleção anterior se houver
        document.querySelectorAll('.player-selector')[gameState.firstPlayer].classList.add('selected');
    }
}

/**
 * Marca o jogador selecionado como o primeiro a jogar na rodada.
 * @param {number} index - O índice do jogador selecionado.
 */
function selectFirstPlayer(index) {
    // Remove a classe 'selected' de todos os seletores para desmarcar
    document.querySelectorAll('.player-selector').forEach(selector => {
        selector.classList.remove('selected');
    });
    
    // Adiciona a classe 'selected' ao jogador clicado para destacá-lo
    document.querySelectorAll('.player-selector')[index].classList.add('selected');
    gameState.firstPlayer = index;
    gameState.currentPlayer = index;
}

/**
 * Inicia o jogo, inicializando as pontuações (se for o primeiro jogo) e exibindo a página do jogo principal.
 */
function startGame() {
    if (gameState.firstPlayer !== undefined && gameState.firstPlayer !== null) {
        // Inicializa as pontuações apenas se for um novo jogo ou recomeço (sem rodadas anteriores)
        if (gameState.rounds.length === 0) {
            initializeScores();
        }
        showPage('game');
    } else {
        alert('Por favor, selecione o jogador que irá começar.');
    }
}

/**
 * Inicializa as pontuações de todos os jogadores para 0 e limpa o histórico de rodadas.
 * Chamado apenas no início de um novo jogo ou ao reiniciar com novos jogadores.
 */
function initializeScores() {
    gameState.scores = gameState.players.map(() => 0);
    gameState.rounds = [];
}

// ====================================================================
// PÁGINA DO JOGO PRINCIPAL (PAGE 4)
// ====================================================================

/**
 * Exibe os jogadores na página do jogo, destacando o jogador atual.
 * Garante que os jogadores apareçam um ao lado do outro no mobile.
 */
function displayGamePlayers() {
    const container = document.getElementById('players-display');
    container.innerHTML = ''; // Limpa o display anterior
    
    gameState.players.forEach((player, index) => {
        const display = document.createElement('div');
        // Adiciona a classe 'current' se for o jogador da vez para destacá-lo
        display.className = `player-display ${index === gameState.currentPlayer ? 'current' : ''}`;
        
        const icon = document.createElement('div');
        icon.className = `player-icon ${playerColors[index]}`;
        icon.textContent = '👤';
        
        const name = document.createElement('div');
        name.className = 'player-name';
        name.textContent = player;
        
        display.appendChild(icon);
        display.appendChild(name);
        container.appendChild(display);
    });
}

/**
 * Passa o turno para o próximo jogador e reseta o timer.
 */
function endTurn() {
    // Para o timer atual, se estiver rodando
    if (gameState.timer) {
        clearInterval(gameState.timer);
    }
    gameState.currentPlayer = (gameState.currentPlayer + 1) % gameState.numPlayers;
    displayGamePlayers(); // Atualiza o destaque do jogador atual
    resetTimer(); // Reseta o display do timer para o botão 'COMEÇAR'
}

/**
 * Inicia o timer regressivo para o turno atual.
 * Controla os alertas sonoros e visuais (warning/danger).
 */
function startTimer() {
    const startBtn = document.getElementById('start-timer-btn');
    const timerDisplay = document.getElementById('timer-display');
    
    // Esconde o botão 'COMEÇAR' e mostra o display do timer
    startBtn.classList.add('hidden');
    timerDisplay.classList.remove('hidden');
    
    gameState.timeRemaining = gameState.timeLimit;
    updateTimerDisplay();
    
    // Limpa qualquer timer anterior para evitar múltiplos timers rodando simultaneamente
    if (gameState.timer) {
        clearInterval(gameState.timer);
    }

    gameState.timer = setInterval(() => {
        gameState.timeRemaining--;
        updateTimerDisplay();
        
        // Alerta aos 10 segundos (som mais agudo)
        if (gameState.timeRemaining === 10) {
            playBeep(1500); // Frequência mais alta para som mais agudo
            timerDisplay.classList.add('warning');
        }
        
        // Alerta aos 5 segundos (muda para vermelho)
        if (gameState.timeRemaining <= 5 && gameState.timeRemaining > 0) {
            timerDisplay.classList.add('danger');
        }
        
        // Tempo esgotado
        if (gameState.timeRemaining <= 0) {
            clearInterval(gameState.timer);
            playBuzzer(400); // Frequência mais alta para som mais agudo
            timerDisplay.classList.add('danger');
            // Pequeno atraso para o som terminar antes de mudar de turno
            setTimeout(() => {
                endTurn();
            }, 1000);
        }
    }, 1000); // Atualiza a cada 1 segundo (1000ms)
}

/**
 * Atualiza o texto do display do timer no formato MM:SS.
 */
function updateTimerDisplay() {
    const minutes = Math.floor(gameState.timeRemaining / 60);
    const seconds = gameState.timeRemaining % 60;
    const timerText = document.getElementById('timer-text');
    timerText.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Reseta o timer para o estado inicial (botão 'COMEÇAR' visível).
 * Limpa o intervalo do timer e remove as classes de alerta visual.
 */
function resetTimer() {
    if (gameState.timer) {
        clearInterval(gameState.timer);
    }
    
    const startBtn = document.getElementById('start-timer-btn');
    const timerDisplay = document.getElementById('timer-display');
    
    startBtn.classList.remove('hidden'); // Mostra o botão 'COMEÇAR'
    timerDisplay.classList.add('hidden'); // Esconde o display do timer
    timerDisplay.classList.remove('warning', 'danger'); // Remove classes de alerta
    
    gameState.timeRemaining = gameState.timeLimit; // Reseta o tempo restante para o limite inicial
}

// ====================================================================
// FUNÇÕES DE ÁUDIO
// ====================================================================

/**
 * Toca um som de bipe usando a Web Audio API.
 * @param {number} frequency - A frequência do som em Hz (padrão: 800Hz).
 */
function playBeep(frequency = 1500) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency; // Define a frequência do bipe
    oscillator.type = 'square'; // Define o tipo de onda como senoidal
    
    gainNode.gain.setValueAtTime(1, audioContext.currentTime); // Volume inicial
    gainNode.gain.exponentialRampToValueAtTime(0.8, audioContext.currentTime + 1); // Fade out rápido
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
}

/**
 * Toca um som de buzina usando a Web Audio API.
 * @param {number} frequency - A frequência do som em Hz (padrão: 200Hz).
 */
function playBuzzer(frequency = 1500) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency; // Define a frequência da buzina
    oscillator.type = 'square'; // Define o tipo de onda como dente de serra
    
    gainNode.gain.setValueAtTime(1, audioContext.currentTime); // Volume inicial
    gainNode.gain.exponentialRampToValueAtTime(0.8, audioContext.currentTime + 2); // Fade out
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1);
}

// ====================================================================
// PÁGINA DE PONTUAÇÃO INDIVIDUAL (PAGE 5)
// ====================================================================

/**
 * Finaliza a rodada atual e avança para a página de inserção de pontuação.
 * Reseta o estado para a inserção de pontos do primeiro jogador da rodada.
 */
function endRound() {
    hideModal(); // Esconde o modal de confirmação
    gameState.currentScoringPlayer = 0; // Reseta o índice do jogador para pontuação
    gameState.roundScores = []; // Limpa as pontuações da rodada atual
    showPage('scoring'); // Exibe a página de pontuação
}

/**
 * Exibe o jogador atual para inserção de pontos na página de scoring.
 * Atualiza o ícone e nome do jogador e limpa o campo de input.
 */
function displayCurrentScoringPlayer() {
    const container = document.getElementById('current-player-display');
    const playerIndex = gameState.currentScoringPlayer;
    
    container.innerHTML = ''; // Limpa o display anterior
    
    // Cria e adiciona o ícone do jogador
    const icon = document.createElement('div');
    icon.className = `player-icon ${playerColors[playerIndex]}`;
    icon.textContent = '👤';
    
    // Cria e adiciona o nome do jogador
    const name = document.createElement('div');
    name.className = 'player-name';
    name.textContent = gameState.players[playerIndex];
    
    container.appendChild(icon);
    container.appendChild(name);
    
    // Limpa o input de pontos para o próximo jogador
    document.getElementById('points-input').value = '';
}

/**
 * Confirma os pontos inseridos para o jogador atual.
 * Armazena a pontuação e avança para o próximo jogador ou para o scoreboard se todos pontuaram.
 */
function confirmPoints() {
    const input = document.getElementById('points-input');
    const points = parseInt(input.value) || 0; // Converte para número, 0 se vazio ou inválido
    
    if (points < 0) {
        input.style.borderColor = '#f44336'; // Destaca erro se o valor for negativo
        return;
    }
    
    input.style.borderColor = '#ddd'; // Volta a borda ao normal
    gameState.roundScores[gameState.currentScoringPlayer] = points; // Armazena a pontuação da rodada
    gameState.currentScoringPlayer++; // Avança para o próximo jogador na sequência de pontuação
    
    // Se ainda há jogadores para pontuar, exibe o próximo
    if (gameState.currentScoringPlayer < gameState.numPlayers) {
        displayCurrentScoringPlayer();
    } else {
        // Se todos os jogadores pontuaram, calcula os resultados da rodada e avança automaticamente para o scoreboard
        calculateRoundResults();
        showPage('scoreboard'); // Avança para a página do scoreboard
    }
}

/**
 * Calcula os resultados da rodada com base nos pontos na mão de cada jogador.
 * Atualiza as pontuações totais e adiciona a rodada ao histórico.
 */
function calculateRoundResults() {
    const roundResult = [];
    // Soma total dos pontos negativos (peças na mão) de todos os jogadores
    const totalNegativePoints = gameState.roundScores.reduce((sum, points) => sum + points, 0);
    
    gameState.roundScores.forEach((points, index) => {
        if (points === 0) {
            // Jogador que zerou ganha a soma dos pontos dos outros jogadores
            const positivePoints = totalNegativePoints; 
            roundResult[index] = positivePoints;
            gameState.scores[index] += positivePoints;
        } else {
            // Jogador com pontos na mão perde esses pontos
            roundResult[index] = -points;
            gameState.scores[index] -= points;
        }
    });
    
    gameState.rounds.push(roundResult); // Adiciona os resultados da rodada ao histórico de rodadas
}

// ====================================================================
// PÁGINA DA TABELA DE PONTUAÇÃO (PAGE 6)
// ====================================================================

/**
 * Exibe a tabela de pontuação e os totais dos jogadores.
 * Chamado sempre que a página do scoreboard é exibida.
 */
function displayScoreboard() {
    displayPlayersTotals(); // Atualiza os totais de cada jogador
    displayScoreboardTable(); // Atualiza a tabela de rodadas
}

/**
 * Exibe os totais de pontos de cada jogador na parte superior do scoreboard.
 * Inclui ícone, nome e pontuação total acumulada.
 */
function displayPlayersTotals() {
    const container = document.getElementById('players-totals');
    container.innerHTML = ''; // Limpa o display anterior
    
    gameState.players.forEach((player, index) => {
        const playerTotal = document.createElement('div');
        playerTotal.className = 'player-total';
        
        const icon = document.createElement('div');
        icon.className = `player-icon ${playerColors[index]}`;
        icon.textContent = '👤';
        
        const name = document.createElement('div');
        name.className = 'player-name';
        name.textContent = player;
        
        const score = document.createElement('div');
        score.className = 'total-score';
        score.textContent = gameState.scores[index]; // Pontuação total acumulada
        
        playerTotal.appendChild(icon);
        playerTotal.appendChild(name);
        playerTotal.appendChild(score);
        container.appendChild(playerTotal);
    });
}

/**
 * Exibe a tabela detalhada com as pontuações de cada rodada.
 * Mostra todas as rodadas anteriores e a pontuação de cada jogador em cada uma.
 * Destaca pontuações positivas (verde) e negativas (vermelho).
 */
function displayScoreboardTable() {
    const container = document.getElementById('scoreboard-table');
    
    let tableHTML = '<table><thead><tr><th>Rodada</th>';
    // Adiciona os nomes dos jogadores como cabeçalhos da tabela
    gameState.players.forEach(player => {
        tableHTML += `<th>${player}</th>`;
    });
    tableHTML += '</tr></thead><tbody>';
    
    // Preenche a tabela com os resultados de cada rodada
    gameState.rounds.forEach((round, roundIndex) => {
        tableHTML += `<tr><td>${roundIndex + 1}</td>`; // Número da rodada
        round.forEach(score => {
            // Adiciona a classe CSS para cor (verde para positivo, vermelho para negativo)
            const scoreClass = score >= 0 ? 'score-positive' : 'score-negative';
            tableHTML += `<td class="${scoreClass}">${score}</td>`;
        });
        tableHTML += '</tr>';
    });
    
    tableHTML += '</tbody></table>';
    container.innerHTML = tableHTML;
}

/**
 * Inicia uma nova rodada.
 * Mantém as pontuações e histórico, apenas volta para a seleção do primeiro jogador.
 */
function nextRound() {
    showPage('first-player');
}

/**
 * Finaliza o jogo e exibe os resultados finais na página de resultados.
 */
function finishGame() {
    hideModal(); // Esconde o modal de confirmação
    showPage('result'); // Exibe a página de resultados
}

// ====================================================================
// PÁGINA DE RESULTADO FINAL (PAGE 7)
// ====================================================================

/**
 * Exibe o vencedor do jogo e as pontuações finais de todos os jogadores.
 */
function displayFinalResults() {
    const winnerDisplay = document.getElementById('winner-display');
    const finalScoresContainer = document.getElementById('final-scores');
    
    winnerDisplay.innerHTML = '';
    finalScoresContainer.innerHTML = '';
    
    // Encontra o jogador com a maior pontuação (o vencedor)
    let winnerIndex = 0;
    let maxScore = -Infinity;
    gameState.scores.forEach((score, index) => {
        if (score > maxScore) {
            maxScore = score;
            winnerIndex = index;
        }
    });

    // Exibe o vencedor com destaque
    const winnerPlayer = gameState.players[winnerIndex];
    const winnerScore = gameState.scores[winnerIndex];

    const winnerDiv = document.createElement('div');
    winnerDiv.className = 'player-display current winner-bounce'; // Reutiliza estilo de destaque
    const winnerIcon = document.createElement('div');
    winnerIcon.className = `player-icon ${playerColors[winnerIndex]}`;
    winnerIcon.textContent = '👤'; // Ícone de troféu
    const winnerName = document.createElement('div');
    winnerName.className = 'player-name';
    winnerName.textContent = winnerPlayer;
    const winnerPoints = document.createElement('div');
    winnerPoints.className = 'final-score';
    winnerPoints.textContent = `${winnerScore} pts`;

    winnerDiv.appendChild(winnerIcon);
    winnerDiv.appendChild(winnerName);
    winnerDiv.appendChild(winnerPoints);
    winnerDisplay.appendChild(winnerDiv);

    // Exibe as pontuações de todos os jogadores (exceto o vencedor, para evitar duplicidade visual)
    gameState.players.forEach((player, index) => {
        if (index !== winnerIndex) { 
            const finalPlayerDiv = document.createElement('div');
            finalPlayerDiv.className = 'final-player';
            
            const icon = document.createElement('div');
            icon.className = `player-icon ${playerColors[index]}`;
            icon.textContent = '👤';
            
            const name = document.createElement('div');
            name.className = 'player-name';
            name.textContent = player;
            
            const score = document.createElement('div');
            score.className = 'final-score';
            score.textContent = `${gameState.scores[index]} pts`;
            
            finalPlayerDiv.appendChild(icon);
            finalPlayerDiv.appendChild(name);
            finalPlayerDiv.appendChild(score);
            finalScoresContainer.appendChild(finalPlayerDiv);
        }
    });
}

/**
 * Reinicia o jogo com os mesmos jogadores.
 * Zera as pontuações e o histórico de rodadas, mas mantém os nomes dos jogadores.
 */
function restartWithSamePlayers() {
    // Zera apenas as pontuações e rodadas, mantendo os nomes dos jogadores
    gameState.scores = gameState.players.map(() => 0);
    gameState.rounds = [];
    gameState.currentPlayer = 0;
    gameState.firstPlayer = 0;
    gameState.timeRemaining = gameState.timeLimit;
    gameState.currentScoringPlayer = 0;
    gameState.roundScores = [];
    gameState.modalCallback = null;
    currentTimeIndex = 2; // Reseta o tempo para 1 minuto
    document.getElementById('players-toggle').textContent = gameState.numPlayers;
    document.getElementById('time-toggle').textContent = timeOptions[currentTimeIndex].label;
    showPage('first-player'); // Volta para a seleção do primeiro jogador
}

/**
 * Reinicia o jogo completamente, voltando para a página de configuração.
 * Zera todo o estado do jogo, incluindo nomes de jogadores.
 */
function restartWithNewPlayers() {
    resetGameState(); // Zera todo o estado do jogo
    showPage('config'); // Volta para a página de configuração
}

/**
 * Reseta todo o estado do jogo para os valores iniciais padrão.
 */
function resetGameState() {
    gameState.players = [];
    gameState.numPlayers = 2;
    gameState.timeLimit = 60;
    gameState.currentPlayer = 0;
    gameState.firstPlayer = 0;
    gameState.rounds = [];
    gameState.scores = [];
    gameState.timer = null;
    gameState.timeRemaining = 0;
    gameState.currentScoringPlayer = 0;
    gameState.roundScores = [];
    gameState.modalCallback = null;
    currentTimeIndex = 2; // Reseta o tempo para 1 minuto
    document.getElementById('players-toggle').textContent = gameState.numPlayers;
    document.getElementById('time-toggle').textContent = timeOptions[currentTimeIndex].label;
}

// ====================================================================
// MODAL DE CONFIRMAÇÃO
// ====================================================================

/**
 * Exibe o modal de confirmação com uma mensagem e um callback a ser executado se o usuário confirmar.
 * @param {string} message - A mensagem a ser exibida no modal.
 * @param {function} callback - A função a ser executada se o usuário clicar em 'SIM'.
 */
function showConfirmationModal(message, callback) {
    document.getElementById('modal-message').textContent = message;
    gameState.modalCallback = callback; // Armazena o callback para ser executado ao confirmar
    document.getElementById('confirmation-modal').classList.remove('hidden');
    document.getElementById('modal-overlay').classList.remove('hidden');
}

/**
 * Esconde o modal de confirmação e limpa o callback armazenado.
 */
function hideModal() {
    document.getElementById('confirmation-modal').classList.add('hidden');
    document.getElementById('modal-overlay').classList.add('hidden');
    gameState.modalCallback = null; // Limpa o callback
}

/**
 * Executa o callback armazenado no `gameState` quando o botão 'SIM' do modal é clicado.
 */
function handleModalYes() {
    if (gameState.modalCallback) {
        gameState.modalCallback();
    }
    hideModal();
}


