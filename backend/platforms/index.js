/**
 * Platform Registry
 *
 * Each platform module must export:
 *   key         - unique identifier (used in DB fields, routes, etc.)
 *   label       - display name
 *   fetchStats(username)      - returns stats object or null
 *   validateUsername(username) - returns boolean
 *   calculateScore(stats)     - returns number 0–1000
 *   profileUrl(username)      - returns external profile URL
 *   leaderboardFields         - Mongoose select string for leaderboard queries
 *   leaderboardHeaders        - array of { label, statKey } for table columns
 */

const github = require('./github');
const leetcode = require('./leetcode');
const codeforces = require('./codeforces');
const codechef = require('./codechef');
const gfg = require('./gfg');

const platforms = [github, leetcode, codeforces, codechef, gfg];

// Map by key for fast lookup
const platformMap = {};
for (const p of platforms) {
  platformMap[p.key] = p;
}

function getAllPlatforms() {
  return platforms;
}

function getPlatform(key) {
  return platformMap[key] || null;
}

function getPlatformKeys() {
  return platforms.map((p) => p.key);
}

// Calculate total score from a scores object
function calculateTotalScore(scores) {
  return platforms.reduce((sum, p) => sum + (scores[p.key] || 0), 0);
}

// Build the $or filter for students with at least one username
function buildHasUsernameFilter() {
  return { $or: platforms.map((p) => ({ [`${p.key}.username`]: { $ne: '' } })) };
}

module.exports = {
  getAllPlatforms,
  getPlatform,
  getPlatformKeys,
  calculateTotalScore,
  buildHasUsernameFilter,
};
