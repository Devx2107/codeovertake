const axios = require('axios');

const GFG_BASE = 'https://auth.geeksforgeeks.org';

async function fetchStats(username) {
  if (!username) return null;

  try {
    const res = await axios.get(`${GFG_BASE}/user/${encodeURIComponent(username)}/practice/`, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    const html = res.data || '';
    const extractNumber = (pattern) => {
      const match = html.match(pattern);
      return match ? Number(match[1].replace(/,/g, '')) || 0 : 0;
    };

    const totalSolved = extractNumber(/Problems Solved<\/[^>]+>\s*<[^>]+>([\d,]+)/i);
    const easySolved = extractNumber(/Easy<\/[^>]+>\s*<[^>]+>([\d,]+)/i);
    const mediumSolved = extractNumber(/Medium<\/[^>]+>\s*<[^>]+>([\d,]+)/i);
    const hardSolved = extractNumber(/Hard<\/[^>]+>\s*<[^>]+>([\d,]+)/i);
    const score = extractNumber(/Score<\/[^>]+>\s*<[^>]+>([\d,]+)/i);
    const monthlyScore = extractNumber(/Monthly Score<\/[^>]+>\s*<[^>]+>([\d,]+)/i);
    const instituteRank = extractNumber(/Institute Rank<\/[^>]+>\s*<[^>]+>([\d,]+)/i);
    const streak = extractNumber(/Streak<\/[^>]+>\s*<[^>]+>([\d,]+)/i);

    if (!totalSolved && !easySolved && !mediumSolved && !hardSolved && !score && !monthlyScore && !instituteRank && !streak) {
      return null;
    }

    return {
      totalSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      score,
      monthlyScore,
      instituteRank,
      streak,
    };
  } catch (error) {
    if (error.response?.status === 404) return null;
    console.error(`GFG fetch error for ${username}:`, error.message);
    return null;
  }
}

async function validateUsername(username) {
  try {
    const res = await axios.get(`${GFG_BASE}/user/${encodeURIComponent(username)}/practice/`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    return res.status === 200 && !String(res.data || '').includes('User not found');
  } catch {
    return false;
  }
}

function calculateScore(stats) {
  if (!stats) return 0;
  const { totalSolved = 0, easySolved = 0, mediumSolved = 0, hardSolved = 0, score = 0, monthlyScore = 0, streak = 0 } = stats;
  const solvedScore = Math.min(500, Math.round(totalSolved * 8 + easySolved * 2 + mediumSolved * 4 + hardSolved * 8));
  const profileScore = Math.min(300, Math.round(score * 0.3));
  const monthlyScoreBoost = Math.min(150, Math.round(monthlyScore * 0.6));
  const streakScore = Math.min(50, Math.round(streak * 5));
  return Math.min(1000, solvedScore + profileScore + monthlyScoreBoost + streakScore);
}

module.exports = {
  key: 'gfg',
  label: 'GeeksForGeeks',
  fetchStats,
  validateUsername,
  calculateScore,
  profileUrl: (username) => `https://auth.geeksforgeeks.org/user/${username}/practice/`,
  leaderboardFields: 'rollno name branch year scores.gfg gfg.username gfg.stats ranks',
  leaderboardHeaders: [
    { label: 'Total', statKey: 'gfg.stats.totalSolved' },
    { label: 'Easy', statKey: 'gfg.stats.easySolved' },
    { label: 'Medium', statKey: 'gfg.stats.mediumSolved' },
    { label: 'Hard', statKey: 'gfg.stats.hardSolved' },
    { label: 'Score', statKey: 'gfg.stats.score' },
  ],
  profileStats: [
    { label: 'Total Solved', statKey: 'stats.totalSolved' },
    { label: 'Easy', statKey: 'stats.easySolved' },
    { label: 'Medium', statKey: 'stats.mediumSolved' },
    { label: 'Hard', statKey: 'stats.hardSolved' },
    { label: 'Score', statKey: 'stats.score' },
    { label: 'Monthly Score', statKey: 'stats.monthlyScore' },
    { label: 'Institute Rank', statKey: 'stats.instituteRank' },
    { label: 'Streak', statKey: 'stats.streak' },
  ],
};
