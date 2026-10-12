/**
 * @fileoverview Motor Principal de Matchmaking (Core Game Loop).
 * @description Apresenta as cartas aos utilizadores estilo "Tinder". Garante que
 * as cartas são embaralhadas na mesma ordem para todos os jogadores usando um sistema PRNG (Pseudo-Random Number Generator) fixado pelo código da sala.
 */

import { useState, useEffect } from 'react'
import { Heart, X, Loader2, PartyPopper, Ghost, LogOut, UserMinus } from 'lucide-react'
import { GameCard } from './game-card'

/**
 * Função geradora pseudo-aleatória 32-bit (PRNG).
 * Garante resultados previsíveis com base numa seed inicial.
 */
function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

/**
 * Converte uma String alfanumérica (Código da Sala) numa Semente Numérica (Seed).
 * @param {string} str - O roomCode.
 * @returns {Function} Função geradora pronta a ser consumida pelo PRNG.
 */
function generateSeed(str) {
    let h = 1779033703 ^ str.length;
    for(let i = 0; i < str.length; i++) {
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
        h = h << 13 | h >>> 19;
    }
    return function() {
        h = Math.imul(h ^ (h >>> 16), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        return (h ^= h >>> 16) >>> 0;
    }
}

/**
 * @param {Object} props
 * @param {import('../App').SessionData} props.sessionInfo 
 * @param {Function} props.onLeave
 * @param {Function} props.onReset
 */
export function GameMatcher({ sessionInfo, onLeave, onReset }) {
  const [games, setGames] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState(null)
  
  const [index, setIndex] = useState(0)
  const [exitDirection, setExitDirection] = useState(null)
  
  const [matchedGame, setMatchedGame] = useState(null)
  const [isNoMatch, setIsNoMatch] = useState(false)
  const [isAborted, setIsAborted] = useState(false)
  const [isHost, setIsHost] = useState(false);

  /** Emite um Reset ao Servidor para limpar os likes e recomeçar. */
  const handlePlayAgain = async () => {
      await fetch(`http://localhost:5000/api/sessions/${sessionInfo.roomCode}/reset`, { method: 'POST' });
  };
  
  const playSwipeSound = () => {
    const audio = new Audio('/sounds/swipe.wav');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  };

  const playMatchSound = () => {
    const audio = new Audio('/sounds/match.wav');
    audio.volume = 0.6;
    audio.play().catch(() => {});
  };

  // Carregamento inicial e cruzamento de jogos
  useEffect(() => {
    fetch(`http://localhost:5000/api/sessions/${sessionInfo.roomCode}/games`)
      .then(resposta => resposta.json())
      .then(dados => {
        if (dados.erro) {
            setErrorMsg(dados.erro);
            setIsLoading(false);
            return;
        }

        if (dados.jogos) {
          const jogosFormatados = [...dados.jogos];
          // Transforma o código da sala na semente para embaralhar os jogos
          const seed = generateSeed(sessionInfo.roomCode)();
          const random = mulberry32(seed);
          jogosFormatados.sort(() => random() - 0.5); // Todos os players terão a mesma ordem
          
          setGames(jogosFormatados);
        }
        setIsLoading(false);
      })
      .catch(() => {
        setErrorMsg('Erro de ligação ao servidor.');
        setIsLoading(false);
      });
  }, [sessionInfo.roomCode]);

  // Polling para vigiar novos Matches ou estados de Cancelamento (Aborted)
  useEffect(() => {
    if (isLoading) return;

    const checkMatches = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/sessions/${sessionInfo.roomCode}`);
            const data = await res.json();

            setIsHost(data.hostId === sessionInfo.playerId);

            if (data.status === 'waiting' && onReset) {
                onReset();
                return;
            }
            
            if (matchedGame || isNoMatch || isAborted) return; 
            
            if (data.status === 'aborted') {
                setIsAborted(true);
                return;
            }
            
            if (data.matches && data.matches.length > 0) {
                const theGame = games.find(g => g.id === data.matches[0]);
                if (theGame) {
                    setMatchedGame(theGame);
                    playMatchSound(); 
                }
            }
            
            if (data.status === 'no_match') {
                setIsNoMatch(true);
            }
        } catch (err) {
            console.error("Erro a vigiar matches:", err);
        }
    };

    const interval = setInterval(checkMatches, 2000);
    return () => clearInterval(interval);
  }, [sessionInfo.roomCode, sessionInfo.playerId, matchedGame, isNoMatch, isAborted, isLoading, games, onReset]);

  const currentGame = games[index];

  /** Processa a decisão do jogador e assinala fim caso seja a última carta. */
  async function handleChoice(direction) {
    if (exitDirection || !currentGame) return;

    playSwipeSound();
    setExitDirection(direction);

    if (direction === 'right') {
        try {
            const res = await fetch(`http://localhost:5000/api/sessions/${sessionInfo.roomCode}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId: sessionInfo.playerId, gameId: currentGame.id })
            });
            const data = await res.json();
            if (data.isMatch) {
              setMatchedGame(currentGame);
              playMatchSound(); 
            }
        } catch (err) {
            console.error("Erro a registar like:", err);
        }
    }
    
    setTimeout(() => {
      const nextIndex = index + 1;
      setIndex(nextIndex);
      
      if (nextIndex >= games.length) {
          fetch(`http://localhost:5000/api/sessions/${sessionInfo.roomCode}/finish`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ playerId: sessionInfo.playerId })
          }).catch(console.error);
      }
      
      setExitDirection(null);
    }, 300)
  }

  // ... [Manter todo o bloco IFs visuais e HTML/JSX do return exatamente inalterado]
  if (isLoading) {
    return (
        <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-950 text-white gap-4">
          <Loader2 className="size-10 animate-spin text-emerald-500" />
          <p className="animate-pulse text-lg text-zinc-400">A preparar jogos em comum...</p>
        </div>
      )
  }

  if (errorMsg) {
      return (
          <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-950 text-red-400 gap-4">
              <p>{errorMsg}</p>
              <button onClick={onLeave} className="rounded-xl bg-zinc-800 px-6 py-3 font-bold text-white hover:bg-zinc-700">Sair</button>
          </div>
      )
  }

  if (games.length === 0) {
      return (
          <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-950 text-zinc-400 gap-4">
              <p>Nenhum jogo em comum encontrado.</p>
              <button onClick={onLeave} className="rounded-xl bg-zinc-800 px-6 py-3 font-bold text-white hover:bg-zinc-700">Sair</button>
          </div>
      )
  }

  if (matchedGame) {
    return (
        <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-950 text-white p-6 relative overflow-hidden">
            <button onClick={onLeave} className="absolute top-6 left-6 z-50 flex items-center gap-2 text-sm text-zinc-500 hover:text-red-400 transition-colors">
               <LogOut className="size-5" /> Sair
            </button>
            <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] animate-pulse" />
            <PartyPopper className="size-20 text-emerald-400 mb-6 animate-bounce" />
            <h1 className="text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-emerald-300 to-emerald-600 mb-2">
                MATCH!
            </h1>
            <p className="text-zinc-400 mb-10 text-lg">Vocês vão jogar:</p>
            <div className="relative w-full max-w-xs aspect-[6/9] rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.3)] ring-4 ring-emerald-500/50">
                <img src={matchedGame.image} alt={matchedGame.title} className="absolute inset-0 w-full h-full object-cover" />
            </div>
            <h2 className="mt-8 text-3xl font-bold text-center z-10">{matchedGame.title}</h2>
            
            {isHost ? (
                <button 
                    onClick={handlePlayAgain}
                    className="mt-8 z-10 rounded-xl bg-emerald-600 px-8 py-4 font-bold text-white transition hover:bg-emerald-500 active:scale-95 shadow-lg shadow-emerald-500/20"
                >
                    Jogar Novamente com o mesmo grupo
                </button>
            ) : (
                <p className="mt-8 animate-pulse text-zinc-500 text-sm z-10">A aguardar que o Host decida se jogam novamente...</p>
            )}
        </div>
    )
  }

  if (isNoMatch) {
      return (
          <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-950 text-white p-6 text-center relative overflow-hidden">
              <button onClick={onLeave} className="absolute top-6 left-6 z-50 flex items-center gap-2 text-sm text-zinc-500 hover:text-red-400 transition-colors">
                 <LogOut className="size-5" /> Sair
              </button>
              
              <Ghost className="size-24 text-zinc-700 mb-6" />
              <h1 className="text-4xl font-bold mb-4 text-zinc-300">Sem Sorte!</h1>
              <p className="text-zinc-500 max-w-sm mb-8 text-lg">
                  Vocês viram os jogos todos mas têm gostos muito difíceis. Não houve nenhum Match!
              </p>
              
              {isHost ? (
                  <button 
                      onClick={handlePlayAgain}
                      className="rounded-xl z-10 bg-emerald-600 px-8 py-4 font-bold text-white transition hover:bg-emerald-500 active:scale-95 shadow-lg shadow-emerald-500/20"
                  >
                      Jogar Novamente com o mesmo grupo
                  </button>
              ) : (
                  <p className="animate-pulse text-zinc-500 text-sm z-10">A aguardar que o Host decida se jogam novamente...</p>
              )}
          </div>
      )
  }
  
  if (isAborted) {
      return (
          <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-950 text-white p-6 text-center relative overflow-hidden">
              <button onClick={onLeave} className="absolute top-6 left-6 z-50 flex items-center gap-2 text-sm text-zinc-500 hover:text-red-400 transition-colors">
                  <LogOut className="size-5" /> Sair
              </button>

              <UserMinus className="size-24 text-red-500 mb-6" />
              <h1 className="text-4xl font-bold mb-4 text-zinc-300">Match Interrompido</h1>
              <p className="text-zinc-500 max-w-sm mb-8 text-lg">
                  O outro jogador abandonou a sala a meio do jogo. Ficaste sozinho(a)!
              </p>

              {isHost && (
                  <button 
                      onClick={handlePlayAgain}
                      className="rounded-xl z-10 bg-red-600 px-8 py-4 font-bold text-white transition hover:bg-red-500 active:scale-95 shadow-lg shadow-red-500/20"
                  >
                      Voltar à Sala de Espera
                  </button>
              )}
          </div>
      )
  }

  if (!currentGame) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-950 text-white p-6 text-center relative">
        <button onClick={onLeave} className="absolute top-6 left-6 z-50 flex items-center gap-2 text-sm text-zinc-500 hover:text-red-400 transition-colors">
            <LogOut className="size-5" /> Sair
        </button>
        <Loader2 className="size-16 animate-spin text-emerald-500 mb-8" />
        <h2 className="mb-4 text-3xl font-bold">Acabaste as tuas cartas!</h2>
        <p className="text-zinc-400 text-lg max-w-sm">
          A aguardar que os restantes jogadores terminem as suas escolhas. O Match ainda pode acontecer...
        </p>
      </div>
    )
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-between bg-zinc-950 px-5 pb-10 pt-6 text-white overflow-hidden relative">
      <button onClick={onLeave} className="absolute top-6 left-6 z-50 flex items-center gap-2 text-sm text-zinc-500 hover:text-red-400 transition-colors">
         <LogOut className="size-5" /> Sair
      </button>

      <header className="w-full max-w-md pt-8">
        <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-mono text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">SALA: {sessionInfo.roomCode}</span>
            <span className="text-xs text-zinc-500">{index + 1} de {games.length}</span>
        </div>
        <h1 className="text-center text-xl font-bold tracking-tight">
          Game<span className="text-emerald-400">Match</span>
        </h1>
      </header>

      <section className="flex w-full max-w-md flex-1 items-center py-6" aria-live="polite">
        <GameCard key={currentGame.id + index} game={currentGame} exitDirection={exitDirection} />
      </section>

      <div className="flex w-full max-w-md items-center justify-center gap-10">
        <button
          type="button"
          onClick={() => handleChoice('left')}
          className="flex size-20 items-center justify-center rounded-full border-2 border-red-500/40 bg-zinc-900 text-red-500 shadow-lg shadow-red-500/10 transition hover:bg-red-500/10 active:scale-90"
        >
          <X className="size-10" strokeWidth={3} />
        </button>
        <button
          type="button"
          onClick={() => handleChoice('right')}
          className="flex size-20 items-center justify-center rounded-full border-2 border-emerald-500/40 bg-zinc-900 text-emerald-400 shadow-lg shadow-emerald-500/10 transition hover:bg-emerald-500/10 active:scale-90"
        >
          <Heart className="size-10 fill-current" />
        </button>
      </div>
    </main>
  )
}