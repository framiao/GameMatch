<div align="center">
  <img src="https://upload.wikimedia.org/wikipedia/commons/8/83/Steam_icon_logo.svg" alt="Steam Logo" width="60" />
  <h1>🎮 GameMatch</h1>
  <p><strong>O "Tinder" dos videojogos para grupos de amigos.</strong></p>
  
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](#)
  [![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](#)
  [![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](#)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](#)
</div>

---

## 📖 Sobre o Projeto

Já passaste pela dor de estar no Discord com 4 amigos durante meia hora a perguntar *"O que vamos jogar hoje?"* e ninguém chegar a um consenso? O **GameMatch** resolve esse problema.

A aplicação liga-se diretamente às contas Steam dos jogadores, cruza as bibliotecas de todos para descobrir os jogos que têm em comum (filtrando automaticamente apenas os jogos Multiplayer/Co-op) e apresenta-os num formato de cartas "Swipe". Quando todos os membros da sala dão *Like* no mesmo jogo... **TEMOS MATCH!** 🎉

## ✨ Funcionalidades Principais

* 🔐 **Login Oficial da Steam (OpenID):** Autenticação segura que não requer passwords, puxando diretamente o Avatar e Nickname.
* 👻 **Sistema Híbrido com Convidados:** Não tens a conta conectada ou queres jogar algo fora da Steam? Usa uma conta de convidado com avatares automáticos (DiceBear).
* 🔄 **Matchmaking Síncrono:** Salas protegidas por código de 4 letras onde todos os jogadores veem as mesmas cartas e a aplicação deteta quando há consenso absoluto.
* 🤖 **Filtro Inteligente de Multiplayer:** Integração em Backend com a API do SteamSpy para excluir automaticamente jogos Single-Player da biblioteca comum.
* 🔍 **Adição de Jogos Manuais (RAWG API):** Motor de pesquisa integrado para adicionar jogos customizados (ex: Valorant, Minecraft) com _debounce_ de pesquisa.
* 💾 **Persistência de Sessão:** Recuperação automática em caso de recarregamento da página (F5) via LocalStorage.

---

## 🛠️ Tecnologias Utilizadas

**Frontend:**
* [React](https://reactjs.org/) (com Vite)
* [Tailwind CSS](https://tailwindcss.com/)
* [Lucide Icons](https://lucide.dev/)

**Backend:**
* [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
* [MongoDB Atlas](https://www.mongodb.com/) (com Mongoose)
* [Passport.js](https://www.passportjs.org/) (passport-steam)

**APIs Externas:**
* Steam Web API (Bibliotecas e Perfis)
* SteamSpy API (Tags e Categorias)
* RAWG API (Base de Dados Global de Jogos)

---

## 🚀 Como Executar em Ambiente Local

Para correres este projeto na tua máquina, vais precisar de ter o Node.js instalado.

### 1. Clonar o repositório
```
bash
git clone https://github.com/framiao/GameMatch.git
cd gamematch
```

### 2. Configurar Variáveis de Ambiente (Backend)
Na pasta `backend`, cria um ficheiro chamado `.env` e adiciona as tuas chaves de API:

```env
STEAM_API_KEY=tua_chave_steam_aqui
MONGODB_URI=tua_connection_string_do_mongodb_atlas
RAWG_API_KEY=tua_chave_rawg_aqui
```

### 3. Iniciar o Backend
Abre um terminal, navega para a pasta do backend e inicia o servidor:

```
bash
cd backend
npm install
node index.js
```
*(Deverás ver no terminal: "🚀 Servidor Node.js a correr na porta 5000" e "🟢 Sucesso: Ligado ao MongoDB Atlas!")*

### 4. Iniciar o Frontend
Abre um segundo terminal, navega para a pasta do frontend e arranca o Vite:

```bash
cd frontend
npm install
npm run dev
```
*(O Frontend ficará disponível em http://localhost:5173)*
