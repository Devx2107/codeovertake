const leaderboardService = require('../services/leaderboardService');

const getLeaderboard = async (req, res) => {
  const result = await leaderboardService.getLeaderboard(req.query);
  res.json(result);
};

const getFilters = async (req, res) => {
  const result = await leaderboardService.getFilters();
  res.json(result);
};

const getHistoricalLeaderboard = async (req, res) => {
  const result = await leaderboardService.getHistoricalLeaderboard(req.params.date, req.query);
  res.json(result);
};

const getTopGainers = async (req, res) => {
  const result = await leaderboardService.getTopGainers(req.query);
  res.json(result);
};

const getPlatformLeaderboard = (platformKey) => async (req, res) => {
  const result = await leaderboardService.getPlatformLeaderboard(platformKey, req.query);
  res.json(result);
};

module.exports = {
  getLeaderboard,
  getFilters,
  getHistoricalLeaderboard,
  getTopGainers,
  getPlatformLeaderboard,
};
