import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Activity, BarChart3, Calendar, Crown, Hash, Info, Link2, Target, Trophy, TrendingUp, Users } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { fetchAnalyticsOverview, fetchAnalyticsDates, type AnalyticsOverview } from "../api";
import { GithubIcon, LeetcodeIcon, CodeforcesIcon, CodechefIcon, GfgIcon } from "./PlatformIcons";
import { platformColors, engagementColors, CustomChartTooltip, useChartFocus, formatChartDate } from "./ChartUtils";

const platformIcons: Record<string, React.ReactNode> = {
  github: <span className="inline-block h-4 w-4"><GithubIcon /></span>,
  leetcode: <span className="inline-block h-4 w-4"><LeetcodeIcon /></span>,
  codeforces: <span className="inline-block h-4 w-4"><CodeforcesIcon /></span>,
  codechef: <span className="inline-block h-4 w-4"><CodechefIcon /></span>,
  gfg: <span className="inline-block h-4 w-4"><GfgIcon /></span>,
};

const pieColors = ["#4ade80", "#22c55e", "#16a34a", "#15803d", "#14532d", "#84cc16"];

export function Analytics() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const {
    activeLine: activeTrendLine,
    handleLegendClick: handleTrendLegendClick,
    legendFormatter: trendLegendFormatter
  } = useChartFocus();

  // Load available dates once
  useEffect(() => {
    fetchAnalyticsDates()
      .then((res) => setAvailableDates(res.dates))
      .catch(() => { });
  }, []);

  // Fetch analytics for selected date (or today)
  useEffect(() => {
    setLoading(true);
    setError("");
    fetchAnalyticsOverview(selectedDate || undefined)
      .then((res) => setData(res))
      .catch(() => setError("Could not load analytics right now."))
      .finally(() => setLoading(false));
  }, [selectedDate]);

  const trendData = useMemo(() => data?.trend || [], [data]);
  const coverageData = useMemo(() => data?.platformCoverage || [], [data]);
  const branchData = useMemo(() => data?.branchDistribution || [], [data]);
  const scoreRanges = useMemo(() => data?.scoreDistribution || [], [data]);
  const yearData = useMemo(() => data?.yearDistribution || [], [data]);
  const engagementData = useMemo(() => data?.platformEngagement || [], [data]);
  const bellCurveData = useMemo(() => (data?.scoreBellCurve || []).filter((d) => d.students > 0 || d.score <= 2000), [data]);

  if (loading) {
    return <div className="mx-auto max-w-7xl px-3 py-10 text-center text-[#888888]">Loading analytics...</div>;
  }

  if (!data) {
    return <div className="mx-auto max-w-7xl px-3 py-10 text-center text-[#888888]">{error || "Analytics unavailable."}</div>;
  }

  const cards = [
    {
      title: "Total Students",
      value: data.summary.totalStudents.toLocaleString(),
      subtitle: "profiles in database",
      icon: <Users className="h-4 w-4 text-[#60a5fa]" />,
    },
    {
      title: "Linked Profiles",
      value: `${data.summary.linkedStudents.toLocaleString()} (${data.summary.linkedPercentage}%)`,
      subtitle: "with at least one platform",
      icon: <Link2 className="h-4 w-4 text-[#4ade80]" />,
    },
    {
      title: "Average Score",
      value: data.summary.averageTotalScore.toLocaleString(),
      subtitle: data.summary.latestSnapshotDate ? `snapshot: ${data.summary.latestSnapshotDate}` : "current average",
      icon: <Activity className="h-4 w-4 text-[#f59e0b]" />,
    },
    {
      title: "Median Score",
      value: data.summary.medianTotalScore.toLocaleString(),
      subtitle: "middle value across all students",
      icon: <Target className="h-4 w-4 text-[#a78bfa]" />,
    },
    {
      title: "Max Score",
      value: data.summary.maxTotalScore.toLocaleString(),
      subtitle: "highest total score",
      icon: <Crown className="h-4 w-4 text-[#f59e0b]" />,
    },
    {
      title: "Snapshot Momentum",
      value: `${data.summary.averageDeltaFromPreviousSnapshot >= 0 ? "+" : ""}${data.summary.averageDeltaFromPreviousSnapshot}`,
      subtitle: "avg total vs previous snapshot",
      icon: <TrendingUp className="h-4 w-4 text-[#4ade80]" />,
    },
  ];

  const platformStatCards = [
    {
      platform: "github",
      label: "GitHub",
      stats: [
        { label: "Avg Repos", value: data.platformStatAverages.github.avgRepos },
        { label: "Avg Stars", value: data.platformStatAverages.github.avgStars },
        { label: "Avg Followers", value: data.platformStatAverages.github.avgFollowers },
        { label: "Avg Contributions", value: data.platformStatAverages.github.avgContributions },
      ],
    },
    {
      platform: "leetcode",
      label: "LeetCode",
      stats: [
        { label: "Avg Solved", value: data.platformStatAverages.leetcode.avgTotalSolved },
        { label: "Avg Easy", value: data.platformStatAverages.leetcode.avgEasySolved },
        { label: "Avg Medium", value: data.platformStatAverages.leetcode.avgMediumSolved },
        { label: "Avg Hard", value: data.platformStatAverages.leetcode.avgHardSolved },
        { label: "Avg Contest Rating", value: data.platformStatAverages.leetcode.avgContestRating },
      ],
    },
    {
      platform: "codeforces",
      label: "Codeforces",
      stats: [
        { label: "Avg Rating", value: data.platformStatAverages.codeforces.avgRating },
        { label: "Avg Max Rating", value: data.platformStatAverages.codeforces.avgMaxRating },
        { label: "Avg Solved", value: data.platformStatAverages.codeforces.avgProblemsSolved },
      ],
    },
    {
      platform: "codechef",
      label: "CodeChef",
      stats: [
        { label: "Avg Rating", value: data.platformStatAverages.codechef.avgCurrentRating },
        { label: "Avg Max Rating", value: data.platformStatAverages.codechef.avgHighestRating },
        { label: "Avg Solved", value: data.platformStatAverages.codechef.avgProblemsSolved },
      ],
    },
    {
      platform: "gfg",
      label: "GFG",
      stats: [
        { label: "Avg Solved", value: data.platformStatAverages.gfg.avgTotalSolved },
        { label: "Avg Easy", value: data.platformStatAverages.gfg.avgEasySolved },
        { label: "Avg Medium", value: data.platformStatAverages.gfg.avgMediumSolved },
        { label: "Avg Hard", value: data.platformStatAverages.gfg.avgHardSolved },
        { label: "Avg Score", value: data.platformStatAverages.gfg.avgScore },
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-['JetBrains_Mono'] text-2xl tracking-tight sm:text-3xl">Analy<span className="text-[#4ade80]">tics</span></h1>
        <div className="flex items-center gap-3">
          {availableDates.length > 0 && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#888888]" />
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded border border-[#1e1e1e] bg-[#111111] px-3 py-1.5 font-['JetBrains_Mono'] text-xs text-white outline-none focus:border-[#4ade80]"
              >
                <option value="">Today</option>
                {availableDates.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mb-6 flex items-start gap-2 rounded border border-[#1e1e1e] bg-[#111111] px-4 py-3 text-xs text-[#888888]">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#f59e0b]" />
        <span>Analytics are computed and cached once daily at midnight. Values shown reflect the state at the time of the last refresh{selectedDate ? ` (${selectedDate})` : ""}.</span>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid gap-3 sm:mb-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((card) => (
          <div key={card.title} className="rounded border border-[#1e1e1e] bg-[#111111] p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="font-['JetBrains_Mono'] text-xs uppercase tracking-wider text-[#888888]">{card.title}</div>
              {card.icon}
            </div>
            <div className="font-['JetBrains_Mono'] text-xl">{card.value}</div>
            <div className="mt-1 text-xs text-[#666666]">{card.subtitle}</div>
          </div>
        ))}
      </div>

      {/* Platform Stat Averages */}
      <div className="mb-6">
        <h2 className="mb-3 font-['JetBrains_Mono'] text-sm uppercase tracking-wider text-[#888888]">Platform Averages (Linked Users)</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {platformStatCards.map((p) => (
            <div key={p.platform} className="rounded border border-[#1e1e1e] bg-[#111111] p-4">
              <div className="mb-3 flex items-center gap-2">
                <span style={{ color: platformColors[p.platform] }}>{platformIcons[p.platform]}</span>
                <span className="font-['JetBrains_Mono'] text-sm" style={{ color: platformColors[p.platform] }}>{p.label}</span>
              </div>
              <div className="space-y-1.5">
                {p.stats.map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between text-xs">
                    <span className="text-[#888888]">{stat.label}</span>
                    <span className="font-['JetBrains_Mono']">{stat.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Score Trend + Platform Breakdown */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded border border-[#1e1e1e] bg-[#111111] p-4">
          <h2 className="mb-4 font-['JetBrains_Mono'] text-sm uppercase tracking-wider text-[#888888]">Score Trend (Snapshots)</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid stroke="#1e1e1e" strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: "#888888", fontSize: 12 }} 
                  tickFormatter={(d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                />
                <YAxis tick={{ fill: "#888888", fontSize: 12 }} />
                <Tooltip content={<CustomChartTooltip activeLine={activeTrendLine} labelFormatter={formatChartDate} />} />
                <Legend
                  onClick={handleTrendLegendClick}
                  formatter={trendLegendFormatter}
                  wrapperStyle={{ fontSize: "12px", fontFamily: "JetBrains Mono", cursor: "pointer" }}
                />
                <Line
                  type="monotone"
                  dataKey="maxTotal"
                  stroke="#ffffff"
                  strokeWidth={2}
                  dot={false}
                  activeDot={(!activeTrendLine || activeTrendLine === "maxTotal") ? { r: 4 } : false}
                  name="Top Total"
                  strokeOpacity={activeTrendLine && activeTrendLine !== "maxTotal" ? 0.3 : 1}
                  style={{ transition: "stroke-opacity 0.2s ease-in-out" }}
                />
                <Line
                  type="monotone"
                  dataKey="avgTotal"
                  stroke="#ff8594"
                  strokeWidth={2}
                  dot={false}
                  activeDot={(!activeTrendLine || activeTrendLine === "avgTotal") ? { r: 4 } : false}
                  name="Avg Total"
                  strokeOpacity={activeTrendLine && activeTrendLine !== "avgTotal" ? 0.3 : 1}
                  style={{ transition: "stroke-opacity 0.2s ease-in-out" }}
                />
                <Line
                  type="monotone"
                  dataKey="avgGithub"
                  stroke={platformColors.github}
                  strokeWidth={1}
                  dot={false}
                  activeDot={(!activeTrendLine || activeTrendLine === "avgGithub") ? { r: 3 } : false}
                  name="Avg GitHub"
                  strokeDasharray="4 2"
                  strokeOpacity={activeTrendLine && activeTrendLine !== "avgGithub" ? 0.1 : 1}
                  style={{ transition: "stroke-opacity 0.2s ease-in-out" }}
                />
                <Line
                  type="monotone"
                  dataKey="avgLeetcode"
                  stroke={platformColors.leetcode}
                  strokeWidth={1}
                  dot={false}
                  activeDot={(!activeTrendLine || activeTrendLine === "avgLeetcode") ? { r: 3 } : false}
                  name="Avg LeetCode"
                  strokeDasharray="4 2"
                  strokeOpacity={activeTrendLine && activeTrendLine !== "avgLeetcode" ? 0.1 : 1}
                  style={{ transition: "stroke-opacity 0.2s ease-in-out" }}
                />
                <Line
                  type="monotone"
                  dataKey="avgCodeforces"
                  stroke={platformColors.codeforces}
                  strokeWidth={1}
                  dot={false}
                  activeDot={(!activeTrendLine || activeTrendLine === "avgCodeforces") ? { r: 3 } : false}
                  name="Avg Codeforces"
                  strokeDasharray="4 2"
                  strokeOpacity={activeTrendLine && activeTrendLine !== "avgCodeforces" ? 0.1 : 1}
                  style={{ transition: "stroke-opacity 0.2s ease-in-out" }}
                />
                <Line
                  type="monotone"
                  dataKey="avgCodechef"
                  stroke={platformColors.codechef}
                  strokeWidth={1}
                  dot={false}
                  activeDot={(!activeTrendLine || activeTrendLine === "avgCodechef") ? { r: 3 } : false}
                  name="Avg CodeChef"
                  strokeDasharray="4 2"
                  strokeOpacity={activeTrendLine && activeTrendLine !== "avgCodechef" ? 0.1 : 1}
                  style={{ transition: "stroke-opacity 0.2s ease-in-out" }}
                />
                <Line
                  type="monotone"
                  dataKey="avgGfg"
                  stroke={platformColors.gfg}
                  strokeWidth={1}
                  dot={false}
                  activeDot={(!activeTrendLine || activeTrendLine === "avgGfg") ? { r: 3 } : false}
                  name="Avg GFG"
                  strokeDasharray="4 2"
                  strokeOpacity={activeTrendLine && activeTrendLine !== "avgGfg" ? 0.1 : 1}
                  style={{ transition: "stroke-opacity 0.2s ease-in-out" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded border border-[#1e1e1e] bg-[#111111] p-4">
          <h2 className="mb-4 font-['JetBrains_Mono'] text-sm uppercase tracking-wider text-[#888888]">Platform Coverage</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={coverageData}>
                <CartesianGrid stroke="#1e1e1e" strokeDasharray="3 3" />
                <XAxis dataKey="platform" tick={{ fill: "#888888", fontSize: 12 }} />
                <YAxis tick={{ fill: "#888888", fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)', radius: 4 }}
                  content={
                    <CustomChartTooltip
                      valueFormatter={(val: number, payload: any) =>
                        `${val} (${payload.linkedPercentage}%) — avg: ${payload.averageScore}`
                      }
                    />
                  }
                />
                <Bar dataKey="linkedCount" name="Linked Students" radius={[6, 6, 0, 0]}>
                  {coverageData.map((entry) => (
                    <Cell key={entry.platform} fill={platformColors[entry.platform]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Platform Engagement + Score Distribution */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded border border-[#1e1e1e] bg-[#111111] p-4">
          <h2 className="mb-4 font-['JetBrains_Mono'] text-sm uppercase tracking-wider text-[#888888]">Platform Engagement</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engagementData}>
                <CartesianGrid stroke="#1e1e1e" strokeDasharray="3 3" />
                <XAxis
                  dataKey="platforms"
                  tick={{ fill: "#888888", fontSize: 12 }}
                  tickFormatter={(v) => `${v} platform${v !== 1 ? "s" : ""}`}
                />
                <YAxis tick={{ fill: "#888888", fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)', radius: 4 }}
                  content={
                    <CustomChartTooltip
                      labelFormatter={(v: any) => `${v} platform${v !== 1 ? "s" : ""} linked`}
                    />
                  }
                />
                <Bar dataKey="count" name="Students" radius={[6, 6, 0, 0]}>
                  {engagementData.map((entry) => (
                    <Cell key={entry.platforms} fill={engagementColors[entry.platforms] || "#4ade80"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded border border-[#1e1e1e] bg-[#111111] p-4">
          <h2 className="mb-4 font-['JetBrains_Mono'] text-sm uppercase tracking-wider text-[#888888]">Score Range Distribution</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreRanges}>
                <CartesianGrid stroke="#1e1e1e" strokeDasharray="3 3" />
                <XAxis dataKey="range" tick={{ fill: "#888888", fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fill: "#888888", fontSize: 12 }} />
                <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.05)', radius: 4 }} content={<CustomChartTooltip />} />
                <Bar dataKey="count" fill="#ff8594" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Branch Distribution (with avg scores) + Year-Wise */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded border border-[#1e1e1e] bg-[#111111] p-4">
          <h2 className="mb-4 font-['JetBrains_Mono'] text-sm uppercase tracking-wider text-[#888888]">Branch Distribution</h2>
          <div className="h-72 overflow-y-auto">
            <div style={{ height: Math.max(288, branchData.length * 40) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchData} layout="vertical">
                  <CartesianGrid stroke="#1e1e1e" strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fill: "#888888", fontSize: 12 }} />
                  <YAxis dataKey="branch" type="category" tick={{ fill: "#888888", fontSize: 11 }} width={80} interval={0} />
                  <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.05)', radius: 4 }} content={<CustomChartTooltip />} />
                  <Bar dataKey="count" fill="#60a5fa" name="Count" radius={[0, 6, 6, 0]} />
                  <Bar dataKey="averageScore" fill="#f59e0b" name="Avg Score" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pinned Legend at bottom */}
          <div className="mt-4 flex justify-center gap-6 font-['JetBrains_Mono'] text-[10px] sm:text-xs">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-[#60a5fa]"></div>
              <span className="text-[#888888]">Count</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-[#f59e0b]"></div>
              <span className="text-[#888888]">Avg Score</span>
            </div>
          </div>
        </div>

        <div className="rounded border border-[#1e1e1e] bg-[#111111] p-4">
          <h2 className="mb-4 font-['JetBrains_Mono'] text-sm uppercase tracking-wider text-[#888888]">Year-Wise Participation</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearData}>
                <CartesianGrid stroke="#1e1e1e" strokeDasharray="3 3" />
                <XAxis dataKey="year" tick={{ fill: "#888888", fontSize: 12 }} />
                <YAxis tick={{ fill: "#888888", fontSize: 12 }} />
                <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.05)', radius: 4 }} content={<CustomChartTooltip />} />
                <Bar dataKey="count" fill="#60a5fa" name="Students" radius={[6, 6, 0, 0]} />
                <Bar dataKey="averageScore" fill="#f59e0b" name="Avg Score" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pinned Legend at bottom */}
          <div className="mt-4 flex justify-center gap-6 font-['JetBrains_Mono'] text-[10px] sm:text-xs">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-[#60a5fa]"></div>
              <span className="text-[#888888]">Students</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-[#f59e0b]"></div>
              <span className="text-[#888888]">Avg Score</span>
            </div>
          </div>
        </div>
      </div>

      {/* Score Bell Curve */}
      <div className="mb-6">
        <div className="rounded border border-[#1e1e1e] bg-[#111111] p-4">
          <h2 className="mb-4 font-['JetBrains_Mono'] text-sm uppercase tracking-wider text-[#888888]">Score Distribution Curve</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={bellCurveData}>
                <CartesianGrid stroke="#1e1e1e" strokeDasharray="3 3" />
                <XAxis dataKey="score" tick={{ fill: "#888888", fontSize: 11 }} />
                <YAxis tick={{ fill: "#888888", fontSize: 12 }} />
                <Tooltip
                  content={
                    <CustomChartTooltip
                      labelFormatter={(v: any) => `Score: ${v}–${Number(v) + 100}`}
                    />
                  }
                />
                <Area type="monotone" dataKey="students" stroke="#ff8594" fill="#ff8594" fillOpacity={0.25} strokeWidth={2} name="Students" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Students Overall + Top Per Platform */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded border border-[#1e1e1e] bg-[#111111] p-4">
          <h2 className="mb-4 flex items-center gap-2 font-['JetBrains_Mono'] text-sm uppercase tracking-wider text-[#888888]">
            <Trophy className="h-4 w-4 text-[#f59e0b]" />
            Top Students (Overall)
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {data.topStudents.map((student, i) => (
              <Link
                key={student.rollno}
                to={`/student/${student.rollno}`}
                className="flex items-center gap-3 rounded border border-[#1e1e1e] bg-[#0f0f0f] p-3 transition-colors hover:border-[#333333]"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1e1e1e] font-['JetBrains_Mono'] text-xs text-[#f59e0b]">
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">{student.name}</div>
                  <div className="font-['JetBrains_Mono'] text-xs text-[#666666]">{student.rollno}</div>
                </div>
                <div className="text-right">
                  <div className="font-['JetBrains_Mono'] text-sm text-[#f59e0b]">{student.totalScore}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded border border-[#1e1e1e] bg-[#111111] p-4">
          <h2 className="mb-4 flex items-center gap-2 font-['JetBrains_Mono'] text-sm uppercase tracking-wider text-[#888888]">
            <Crown className="h-4 w-4 text-[#ff8594]" />
            Top Per Platform
          </h2>
          <div className="grid gap-2">
            {data.topPerPlatform.map((item) =>
              item.student ? (
                <Link
                  key={item.platform}
                  to={`/student/${item.student.rollno}`}
                  className="flex items-center gap-3 rounded border border-[#1e1e1e] bg-[#0f0f0f] p-3 transition-colors hover:border-[#333333]"
                >
                  <span style={{ color: platformColors[item.platform] }}>{platformIcons[item.platform]}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{item.student.name}</div>
                    <div className="font-['JetBrains_Mono'] text-xs text-[#666666]">{item.student.rollno}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-['JetBrains_Mono'] text-sm" style={{ color: platformColors[item.platform] }}>
                      {item.student.score}
                    </div>
                    <div className="text-xs text-[#666666]">{item.platform} score</div>
                  </div>
                </Link>
              ) : null
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
