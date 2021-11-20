const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

//Middleware
app.use(express.json());

//Staring server and connecting to db
const serverAndDb = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(PORT, () => {
      console.log(`Server Started at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.log(`Error: ${error.message}`);
    process.exit(1);
  }
};

serverAndDb();

const makePlayer = (player) => {
  return {
    playerId: player.player_id,
    playerName: player.player_name,
  };
};

const makeMatch = (match) => {
  return {
    matchId: match.match_id,
    match: match.match,
    year: match.year,
  };
};

const makeScore = (score) => {
  return {
    playerMatchId: score.player_match_id,
    playerId: score.playerId,
    matchId: score.match_id,
    score: score.score,
    fours: score.fours,
    sixes: score.sixes,
  };
};

// API-1: GET all players
app.get("/players/", async (req, res) => {
  const query = `
        SELECT *
        FROM player_details
    ;`;

  const players = await db.all(query);
  res.send(players.map((player) => makePlayer(player)));
});

// API-2: GET a specific player with id
app.get("/players/:playerId/", async (req, res) => {
  const { playerId } = req.params;
  const query = `
        SELECT *
        FROM player_details
        WHERE player_id = ${playerId}
    ;`;

  const player = await db.get(query);
  res.send(makePlayer(player));
});

// API-3: UPDATE a player
app.put("/players/:playerId/", async (req, res) => {
  const { playerId } = req.params;
  const { playerName } = req.body;
  const query = `
        UPDATE player_details
        SET player_name = '${playerName}'
        WHERE player_id = ${playerId}
    ;`;

  const player = await db.run(query);
  res.send("Player Details Updated");
});

// API-4: GET a specific Match Details
app.get("/matches/:matchId/", async (req, res) => {
  const { matchId } = req.params;
  const query = `
        SELECT *
        FROM match_details
        WHERE match_id = ${matchId}
    ;`;

  const match = await db.get(query);
  res.send(makeMatch(match));
});

//API-5: GET list of all matches of a player
app.get("/players/:playerId/matches/", async (req, res) => {
  const { playerId } = req.params;
  const query = `
        SELECT md.match_id, md.match, md.year
        FROM player_match_score AS pms
            INNER JOIN match_details AS md
                ON pms.match_id = md.match_id
        WHERE pms.player_id = ${playerId}
    ;`;

  const matches = await db.all(query);
  res.send(matches.map((match) => makeMatch(match)));
});

// API-6: GET list of all players of a specific match
app.get("/matches/:matchId/players/", async (req, res) => {
  const { matchId } = req.params;
  const query = `
        SELECT pd.player_id, pd.player_name
        FROM player_match_score AS pms
            INNER JOIN player_details AS pd
                ON pms.player_id = pd.player_id
        WHERE pms.match_id = ${matchId}
    ;`;
  const players = await db.all(query);
  res.send(players.map((player) => makePlayer(player)));
});

// API-7: GET statistics of a player
app.get("/players/:playerId/playerScores/", async (req, res) => {
  const { playerId } = req.params;
  const query = `
        SELECT pms.player_id AS playerId,
                pd.player_name AS playerName,
                SUM(pms.score) AS totalScore, 
                SUM(pms.fours) AS totalFours, 
                SUM(pms.sixes) AS totalSixes
        FROM player_match_score AS pms
        INNER JOIN player_details AS pd
            ON pms.player_id = pd.player_id
        WHERE pms.player_id = ${playerId}
    ;`;

  const stats = await db.get(query);
  res.send(stats);
});

module.exports = app;
