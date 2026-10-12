/**
 * @fileoverview Componente Visual da Carta de Jogo.
 * @description Apresenta as informações gráficas do jogo com animações de Swipe incluídas.
 * Possui um fallback automático para quebra de imagens (fallback dinâmico via API Steam ou Placeholder).
 */

/**
 * Objeto com as propriedades de um Jogo a apresentar na Carta.
 * @typedef {Object} Game
 * @property {string} id - AppID da Steam ou ID RAWG.
 * @property {string} title - Título oficial do jogo.
 * @property {string} image - URL do poster/banner principal.
 * @property {string[]} tags - Coleção de rótulos visuais (ex: ['Steam', 'PC']).
 */

/**
 * @param {Object} props
 * @param {Game} props.game - O objeto de jogo atual.
 * @param {'left'|'right'|null} props.exitDirection - Classe de CSS que define para que lado a carta voa (Swipe).
 */
export function GameCard({ game, exitDirection }) {
  const exitClass =
    exitDirection === 'left'
      ? '-translate-x-[120%] -rotate-12 opacity-0'
      : exitDirection === 'right'
        ? 'translate-x-[120%] rotate-12 opacity-0'
        : 'translate-x-0 rotate-0 opacity-100'

  return (
    <article
      className={`relative aspect-[3/4] w-full overflow-hidden rounded-3xl bg-zinc-900 shadow-2xl shadow-black/60 ring-1 ring-white/10 transition-all duration-300 ease-out ${exitClass}`}
      aria-label={game.title}
    >
      <img 
        src={game.image} 
        alt={game.title} 
        className="absolute inset-0 h-full w-full object-cover" 
        onError={(e) => {
            // 1. Previne um loop infinito caso o plano B também falhe
            e.currentTarget.onerror = null; 
            
            // 2. Se for um jogo da Steam, tenta carregar o banner horizontal clássico
            if (game.tags?.includes('Steam')) {
                e.currentTarget.src = `https://steamcdn-a.akamaihd.net/steam/apps/${game.id}/header.jpg`;
            } else {
                // 3. Se for um jogo "Custom" e o avatar falhar, gera um cartão de recurso com o nome do jogo
                e.currentTarget.src = `https://placehold.co/600x900/09090b/10b981?text=${encodeURIComponent(game.title)}`;
            }
        }}
      />

      <div
        className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/70 to-transparent"
        aria-hidden="true"
      />

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-6">
        <h2 className="text-balance text-3xl font-extrabold leading-tight tracking-tight text-white">
          {game.title}
        </h2>
        <ul className="flex flex-wrap gap-2" aria-label="Etiquetas">
          {game.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white backdrop-blur-md"
            >
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}