/**
 * @fileoverview Componente do Lobby de Entrada.
 * @description Permite aos utilizadores iniciarem sessão via Steam (OpenID) ou como Convidados.
 * Trata da comunicação inicial com o servidor para criar ou entrar em salas.
 */

import { useState, useEffect } from "react";
import { Gamepad2, Users, ArrowRight, Loader2, LogOut } from "lucide-react";

/**
 * @param {Object} props
 * @param {Function} props.onJoinRoom - Callback executado quando o jogador entra com sucesso.
 */
export function Lobby({ onJoinRoom }) {
  const [roomCode, setRoomCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [joining, setJoining] = useState(false);
  
  const [steamUser, setSteamUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Verifica se o utilizador já tem um cookie de sessão válido do backend
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/auth/user`, { credentials: 'include' })
      .then(res => {
          if (!res.ok) throw new Error('Não autenticado');
          return res.json();
      })
      .then(data => {
          setSteamUser(data);
          setCheckingAuth(false);
      })
      .catch(() => {
          setSteamUser(null);
          setCheckingAuth(false);
      });
  }, []);

  /** Redireciona para o portal seguro de autenticação da Valve/Steam. */
  const handleSteamLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/steam`;
  };

  /** Termina a sessão autenticada atual. */
  const handleLogout = async () => {
    await fetch(`${import.meta.env.VITE_API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    setSteamUser(null);
  };

  /** 
   * Prepara os dados (Steam ou Convidado) e pede ao servidor para criar uma nova Sala. 
   */
  const createRoom = async () => {
    if (!steamUser && !nickname) return alert("Faz login com a Steam ou insere um Nickname de Convidado!");
    
    setJoining(true);
    try {
      const isGuest = !steamUser;
      
      const payload = {
          playerId: isGuest ? `GUEST_${Math.random().toString(36).substring(7)}` : steamUser.id,
          playerName: isGuest ? nickname : steamUser.name,
          isGuest: isGuest
      };

      const resposta = await fetch(`${import.meta.env.VITE_API_URL}/api/sessions/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const dados = await resposta.json();
      
      if (!resposta.ok) throw new Error(dados.erro || "Falha ao criar sala");
      
      onJoinRoom(dados.roomCode, payload.playerId, isGuest ? 'guest' : 'steam');
      
    } catch (erro) {
      console.error(erro);
      alert("Erro ao criar a sala.");
      setJoining(false);
    }
  };

  /** 
   * Valida o código inserido e tenta juntar o jogador a uma Sala existente. 
   */
  const joinRoom = async (e) => {
    e.preventDefault();
    if (roomCode.length !== 4) return alert("O código precisa de 4 letras!");
    if (!steamUser && !nickname) return alert("Faz login com a Steam ou insere um Nickname!");

    setJoining(true);
    
    try {
      const isGuest = !steamUser;
      
      const payload = {
          roomCode: roomCode,
          playerId: isGuest ? `GUEST_${Math.random().toString(36).substring(7)}` : steamUser.id,
          playerName: isGuest ? nickname : steamUser.name,
          isGuest: isGuest
      };

      const resposta = await fetch(`${import.meta.env.VITE_API_URL}/api/sessions/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const dados = await resposta.json();
      
      if (!resposta.ok) throw new Error(dados.erro || "Falha ao entrar na sala");
      
      onJoinRoom(roomCode, payload.playerId, isGuest ? 'guest' : 'steam');
      
    } catch (erro) {
      alert("Erro a entrar na sala. Verifica o código!");
      console.error(erro);
      setJoining(false);
    }
  };

  // ... (o return HTML permanece inalterado)
  // ... [Manter todo o bloco HTML/JSX do return exatamente igual ao que tens]
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-950 p-6 text-white overflow-hidden relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="z-10 w-full max-w-md space-y-10">
        <div className="text-center space-y-2">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-[2rem] bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-xl shadow-emerald-500/20 rotate-3">
            <Gamepad2 className="size-10 text-zinc-950 -rotate-3" />
          </div>
          <h1 className="text-5xl font-black tracking-tight italic">
            Game<span className="text-transparent bg-clip-text bg-gradient-to-br from-emerald-300 to-emerald-600">Match</span>
          </h1>
          <p className="text-zinc-400 text-lg">Encontra o jogo perfeito para hoje.</p>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl bg-zinc-900/50 p-6 shadow-2xl ring-1 ring-white/10 backdrop-blur-sm">
            {checkingAuth ? (
                <div className="flex justify-center p-4">
                    <Loader2 className="animate-spin text-emerald-500 size-8" />
                </div>
            ) : steamUser ? (
                <div className="flex items-center justify-between bg-zinc-800/50 rounded-2xl p-3 border border-emerald-500/30">
                    <div className="flex items-center gap-3">
                        <img src={steamUser.avatar} alt="Avatar" className="size-12 rounded-full border-2 border-emerald-500" />
                        <div>
                            <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Ligado à Steam</p>
                            <p className="font-semibold text-zinc-200 truncate max-w-[150px]">{steamUser.name}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="p-2 text-zinc-500 hover:text-red-400 transition" title="Sair da Steam">
                        <LogOut className="size-5" />
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    <button
                      type="button"
                      onClick={handleSteamLogin}
                      className="group relative flex w-full items-center justify-center gap-3 rounded-2xl bg-zinc-800 p-4 font-bold text-white transition-all hover:bg-zinc-700 active:scale-95 border border-zinc-700 hover:border-emerald-500/50 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/8/83/Steam_icon_logo.svg" alt="Steam" className="size-6 brightness-200" />
                      Iniciar Sessão pela Steam
                    </button>
                    
                    <div className="flex items-center gap-4 text-xs font-medium text-zinc-600 uppercase tracking-widest">
                        <span className="flex-1 h-px bg-zinc-800"></span>
                        OU ENTRA COMO CONVIDADO
                        <span className="flex-1 h-px bg-zinc-800"></span>
                    </div>

                    <input
                      type="text"
                      placeholder="O teu Nickname..."
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-zinc-950 p-4 text-white placeholder-zinc-500 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-center font-medium"
                    />
                </div>
            )}
            
            <div className="mt-8 space-y-4">
              <button
                onClick={createRoom}
                disabled={joining || (!steamUser && !nickname)}
                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 p-4 font-bold text-zinc-950 transition hover:bg-emerald-400 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
              >
                {joining ? <Loader2 className="animate-spin size-5" /> : <Gamepad2 className="size-5 transition-transform group-hover:scale-110 group-hover:rotate-12" />}
                Criar Nova Sala
              </button>

              <div className="flex items-center gap-4 text-xs font-medium text-zinc-600 uppercase tracking-widest">
                <span className="flex-1 h-px bg-zinc-800"></span>
                OU ENTRAR
                <span className="flex-1 h-px bg-zinc-800"></span>
              </div>

              <form onSubmit={joinRoom} className="relative">
                <Users className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="CÓDIGO (ex: ABCD)"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  maxLength={4}
                  className="w-full rounded-2xl border border-white/10 bg-zinc-950 py-4 pl-12 pr-14 font-mono font-bold uppercase text-white placeholder-zinc-600 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-center tracking-widest"
                />
                <button
                  type="submit"
                  disabled={joining || roomCode.length !== 4 || (!steamUser && !nickname)}
                  className="absolute right-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-xl bg-zinc-800 text-white transition hover:bg-zinc-700 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                >
                  <ArrowRight className="size-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}