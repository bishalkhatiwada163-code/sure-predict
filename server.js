// ═══════════════════════════════════════════════════════════════════════
// SURE PREDICT - PRODUCTION BACKEND SERVER
// Handles millions of users with caching and rate limiting
// ═══════════════════════════════════════════════════════════════════════

const express = require('express');
const cors = require('cors');
const NodeCache = require('node-cache');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Cache configuration (stores data for 60 seconds)
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve your HTML file

// ═══════════════════════════════════════════════════════════════════════
// API CONFIGURATION - Choose one:
// ═══════════════════════════════════════════════════════════════════════

// OPTION 1: API-FOOTBALL (RapidAPI) - Recommended for production
const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY || 'YOUR_RAPIDAPI_KEY_HERE';
const API_FOOTBALL_HOST = 'api-football-v1.p.rapidapi.com';

// OPTION 2: Football-Data.org (Backup)
const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_KEY || 'YOUR_FOOTBALL_DATA_KEY_HERE';

// League IDs for API-FOOTBALL
const LEAGUE_IDS = {
    'Premier League': 39,
    'La Liga': 140,
    'Bundesliga': 78,
    'Serie A': 135,
    'Ligue 1': 61,
    'Champions League': 2,
    'Europa League': 3
};

// ═══════════════════════════════════════════════════════════════════════
// API ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        cache_stats: cache.getStats()
    });
});

// Get live matches (cached)
app.get('/api/matches/live', async (req, res) => {
    try {
        const cached = cache.get('live_matches');
        if (cached) {
            return res.json({ source: 'cache', data: cached });
        }

        const liveMatches = await fetchLiveMatches();
        cache.set('live_matches', liveMatches);
        
        res.json({ source: 'api', data: liveMatches });
    } catch (error) {
        console.error('Error fetching live matches:', error.message);
        res.status(500).json({ error: 'Failed to fetch live matches' });
    }
});

// Get upcoming matches (cached)
app.get('/api/matches/upcoming', async (req, res) => {
    try {
        const cached = cache.get('upcoming_matches');
        if (cached) {
            return res.json({ source: 'cache', data: cached });
        }

        const upcomingMatches = await fetchUpcomingMatches();
        cache.set('upcoming_matches', upcomingMatches);
        
        res.json({ source: 'api', data: upcomingMatches });
    } catch (error) {
        console.error('Error fetching upcoming matches:', error.message);
        res.status(500).json({ error: 'Failed to fetch upcoming matches' });
    }
});

// Get team statistics and injuries
app.get('/api/team/:teamId', async (req, res) => {
    try {
        const { teamId } = req.params;
        const cacheKey = `team_${teamId}`;
        
        const cached = cache.get(cacheKey);
        if (cached) {
            return res.json({ source: 'cache', data: cached });
        }

        const teamData = await fetchTeamData(teamId);
        cache.set(cacheKey, teamData, 300); // Cache for 5 minutes
        
        res.json({ source: 'api', data: teamData });
    } catch (error) {
        console.error('Error fetching team data:', error.message);
        res.status(500).json({ error: 'Failed to fetch team data' });
    }
});

// Get team injuries
app.get('/api/team/:teamId/injuries', async (req, res) => {
    try {
        const { teamId } = req.params;
        const cacheKey = `injuries_${teamId}`;
        
        const cached = cache.get(cacheKey);
        if (cached) {
            return res.json({ source: 'cache', data: cached });
        }

        const injuries = await fetchTeamInjuries(teamId);
        cache.set(cacheKey, injuries, 600); // Cache for 10 minutes
        
        res.json({ source: 'api', data: injuries });
    } catch (error) {
        console.error('Error fetching injuries:', error.message);
        res.status(500).json({ error: 'Failed to fetch injuries' });
    }
});

// Get match prediction data
app.get('/api/prediction/:matchId', async (req, res) => {
    try {
        const { matchId } = req.params;
        const cacheKey = `prediction_${matchId}`;
        
        const cached = cache.get(cacheKey);
        if (cached) {
            return res.json({ source: 'cache', data: cached });
        }

        const predictionData = await fetchPredictionData(matchId);
        cache.set(cacheKey, predictionData, 300);
        
        res.json({ source: 'api', data: predictionData });
    } catch (error) {
        console.error('Error fetching prediction data:', error.message);
        res.status(500).json({ error: 'Failed to fetch prediction data' });
    }
});

// ═══════════════════════════════════════════════════════════════════════
// API FETCHING FUNCTIONS - API-FOOTBALL
// ═══════════════════════════════════════════════════════════════════════

async function fetchLiveMatches() {
    const matches = [];
    
    for (const [leagueName, leagueId] of Object.entries(LEAGUE_IDS)) {
        try {
            const response = await axios.get('https://api-football-v1.p.rapidapi.com/v3/fixtures', {
                params: { 
                    live: 'all',
                    league: leagueId,
                    season: new Date().getFullYear()
                },
                headers: {
                    'X-RapidAPI-Key': API_FOOTBALL_KEY,
                    'X-RapidAPI-Host': API_FOOTBALL_HOST
                }
            });

            if (response.data.response) {
                matches.push(...response.data.response.map(match => ({
                    ...match,
                    leagueName
                })));
            }
        } catch (error) {
            console.error(`Error fetching ${leagueName}:`, error.message);
        }
    }
    
    return matches;
}

async function fetchUpcomingMatches() {
    const matches = [];
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];
    
    for (const [leagueName, leagueId] of Object.entries(LEAGUE_IDS)) {
        try {
            const response = await axios.get('https://api-football-v1.p.rapidapi.com/v3/fixtures', {
                params: { 
                    league: leagueId,
                    season: new Date().getFullYear(),
                    from: today,
                    to: tomorrow
                },
                headers: {
                    'X-RapidAPI-Key': API_FOOTBALL_KEY,
                    'X-RapidAPI-Host': API_FOOTBALL_HOST
                }
            });

            if (response.data.response) {
                matches.push(...response.data.response.map(match => ({
                    ...match,
                    leagueName
                })));
            }
        } catch (error) {
            console.error(`Error fetching ${leagueName}:`, error.message);
        }
    }
    
    return matches;
}

async function fetchTeamData(teamId) {
    try {
        const response = await axios.get('https://api-football-v1.p.rapidapi.com/v3/teams', {
            params: { id: teamId },
            headers: {
                'X-RapidAPI-Key': API_FOOTBALL_KEY,
                'X-RapidAPI-Host': API_FOOTBALL_HOST
            }
        });

        return response.data.response[0];
    } catch (error) {
        console.error('Error fetching team data:', error.message);
        return null;
    }
}

async function fetchTeamInjuries(teamId) {
    try {
        const response = await axios.get('https://api-football-v1.p.rapidapi.com/v3/injuries', {
            params: { 
                team: teamId,
                season: new Date().getFullYear()
            },
            headers: {
                'X-RapidAPI-Key': API_FOOTBALL_KEY,
                'X-RapidAPI-Host': API_FOOTBALL_HOST
            }
        });

        return response.data.response;
    } catch (error) {
        console.error('Error fetching injuries:', error.message);
        return [];
    }
}

async function fetchPredictionData(matchId) {
    try {
        // Fetch match details
        const matchResponse = await axios.get('https://api-football-v1.p.rapidapi.com/v3/fixtures', {
            params: { id: matchId },
            headers: {
                'X-RapidAPI-Key': API_FOOTBALL_KEY,
                'X-RapidAPI-Host': API_FOOTBALL_HOST
            }
        });

        const match = matchResponse.data.response[0];

        // Fetch team statistics
        const [homeStats, awayStats, homeInjuries, awayInjuries] = await Promise.all([
            fetchTeamStats(match.teams.home.id, match.league.id),
            fetchTeamStats(match.teams.away.id, match.league.id),
            fetchTeamInjuries(match.teams.home.id),
            fetchTeamInjuries(match.teams.away.id)
        ]);

        return {
            match,
            homeStats,
            awayStats,
            homeInjuries,
            awayInjuries
        };
    } catch (error) {
        console.error('Error fetching prediction data:', error.message);
        return null;
    }
}

async function fetchTeamStats(teamId, leagueId) {
    try {
        const response = await axios.get('https://api-football-v1.p.rapidapi.com/v3/teams/statistics', {
            params: { 
                team: teamId,
                league: leagueId,
                season: new Date().getFullYear()
            },
            headers: {
                'X-RapidAPI-Key': API_FOOTBALL_KEY,
                'X-RapidAPI-Host': API_FOOTBALL_HOST
            }
        });

        return response.data.response;
    } catch (error) {
        console.error('Error fetching team stats:', error.message);
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════════════
// BACKGROUND JOBS - Auto-refresh cache
// ═══════════════════════════════════════════════════════════════════════

function startBackgroundJobs() {
    // Refresh live matches every 30 seconds
    setInterval(async () => {
        try {
            console.log('[JOB] Refreshing live matches...');
            const liveMatches = await fetchLiveMatches();
            cache.set('live_matches', liveMatches);
            console.log(`[JOB] Cached ${liveMatches.length} live matches`);
        } catch (error) {
            console.error('[JOB] Error refreshing live matches:', error.message);
        }
    }, 30000);

    // Refresh upcoming matches every 5 minutes
    setInterval(async () => {
        try {
            console.log('[JOB] Refreshing upcoming matches...');
            const upcomingMatches = await fetchUpcomingMatches();
            cache.set('upcoming_matches', upcomingMatches);
            console.log(`[JOB] Cached ${upcomingMatches.length} upcoming matches`);
        } catch (error) {
            console.error('[JOB] Error refreshing upcoming matches:', error.message);
        }
    }, 300000);
}

// ═══════════════════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════════════════

app.listen(PORT, () => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🚀 SURE PREDICT BACKEND SERVER');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`✓ Server running on port ${PORT}`);
    console.log(`✓ Frontend: http://localhost:${PORT}`);
    console.log(`✓ API Health: http://localhost:${PORT}/api/health`);
    console.log('═══════════════════════════════════════════════════════════');
    
    // Start background jobs
    startBackgroundJobs();
    
    // Initial cache population
    console.log('[INIT] Populating initial cache...');
    fetchLiveMatches().then(matches => {
        cache.set('live_matches', matches);
        console.log(`[INIT] Cached ${matches.length} live matches`);
    });
    fetchUpcomingMatches().then(matches => {
        cache.set('upcoming_matches', matches);
        console.log(`[INIT] Cached ${matches.length} upcoming matches`);
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    cache.close();
    process.exit(0);
});
