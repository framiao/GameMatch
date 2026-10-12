/**
 * @fileoverview Modelo de Dados para as Sessões (Salas) do GameMatch.
 * Define a estrutura guardada no MongoDB.
 */

const mongoose = require('mongoose');

/**
 * Esquema de um Jogador individual dentro de uma sala.
 * @typedef {Object} Player
 * @property {string} id - SteamID64 ou ID de Convidado gerado (GUEST_...).
 * @property {string} name - Nickname do jogador (Steam ou inserido manualmente).
 * @property {string} avatar - URL da foto de perfil (Steam ou gerada).
 * @property {boolean} isGuest - Indica se é uma conta de convidado (sem ligação à Steam).
 * @property {string[]} likes - Array de IDs dos jogos em que o jogador deu "Heart" (Gosto).
 * @property {boolean} finished - Indica se o jogador já viu todas as cartas disponíveis.
 */
const PlayerSchema = new mongoose.Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    avatar: { type: String, default: '' },
    isGuest: { type: Boolean, default: false },
    likes: { type: [String], default: [] },
    finished: { type: Boolean, default: false }
}, { _id: false }); // _id: false previne que o Mongoose crie um Object ID interno para cada jogador

/**
 * Esquema principal da Sala (Session).
 * @typedef {Object} Session
 * @property {string} roomCode - Código único de 4 letras (ex: "ABCD").
 * @property {string} hostId - ID do jogador que criou e controla a sala.
 * @property {string} status - Estado do jogo: 'waiting', 'playing', 'no_match' ou 'aborted'.
 * @property {Player[]} players - Lista de jogadores na sala.
 * @property {string[]} matches - Array de IDs dos jogos onde todos os jogadores deram Like.
 * @property {Object[]} customGames - Jogos adicionados manualmente via RAWG API.
 */
const SessionSchema = new mongoose.Schema({
    roomCode: { type: String, required: true, unique: true },
    hostId: { type: String, required: true },
    status: { type: String, default: 'waiting' },
    players: { type: [PlayerSchema], default: [] },
    matches: { type: [String], default: [] },
    customGames: { type: Array, default: [] } 
}, {
    timestamps: true // Adiciona automaticamente createdAt e updatedAt
});

module.exports = mongoose.model('Session', SessionSchema);