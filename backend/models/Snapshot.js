const mongoose = require('mongoose');

const snapshotSchema = new mongoose.Schema({
  rollno: { type: String, required: true },
  date: { type: Date, required: true },

  githubStats: {
    publicRepos: { type: Number, default: 0 },
    followers: { type: Number, default: 0 },
    totalStars: { type: Number, default: 0 },
    contributions: { type: Number, default: 0 },
  },

  leetcodeStats: {
    totalSolved: { type: Number, default: 0 },
    easySolved: { type: Number, default: 0 },
    mediumSolved: { type: Number, default: 0 },
    hardSolved: { type: Number, default: 0 },
    contestRating: { type: Number, default: 0 },
    contestsAttended: { type: Number, default: 0 },
  },

  codeforcesStats: {
    rating: { type: Number, default: 0 },
    maxRating: { type: Number, default: 0 },
    problemsSolved: { type: Number, default: 0 },
  },

  codechefStats: {
    currentRating: { type: Number, default: 0 },
    highestRating: { type: Number, default: 0 },
    totalProblemsSolved: { type: Number, default: 0 },
  },

  gfgStats: {
    totalSolved: { type: Number, default: 0 },
    easySolved: { type: Number, default: 0 },
    mediumSolved: { type: Number, default: 0 },
    hardSolved: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    monthlyScore: { type: Number, default: 0 },
    instituteRank: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
  },

  scores: {
    github: { type: Number, default: 0 },
    leetcode: { type: Number, default: 0 },
    codeforces: { type: Number, default: 0 },
    codechef: { type: Number, default: 0 },
    gfg: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },

  ranks: {
    overall: { type: Number, default: 0 },
    yearWise: { type: Number, default: 0 },
    branchWise: { type: Number, default: 0 },
  },
}, {
  timestamps: true,
});

snapshotSchema.index({ rollno: 1, date: -1 });
snapshotSchema.index({ date: -1 });
snapshotSchema.index({ rollno: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Snapshot', snapshotSchema);
