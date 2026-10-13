/**
 * @fileoverview Componente da Sala de Espera.
 * @description Sincroniza ativamente os jogadores conectados (Polling), permite a
 * pesquisa de jogos extra na API RAWG com sistema de Debounce para poupar pedidos.
 */

import { useState, useEffect, useCallback } from 'react';
import { Copy, Check, Play, Loader2, Search, LogOut} from 'lucide-react';

/**
 * @param {Object} props
 * @param {import('../App').SessionData} props.sessionInfo - Dados da sessão atual.
 * @param {Function} props.onStart - Callback disparado quando o jogo passa ao estado 'playing'.
 * @param {Function} props.onLeave - Callback disparado se o jogador sair.
 */
export function WaitingRoom({ sessionInfo, onStart, onLeave }) {
  const [copied, setCopied] = useState(false);
  const [players, setPlayers] = useState([]);
  const [customGamesCount, setCustomGamesCount] = useState(0);
  const [isHost, setIsHost] = useState(false);
  const [starting, setStarting] = useState(false);
  
  const [customGameName, setCustomGameName] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingGame, setIsAddingGame] = useState(false);

  const stableOnStart = useCallback(() => onStart(), [onStart]);

  /** 
   * EFEITO DE POLLING: Sincronização periódica da Sala.
   * Consulta o servidor a cada 2 segundos para atualizar lista de jogadores.
   */
  useEffect(() => {
    const fetchRoomState = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/sessions/${sessionInfo.roomCode}`);
        if (res.ok) {
          const data = await res.json();
          setPlayers(data.players);
          setCustomGamesCount(data.customGames?.length || 0);
          setIsHost(data.hostId === sessionInfo.playerId);
          if (data.status === 'playing') stableOnStart();
        }
      } catch (err) {
        console.error("Falha ao sincronizar sala:", err);
      }
    };
    fetchRoomState();
    const interval = setInterval(fetchRoomState, 2000);
    return () => clearInterval(interval);
  }, [sessionInfo.roomCode, sessionInfo.playerId, stableOnStart]);

  /** 
   * EFEITO DE DEBOUNCE: Motor de Pesquisa Inteligente.
   * Só faz o pedido à RAWG 500ms depois do utilizador parar de escrever,
   * poupando assim tráfego e limites da API.
   */
  useEffect(() => {
    if (customGameName.length < 3) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchResults([]);
      return;
    }
    
    const delaySearch = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/search-games?q=${customGameName}`);
        const data = await res.json();
        setSearchResults(data);
      } catch (err) {
        console.error("Erro na pesquisa", err);
      }
      setIsSearching(false);
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [customGameName]);

  const handleCopy = () => {
    navigator.clipboard.writeText(sessionInfo.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /** Altera o estado do servidor para "playing", o que despoleta o onStart em todos os clientes. */
  const handleHostStart = async () => {
    setStarting(true);
    fetch(`${import.meta.env.VITE_API_URL}/api/sessions/${sessionInfo.roomCode}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: sessionInfo.playerId })
    }).catch(() => setStarting(false));
  };

  /** Regista um jogo da RAWG na lista customizada da Sala. */
  const handleSelectGame = async (gameInfo) => {
      setIsAddingGame(true);
      
      const novoJogo = {
          id: gameInfo.id,
          title: gameInfo.title,
          image: gameInfo.image,
          tags: ['Custom', 'RAWG']
      };

      try {
          await fetch(`${import.meta.env.VITE_API_URL}/api/sessions/${sessionInfo.roomCode}/add-game`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ game: novoJogo })
          });
          setCustomGameName('');
          setSearchResults([]);
      } catch (err) {
          console.error("Erro ao adicionar", err);
      } finally {
          setIsAddingGame(false);
      }
  };

  // Regras de validação para desbloquear o botão Iniciar
  const steamPlayersCount = players.filter(p => !p.isGuest).length;
  const isGuestOnly = steamPlayersCount === 0;
  const cannotStart = (isGuestOnly && customGamesCount < 2) || players.length < 2;

  // ... [Manter o teu bloco return( ... ) HTML exatamente inalterado]
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-zinc-950 p-6 text-white font-sans">
        <button 
            onClick={onLeave} 
            className="absolute top-6 left-6 flex items-center gap-2 text-sm text-zinc-500 hover:text-red-400 transition-colors"
        >
            <LogOut className="size-5" />
            Sair
        </button>
      <div className="w-full max-w-sm text-center">
        
        <h2 className="mb-2 text-2xl font-bold">Sala da Malta</h2>
        <p className="mb-6 text-zinc-400">Partilha este código para entrar:</p>

        {/* Cartão do Código */}
        <div className="relative mb-8 flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
          <span className="text-5xl font-black tracking-widest text-emerald-400">{sessionInfo.roomCode}</span>
          <button onClick={handleCopy} className="absolute -bottom-5 flex items-center gap-2 rounded-full bg-zinc-800 px-6 py-2 font-medium text-zinc-300 transition-all hover:bg-zinc-700 hover:text-white active:scale-95">
            {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>

        {/* BARRA DE PESQUISA INTELIGENTE */}
        <div className="mb-8 w-full rounded-2xl bg-zinc-900/50 p-4 border border-zinc-800 text-left relative">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 flex justify-between items-center">
            <span>Pesquisar Jogo Extra</span>
            <span className="text-emerald-500 font-bold bg-emerald-500/10 px-2 py-1 rounded">{customGamesCount} na lista</span>
          </h3>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              {isSearching ? <Loader2 className="size-4 animate-spin text-zinc-500" /> : <Search className="size-4 text-zinc-500" />}
            </div>
            
            <input 
                type="text" 
                value={customGameName}
                onChange={(e) => setCustomGameName(e.target.value)}
                placeholder="Ex: Valorant, Minecraft..."
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
            />
            
            {/* O DROPDOWN COM OS RESULTADOS! */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto">
                {searchResults.map((game) => (
                  <button 
                    key={game.id}
                    onClick={() => handleSelectGame(game)}
                    className="flex w-full items-center gap-3 p-3 transition-colors hover:bg-zinc-800 text-left border-b border-zinc-800/50 last:border-0"
                  >
                    <img src={game.image} alt={game.title} className="h-10 w-16 object-cover rounded shadow-sm bg-zinc-950" />
                    <span className="text-sm font-medium line-clamp-1">{game.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {isAddingGame && <p className="text-emerald-400 text-xs mt-2 text-center animate-pulse">A adicionar jogo à sala...</p>}
        </div>

        {/* Grelha de Jogadores e Botões (Mantidos igualzinho!) */}
        <div className="mb-10 w-full rounded-2xl bg-zinc-900/50 p-4 border border-zinc-800/50">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Jogadores na Sala ({players.length})
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            {players.map((player) => (
              <div key={player.id} className="flex flex-col items-center gap-2">
                <div className="relative size-16 overflow-hidden rounded-full border-2 border-emerald-500/30 bg-zinc-800 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                  <img src={player.avatar} alt={player.name} className="size-full object-cover" />
                </div>
                <span className="text-xs font-medium text-zinc-300">
                  {player.name}
                  {player.id === players[0]?.id && ' 👑'} 
                </span>
              </div>
            ))}
          </div>
        </div>

        {isHost ? (
          <div className="flex flex-col w-full gap-2">
            <button 
              onClick={handleHostStart} 
              disabled={starting || cannotStart} 
              className="group flex w-full items-center justify-center gap-3 rounded-xl bg-emerald-500 p-4 text-lg font-bold text-zinc-950 transition-all hover:bg-emerald-400 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
            >
              {starting ? <Loader2 className="animate-spin size-6" /> : <Play className="size-6 fill-current transition-transform group-hover:scale-110" />}
              Começar o Match!
            </button>
            {/* Aviso visual se estiver bloqueado */}
            {cannotStart && (
              <div className="text-center mt-2">
                  {players.length < 2 ? (
                      <p className="text-orange-400 text-xs animate-pulse">
                          ⏳ A aguardar por mais jogadores (mínimo 2).
                      </p>
                  ) : (
                      <p className="text-red-400 text-xs animate-pulse">
                          ⚠️ Uma sala só de convidados precisa de pelo menos 2 jogos adicionados manualmente.
                      </p>
                  )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 text-zinc-400">
            <Loader2 className="mb-2 size-6 animate-spin text-emerald-500" />
            <p className="font-medium text-zinc-300 text-sm">A aguardar o Host...</p>
          </div>
        )}
      </div>
    </main>
  );
}