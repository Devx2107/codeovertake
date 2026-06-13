const Student = require('../models/Student');
const Snapshot = require('../models/Snapshot');
const AnalyticsCache = require('../models/AnalyticsCache');

const PLATFORM_KEYS = ['github', 'leetcode', 'codeforces', 'codechef', 'gfg'];
// Total score is out of 4000, so 500-point bands provide an easy-to-read distribution.
// Upper bucket bounds are exclusive in MongoDB $bucket, so 4001 ensures score 4000 is included.
const SCORE_BUCKETS = [0, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4001];
// Fine-grained buckets for bell curve (0, 100, 200, ..., 4000, 4001)
const BELL_CURVE_BUCKETS = Array.from({ length: 41 }, (_, i) => i * 100);
BELL_CURVE_BUCKETS.push(4001);
const TOP_STUDENTS_LIMIT = 5;
const PLATFORM_AVERAGE_KEY = {
  github: 'averageGithub',
  leetcode: 'averageLeetcode',
  codeforces: 'averageCodeforces',
  codechef: 'averageCodechef',
  gfg: 'averageGfg',
};

function round(value, digits = 2) {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function formatDate(date) {
  return new Date(date).toISOString().split('T')[0];
}

// In-memory cache for today (avoids repeated DB reads within the same day)
let _memCache = { dateKey: null, data: null };

function todayKey() {
  return new Date().toISOString().split('T')[0];
}

async function getOverview() {
  const key = todayKey();

  // 1. In-memory hit
  if (_memCache.dateKey === key && _memCache.data) {
    return _memCache.data;
  }

  // 2. DB hit
  const cached = await AnalyticsCache.findOne({ date: key }).lean();
  if (cached) {
    _memCache = { dateKey: key, data: cached.data };
    return cached.data;
  }

  // 3. Compute, persist, cache
  const result = await _computeOverview();
  await AnalyticsCache.findOneAndUpdate(
    { date: key },
    { date: key, data: result },
    { upsert: true },
  );
  _memCache = { dateKey: key, data: result };
  return result;
}

async function getOverviewByDate(dateStr) {
  const cached = await AnalyticsCache.findOne({ date: dateStr }).lean();
  return cached ? cached.data : null;
}

async function getAvailableDates() {
  const docs = await AnalyticsCache.find({}, { date: 1, _id: 0 })
    .sort({ date: -1 })
    .lean();
  return docs.map((d) => d.date);
}

async function _computeOverview() {
  const [
    totalStudents,
    linkedStudents,
    currentScoreAgg,
    platformCoverageAgg,
    branchDistribution,
    yearDistribution,
    scoreDistribution,
    topStudents,
    latestSnapshotDates,
    registrationTrendRaw,
    medianAgg,
    platformEngagementAgg,
    platformStatAverages,
    topPerPlatform,
    bellCurveRaw,
  ] = await Promise.all([
    Student.countDocuments({}),
    Student.countDocuments({
      $or: PLATFORM_KEYS.map((key) => ({ [`${key}.username`]: { $ne: '' } })),
    }),
    Student.aggregate([
      {
        $group: {
          _id: null,
          averageTotal: { $avg: '$scores.total' },
          maxTotal: { $max: '$scores.total' },
          averageGithub: { $avg: '$scores.github' },
          averageLeetcode: { $avg: '$scores.leetcode' },
          averageCodeforces: { $avg: '$scores.codeforces' },
          averageCodechef: { $avg: '$scores.codechef' },
        },
      },
    ]),
    Student.aggregate([
      {
        $group: {
          _id: null,
          github: {
            $sum: {
              $cond: [{ $and: [{ $ne: ['$github.username', null] }, { $ne: ['$github.username', ''] }] }, 1, 0],
            },
          },
          leetcode: {
            $sum: {
              $cond: [{ $and: [{ $ne: ['$leetcode.username', null] }, { $ne: ['$leetcode.username', ''] }] }, 1, 0],
            },
          },
          codeforces: {
            $sum: {
              $cond: [{ $and: [{ $ne: ['$codeforces.username', null] }, { $ne: ['$codeforces.username', ''] }] }, 1, 0],
            },
          },
          codechef: {
            $sum: {
              $cond: [{ $and: [{ $ne: ['$codechef.username', null] }, { $ne: ['$codechef.username', ''] }] }, 1, 0],
            },
          },
          gfg: {
            $sum: {
              $cond: [{ $and: [{ $ne: ['$gfg.username', null] }, { $ne: ['$gfg.username', ''] }] }, 1, 0],
            },
          },
        },
      },
    ]),
    Student.aggregate([
      { $group: { _id: '$branch', count: { $sum: 1 }, averageScore: { $avg: '$scores.total' } } },
      { $sort: { count: -1, _id: 1 } },
    ]),
    Student.aggregate([
      { $group: { _id: '$year', count: { $sum: 1 }, averageScore: { $avg: '$scores.total' } } },
      { $sort: { _id: 1 } },
    ]),
    Student.aggregate([
      {
        $bucket: {
          groupBy: '$scores.total',
          boundaries: SCORE_BUCKETS,
          default: 'unknown',
          output: { count: { $sum: 1 } },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Student.find({})
      .sort({ 'scores.total': -1 })
      .limit(TOP_STUDENTS_LIMIT)
      .select('rollno name branch year scores.total ranks.overall'),
    Snapshot.aggregate([
      { $group: { _id: '$date' } },
      { $sort: { _id: -1 } },
      { $limit: 30 },
      { $sort: { _id: 1 } },
    ]),
    Student.aggregate([
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 30 },
      { $sort: { _id: 1 } },
    ]),
    // Median total score
    Student.aggregate([
      { $sort: { 'scores.total': 1 } },
      { $group: { _id: null, scores: { $push: '$scores.total' } } },
      {
        $project: {
          median: {
            $let: {
              vars: { len: { $size: '$scores' } },
              in: {
                $cond: [
                  { $eq: [{ $mod: ['$$len', 2] }, 0] },
                  {
                    $avg: [
                      { $arrayElemAt: ['$scores', { $subtract: [{ $divide: ['$$len', 2] }, 1] }] },
                      { $arrayElemAt: ['$scores', { $divide: ['$$len', 2] }] },
                    ],
                  },
                  { $arrayElemAt: ['$scores', { $floor: { $divide: ['$$len', 2] } }] },
                ],
              },
            },
          },
        },
      },
    ]),
    // Platform engagement: how many platforms each student has linked
    Student.aggregate([
      {
        $project: {
          platformCount: {
            $size: {
              $filter: {
                input: PLATFORM_KEYS.map((key) => `$${key}.username`),
                cond: { $and: [{ $ne: ['$$this', null] }, { $ne: ['$$this', ''] }] },
              },
            },
          },
        },
      },
      { $group: { _id: '$platformCount', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    // Platform-specific stat averages (only for students who have that platform linked)
    Student.aggregate([
      {
        $facet: {
          github: [
            { $match: { 'github.username': { $nin: ['', null] } } },
            {
              $group: {
                _id: null,
                avgRepos: { $avg: '$github.stats.publicRepos' },
                avgStars: { $avg: '$github.stats.totalStars' },
                avgFollowers: { $avg: '$github.stats.followers' },
                avgContributions: { $avg: '$github.stats.contributions' },
              },
            },
          ],
          leetcode: [
            { $match: { 'leetcode.username': { $nin: ['', null] } } },
            {
              $group: {
                _id: null,
                avgTotalSolved: { $avg: '$leetcode.stats.totalSolved' },
                avgEasySolved: { $avg: '$leetcode.stats.easySolved' },
                avgMediumSolved: { $avg: '$leetcode.stats.mediumSolved' },
                avgHardSolved: { $avg: '$leetcode.stats.hardSolved' },
                avgContestRating: { $avg: '$leetcode.stats.contestRating' },
              },
            },
          ],
          codeforces: [
            { $match: { 'codeforces.username': { $nin: ['', null] } } },
            {
              $group: {
                _id: null,
                avgRating: { $avg: '$codeforces.stats.rating' },
                avgMaxRating: { $avg: '$codeforces.stats.maxRating' },
                avgProblemsSolved: { $avg: '$codeforces.stats.problemsSolved' },
              },
            },
          ],
          codechef: [
            { $match: { 'codechef.username': { $nin: ['', null] } } },
            {
              $group: {
                _id: null,
                avgCurrentRating: { $avg: '$codechef.stats.currentRating' },
                avgHighestRating: { $avg: '$codechef.stats.highestRating' },
                avgProblemsSolved: { $avg: '$codechef.stats.totalProblemsSolved' },
              },
            },
          ],
          gfg: [
            { $match: { 'gfg.username': { $nin: ['', null] } } },
            {
              $group: {
                _id: null,
                avgTotalSolved: { $avg: '$gfg.stats.totalSolved' },
                avgEasySolved: { $avg: '$gfg.stats.easySolved' },
                avgMediumSolved: { $avg: '$gfg.stats.mediumSolved' },
                avgHardSolved: { $avg: '$gfg.stats.hardSolved' },
                avgScore: { $avg: '$gfg.stats.score' },
              },
            },
          ],
        },
      },
    ]),
    // Top student per platform
    Promise.all(
      PLATFORM_KEYS.map(async (platform) => {
        const student = await Student.findOne({ [`${platform}.username`]: { $ne: '' } })
          .sort({ [`scores.${platform}`]: -1 })
          .limit(1)
          .select(`rollno name scores.${platform} ${platform}.username`)
          .lean();
        return { platform, student };
      }),
    ),
    // Bell curve: fine-grained score frequency
    Student.aggregate([
      {
        $bucket: {
          groupBy: '$scores.total',
          boundaries: BELL_CURVE_BUCKETS,
          default: 'unknown',
          output: { count: { $sum: 1 } },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const trendDates = latestSnapshotDates.map((d) => d._id);
  const trend = trendDates.length
    ? await Snapshot.aggregate([
        { $match: { date: { $in: trendDates } } },
        {
          $group: {
            _id: '$date',
            avgTotal: { $avg: '$scores.total' },
            maxTotal: { $max: '$scores.total' },
            avgGithub: { $avg: '$scores.github' },
            avgLeetcode: { $avg: '$scores.leetcode' },
            avgCodeforces: { $avg: '$scores.codeforces' },
            avgCodechef: { $avg: '$scores.codechef' },
            avgGfg: { $avg: '$scores.gfg' },
            studentCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
    : [];

  const current = currentScoreAgg[0] || {};
  const platformCoverage = platformCoverageAgg[0] || {};
  const scoreDistributionMap = new Map(
    scoreDistribution
      .filter((item) => item._id !== 'unknown')
      .map((item) => [item._id, item.count]),
  );

  const latestTrend = trend[trend.length - 1];
  const previousTrend = trend[trend.length - 2];

  const averageDelta = latestTrend && previousTrend ? latestTrend.avgTotal - previousTrend.avgTotal : 0;

  const medianTotal = medianAgg[0]?.median ?? 0;

  // Build platform engagement: { 0: n, 1: n, 2: n, 3: n, 4: n }
  const engagementMap = Object.fromEntries([0, 1, 2, 3, 4].map((n) => [n, 0]));
  for (const item of platformEngagementAgg) {
    if (item._id >= 0 && item._id <= 4) engagementMap[item._id] = item.count;
  }

  const rawStats = platformStatAverages[0] || {};

  const platformStatAvgs = {
    github: {
      avgRepos: round(rawStats.github?.[0]?.avgRepos || 0),
      avgStars: round(rawStats.github?.[0]?.avgStars || 0),
      avgFollowers: round(rawStats.github?.[0]?.avgFollowers || 0),
      avgContributions: round(rawStats.github?.[0]?.avgContributions || 0),
    },
    leetcode: {
      avgTotalSolved: round(rawStats.leetcode?.[0]?.avgTotalSolved || 0),
      avgEasySolved: round(rawStats.leetcode?.[0]?.avgEasySolved || 0),
      avgMediumSolved: round(rawStats.leetcode?.[0]?.avgMediumSolved || 0),
      avgHardSolved: round(rawStats.leetcode?.[0]?.avgHardSolved || 0),
      avgContestRating: round(rawStats.leetcode?.[0]?.avgContestRating || 0),
    },
    codeforces: {
      avgRating: round(rawStats.codeforces?.[0]?.avgRating || 0),
      avgMaxRating: round(rawStats.codeforces?.[0]?.avgMaxRating || 0),
      avgProblemsSolved: round(rawStats.codeforces?.[0]?.avgProblemsSolved || 0),
    },
    codechef: {
      avgCurrentRating: round(rawStats.codechef?.[0]?.avgCurrentRating || 0),
      avgHighestRating: round(rawStats.codechef?.[0]?.avgHighestRating || 0),
      avgProblemsSolved: round(rawStats.codechef?.[0]?.avgProblemsSolved || 0),
    },
    gfg: {
      avgTotalSolved: round(rawStats.gfg?.[0]?.avgTotalSolved || 0),
      avgEasySolved: round(rawStats.gfg?.[0]?.avgEasySolved || 0),
      avgMediumSolved: round(rawStats.gfg?.[0]?.avgMediumSolved || 0),
      avgHardSolved: round(rawStats.gfg?.[0]?.avgHardSolved || 0),
      avgScore: round(rawStats.gfg?.[0]?.avgScore || 0),
    },
  };

  return {
    summary: {
      totalStudents,
      linkedStudents,
      linkedPercentage: totalStudents ? round((linkedStudents / totalStudents) * 100) : 0,
      averageTotalScore: round(current.averageTotal || 0),
      medianTotalScore: round(medianTotal),
      maxTotalScore: current.maxTotal || 0,
      averageDeltaFromPreviousSnapshot: round(averageDelta),
      latestSnapshotDate: latestTrend ? formatDate(latestTrend._id) : null,
    },
    platformCoverage: PLATFORM_KEYS.map((key) => ({
      platform: key,
      linkedCount: platformCoverage[key] || 0,
      linkedPercentage: totalStudents ? round(((platformCoverage[key] || 0) / totalStudents) * 100) : 0,
      averageScore: round(current[PLATFORM_AVERAGE_KEY[key]] || 0),
    })),
    branchDistribution: branchDistribution.map((item) => ({
      branch: item._id,
      count: item.count,
      averageScore: round(item.averageScore || 0),
    })),
    yearDistribution: yearDistribution.map((item) => ({
      year: item._id,
      count: item.count,
      averageScore: round(item.averageScore || 0),
    })),
    scoreDistribution: SCORE_BUCKETS.slice(0, -1).map((start, index) => {
      const endExclusive = SCORE_BUCKETS[index + 1];
      return {
        range: `${start} to <${endExclusive}`,
        count: scoreDistributionMap.get(start) || 0,
      };
    }),
    trend: trend.map((item) => ({
      date: formatDate(item._id),
      avgTotal: round(item.avgTotal || 0),
      maxTotal: item.maxTotal || 0,
      avgGithub: round(item.avgGithub || 0),
      avgLeetcode: round(item.avgLeetcode || 0),
      avgCodeforces: round(item.avgCodeforces || 0),
      avgCodechef: round(item.avgCodechef || 0),
      avgGfg: round(item.avgGfg || 0),
      students: item.studentCount || 0,
    })),
    topStudents: topStudents.map((student) => ({
      rollno: student.rollno,
      name: student.name,
      branch: student.branch,
      year: student.year,
      totalScore: student.scores?.total || 0,
      overallRank: student.ranks?.overall || null,
    })),
    registrationsTrend: registrationTrendRaw.map((item) => ({
      date: item._id,
      count: item.count,
    })),
    platformEngagement: [0, 1, 2, 3, 4].map((n) => ({
      platforms: n,
      count: engagementMap[n],
    })),
    platformStatAverages: platformStatAvgs,
    topPerPlatform: topPerPlatform.map((item) => ({
      platform: item.platform,
      student: item.student
        ? {
            rollno: item.student.rollno,
            name: item.student.name,
            username: item.student[item.platform]?.username || '',
            score: item.student.scores?.[item.platform] || 0,
          }
        : null,
    })),
    scoreBellCurve: BELL_CURVE_BUCKETS.slice(0, -1).map((start) => ({
      score: start,
      students: bellCurveRaw.find((b) => b._id === start)?.count || 0,
    })),
  };
}

module.exports = {
  getOverview,
  getOverviewByDate,
  getAvailableDates,
};
