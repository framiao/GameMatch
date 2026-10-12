/**
 * @fileoverview Ponto de entrada principal da aplicação (Core App Component).
 * @description Gere o estado global da aplicação e o roteamento entre os 3 ecrãs principais:
 * Lobby (Login), Waiting Room (Sala de Espera) e Game Matcher (Jogo).
 * Utiliza o localStorage para manter a sessão viva em caso de refresh (F5).
 */

import { useState, useEffect } from 'react';
import { Lobby } from "./components/lobby";
import { WaitingRoom } from "./components/waiting-room";
import { GameMatcher } from "./components/game-matcher";

/**
 * Dados guardados na sessão ativa do utilizador.
 * @typedef {Object} SessionData
 * @property {string} roomCode - O código de 4 letras da sala atual.
 * @property {string} playerId - O ID do jogador (SteamID ou GUEST_ID).
 * @property {string} playerType - O tipo de conta ('steam' ou 'guest').
 */

function App() {
  /** @type {[SessionData|null, Function]} Estado da sessão atual */
  const [sessionData, setSessionData] = useState(() => {
    const saved = localStorage.getItem('gamematch_session');
    return saved ? JSON.parse(saved) : null;
  });
  
  /** @type {[string, Function]} Estado do roteamento ('lobby', 'waiting', 'playing') */
  const [appState, setAppState] = useState(() => {
    const savedState = localStorage.getItem('gamematch_appState');
    return savedState || 'lobby';
  });

  // Efeito: Guarda automaticamente a sessão na memória do browser
  useEffect(() => {
    if (sessionData) {
      localStorage.setItem('gamematch_session', JSON.stringify(sessionData));
    } else {
      localStorage.removeItem('gamematch_session');
    }
  }, [sessionData]);

  // Efeito: Guarda o ecrã atual na memória do browser
  useEffect(() => {
    localStorage.setItem('gamematch_appState', appState);
  }, [appState]);

  /**
   * Chamado quando o utilizador entra ou cria uma sala com sucesso.
   * @param {string} roomCode 
   * @param {string} playerId 
   * @param {string} playerType 
   */
  const handleJoin = (roomCode, playerId, playerType) => {
    setSessionData({ roomCode, playerId, playerType });
    setAppState('waiting');
  };

  /** Chamado quando o Host inicia o jogo na Sala de Espera. */
  const handleStart = () => {
    setAppState('playing');
  };

  /** 
   * Chamado quando o jogador decide abandonar a sala voluntariamente.
   * Avisa o servidor e limpa a memória local (localStorage).
   */
  const handleLeave = async () => {
    if (sessionData) {
        try {
            await fetch(`http://localhost:5000/api/sessions/${sessionData.roomCode}/leave`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId: sessionData.playerId })
            });
        } catch (err) {
            console.error("Erro a avisar o servidor da saída", err);
        }
    }
    setSessionData(null);
    setAppState('lobby');
    localStorage.removeItem('gamematch_session');
    localStorage.removeItem('gamematch_appState');
  };

  /** Chamado quando o jogo acaba e os jogadores decidem jogar novamente. */
  const handleReset = () => {
    setAppState('waiting');
  };

  // Renderização Condicional baseada no AppState
  if (appState === 'playing') {
    return <GameMatcher sessionInfo={sessionData} onLeave={handleLeave} onReset={handleReset} />;
  }

  if (appState === 'waiting') {
    return <WaitingRoom sessionInfo={sessionData} onStart={handleStart} onLeave={handleLeave} />;
  }

  return <Lobby onJoinRoom={handleJoin} />;
}

export default App;