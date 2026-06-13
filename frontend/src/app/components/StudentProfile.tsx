import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link, useParams, Navigate } from "react-router";
import { ArrowLeft, Edit3, X, Save, History, Clock, Share2, Plus, UserPlus, Trophy, Check, Loader2, GraduationCap } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { platforms, type Platform } from "../mockData";
import { fetchStudent, fetchStudentHistory, updateUsernames as apiUpdateUsernames, restoreUsernames as apiRestoreUsernames, fetchHeatmap, validatePlatformUsername, fetchStudentResults, type StudentResults } from "../api";
import { GithubIcon, LeetcodeIcon, CodeforcesIcon, CodechefIcon, GfgIcon } from "./PlatformIcons";
import { Heatmap, CombinedHeatmap } from "./Heatmap";
import { platformColors, CustomChartTooltip, useChartFocus, formatChartDate } from "./ChartUtils";

export function StudentProfile() {
  const { rollNo } = useParams<{ rollNo: string }>();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [scoreHistory, setScoreHistory] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<Record<string, Record<string, number>>>({});
  const [resultsData, setResultsData] = useState<StudentResults | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [editCooldown, setEditCooldown] = useState<number | null>(null); // hours remaining
  const [updateSuccess, setUpdateSuccess] = useState<{ name: string; ranks: any; scores: any } | null>(null);
  const [editData, setEditData] = useState({
    github: "",
    leetcode: "",
    codeforces: "",
    codechef: "",
    gfg: "",
  });
  const { 
    activeLine: activeScoreLine, 
    handleLegendClick: handleScoreLegendClick,
    legendFormatter: scoreLegendFormatter
  } = useChartFocus();
  const { 
    activeLine: activeRankLine, 
    handleLegendClick: handleRankLegendClick,
    legendFormatter: rankLegendFormatter 
  } = useChartFocus();
  const editSectionRef = useRef<HTMLDivElement>(null);

  // Platform validation state (like Register)
  const [platformValidation, setPlatformValidation] = useState<
    Record<string, { status: "idle" | "validating" | "valid" | "invalid"; stats?: Record<string, any> }>
  >({});
  const validationTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const validatePlatform = useCallback((platform: Platform, username: string) => {
    if (validationTimers.current[platform]) {
      clearTimeout(validationTimers.current[platform]);
    }
    if (!username.trim()) {
      setPlatformValidation((prev) => ({ ...prev, [platform]: { status: "idle" } }));
      return;
    }
    setPlatformValidation((prev) => ({ ...prev, [platform]: { status: "validating" } }));
    validationTimers.current[platform] = setTimeout(async () => {
      try {
        const result = await validatePlatformUsername(platform, username);
        setPlatformValidation((prev) => ({
          ...prev,
          [platform]: result.valid
            ? { status: "valid", stats: result.stats || undefined }
            : { status: "invalid" },
        }));
      } catch {
        setPlatformValidation((prev) => ({ ...prev, [platform]: { status: "invalid" } }));
      }
    }, 600);
  }, []);

  // Block save if any filled username is invalid or still validating
  const hasInvalidPlatform = platforms.some((p) => {
    const username = editData[p].trim();
    if (!username) return false;
    const v = platformValidation[p];
    return !v || v.status !== "valid";
  });

  const startEditing = () => {
    setIsEditing(true);
    setPlatformValidation({});
    setTimeout(() => {
      editSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  // Fetch student data
  useEffect(() => {
    if (!rollNo) return;
    setLoading(true);
    fetchStudent(rollNo)
      .then((data) => {
        setStudent(data);
        setEditData({
          github: "",
          leetcode: "",
          codeforces: "",
          codechef: "",
          gfg: "",
        });
        // Calculate cooldown
        if (data.lastEditedAt) {
          const elapsed = Date.now() - new Date(data.lastEditedAt).getTime();
          const cooldownMs = 24 * 60 * 60 * 1000;
          if (elapsed < cooldownMs) {
            setEditCooldown(Math.ceil((cooldownMs - elapsed) / 3600000));
          }
        }
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [rollNo]);

  // Fetch score history
  useEffect(() => {
    if (!rollNo) return;
    fetchStudentHistory(rollNo, 30)
      .then((data) => {
        setScoreHistory(
          data.snapshots.map((s: any) => ({
            date: s.date?.split("T")[0] || s.date,
            total: s.scores?.total ?? 0,
            github: s.scores?.github ?? 0,
            leetcode: s.scores?.leetcode ?? 0,
            codeforces: s.scores?.codeforces ?? 0,
            codechef: s.scores?.codechef ?? 0,
            gfg: s.scores?.gfg ?? 0,
            rankOverall: s.ranks?.overall ?? null,
            rankYear: s.ranks?.yearWise ?? null,
            rankBranch: s.ranks?.branchWise ?? null,
          }))
        );
      })
      .catch(() => { });
  }, [rollNo]);

  // Fetch heatmap data
  useEffect(() => {
    if (!rollNo) return;
    fetchHeatmap(rollNo)
      .then((data) => setHeatmapData(data))
      .catch(() => { });
  }, [rollNo]);

  // Fetch results (CGPA) data
  useEffect(() => {
    if (!rollNo) return;
    setResultsLoading(true);
    fetchStudentResults(rollNo)
      .then((data) => setResultsData(data))
      .catch(() => setResultsData(null))
      .finally(() => setResultsLoading(false));
  }, [rollNo]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 text-center text-[#888888]">
        Loading...
      </div>
    );
  }

  if (notFound || !student) {
    return <Navigate to="/" replace />;
  }



  const handleShare = () => {
    const url = window.location.href;
    const text = `Check out ${student.name}'s coding profile on CodeOvertake — ranked #${student.ranks?.overall ?? "??"}!`;
    if (navigator.share) {
      navigator.share({ title: "CodeOvertake Profile", text, url }).catch(() => { });
    } else {
      navigator.clipboard.writeText(url);
      alert("Profile link copied!");
    }
  };

  const getPlatformIcon = (platform: Platform) => {
    switch (platform) {
      case "github":
        return <GithubIcon />;
      case "leetcode":
        return <LeetcodeIcon />;
      case "codeforces":
        return <CodeforcesIcon />;
      case "codechef":
        return <CodechefIcon />;
      case "gfg":
        return <GfgIcon />;
    }
  };

  const getPlatformPrefix = (platform: Platform) => {
    switch (platform) {
      case "github":
        return "https://github.com/";
      case "leetcode":
        return "https://leetcode.com/";
      case "codeforces":
        return "https://codeforces.com/profile/";
      case "codechef":
        return "https://www.codechef.com/users/";
      case "gfg":
        return "https://auth.geeksforgeeks.org/user/";
    }
  };

  const extractUsername = (platform: Platform, value: string) => {
    const prefix = getPlatformPrefix(platform);
    if (value.startsWith(prefix)) {
      return value.slice(prefix.length).split("/")[0];
    }
    if (value.startsWith("http://") || value.startsWith("https://")) {
      const parts = value.split("/");
      return parts[parts.length - 1] || parts[parts.length - 2] || "";
    }
    return value;
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError("");
    try {
      // Only send non-empty usernames (empty = no change, not "clear")
      const payload: Record<string, string> = {};
      for (const [key, value] of Object.entries(editData)) {
        if (value.trim()) payload[key] = value.trim();
      }
      if (Object.keys(payload).length === 0) {
        setSaveError("No changes to save");
        setIsSaving(false);
        return;
      }
      const result = await apiUpdateUsernames(student.rollno, payload);
      setStudent(result.student);
      setIsEditing(false);
      // Set 24-hour cooldown
      setEditCooldown(24);
      setUpdateSuccess({
        name: result.student.name,
        ranks: result.student.ranks,
        scores: result.student.scores,
      });
    } catch (err: any) {
      setSaveError(err.message || "Failed to save");
    }
    setIsSaving(false);
  };

  const handleRestore = async (entry: any, idx: number) => {
    if (editCooldown !== null && editCooldown > 0) {
      return;
    }
    try {
      const result = await apiRestoreUsernames(student.rollno, idx);
      setStudent(result.student);
      setEditData({
        github: "",
        leetcode: "",
        codeforces: "",
        codechef: "",
        gfg: "",
      });
      setShowHistory(false);
      setEditCooldown(24);
    } catch (err: any) {
      setSaveError(err.message || "Failed to restore");
    }
  };

  if (updateSuccess) {
    return (
      <div className="mx-auto max-w-2xl overflow-x-hidden px-3 py-10 sm:px-6 sm:py-16 lg:px-8">
        <div className="space-y-6 text-center sm:space-y-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#1e1e1e] bg-[#111111] sm:h-20 sm:w-20">
            <Trophy className="h-8 w-8 text-yellow-500 sm:h-10 sm:w-10" />
          </div>
          <div>
            <h1 className="mb-2 font-['JetBrains_Mono'] text-2xl tracking-tight sm:text-3xl">Updated!</h1>
            <p className="text-sm text-[#888888]">{updateSuccess.name}&apos;s scores have been recalculated</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="rounded border border-[#1e1e1e] bg-[#111111] p-3 sm:p-4">
              <div className="font-['JetBrains_Mono'] text-lg sm:text-2xl">#{updateSuccess.ranks?.overall ?? "??"}</div>
              <div className="mt-0.5 text-[10px] text-[#888888] sm:mt-1 sm:text-xs">Overall Rank</div>
            </div>
            <div className="rounded border border-[#1e1e1e] bg-[#111111] p-3 sm:p-4">
              <div className="font-['JetBrains_Mono'] text-lg sm:text-2xl">#{updateSuccess.ranks?.yearWise ?? "??"}</div>
              <div className="mt-0.5 text-[10px] text-[#888888] sm:mt-1 sm:text-xs">Year Rank</div>
            </div>
            <div className="rounded border border-[#1e1e1e] bg-[#111111] p-3 sm:p-4">
              <div className="font-['JetBrains_Mono'] text-lg sm:text-2xl">#{updateSuccess.ranks?.branchWise ?? "??"}</div>
              <div className="mt-0.5 text-[10px] text-[#888888] sm:mt-1 sm:text-xs">Branch Rank</div>
            </div>
          </div>
          <div className="font-['JetBrains_Mono'] text-sm text-[#888888]">
            Total Score: <span className="text-lg text-[#4ade80]">{updateSuccess.scores?.total ?? 0}</span>
          </div>
          <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
            <button
              onClick={() => setUpdateSuccess(null)}
              className="flex items-center justify-center gap-2 rounded bg-[#4ade80] px-6 py-2.5 font-['Archivo'] text-sm text-[#0a0a0a] transition-opacity hover:opacity-90"
            >
              Back to Profile
            </button>
            <Link
              to="/"
              className="flex items-center justify-center gap-2 rounded border border-[#1e1e1e] px-6 py-2.5 font-['Archivo'] text-sm text-[#888888] transition-colors hover:text-white"
            >
              See Leaderboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="mx-auto max-w-6xl overflow-x-hidden px-3 py-6 sm:px-6 sm:py-8 lg:px-8"
    >
      {/* Back Link */}
      <div
      >
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-[#888888] transition-all hover:text-white hover:gap-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Leaderboard
        </Link>
      </div>



      {/* Profile Header Card */}
      <div
        className="mb-6 flex flex-col gap-4 rounded border border-[#1e1e1e] bg-[#111111] p-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6"
      >
        <div className="flex items-center gap-4 sm:gap-5">
          <img
            src={`https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(student.rollno)}`}
            alt={student.name}
            className="h-12 w-12 flex-shrink-0 rounded border border-[#1e1e1e] sm:h-16 sm:w-16"
          />
          <div className="min-w-0">
            <h1 className="mb-1 truncate font-['JetBrains_Mono'] text-xl tracking-tight sm:mb-2 sm:text-3xl">{student.name}</h1>
            <div className="space-y-0.5 text-xs text-[#888888] sm:space-y-1 sm:text-sm">
              <div className="font-['JetBrains_Mono']">{student.rollno}</div>
              <div>
                {student.branch} • {student.year}
              </div>
            </div>
            {/* Platform linked indicators */}
            <div className="mt-2 flex items-center gap-2 sm:mt-3 sm:gap-3">
              {platforms.map((platform) => {
                const linked = student[platform]?.hasUsername;
                if (!linked) return null;
                return (
                  <div
                    key={platform}
                    title={`${platform.charAt(0).toUpperCase() + platform.slice(1)} linked`}
                    className="flex h-7 w-7 items-center justify-center rounded border border-[#1e1e1e] bg-[#111111] text-[#888888] sm:h-8 sm:w-8"
                  >
                    <span className="h-4 w-4">{getPlatformIcon(platform)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between sm:block sm:text-right">
          <div className="flex items-baseline gap-2 sm:mb-1 sm:block">
            <div className="font-['JetBrains_Mono'] text-2xl sm:text-4xl">
              {student.scores?.total ?? 0}
            </div>
            <div className="text-xs text-[#888888] sm:text-sm">Total Score</div>
          </div>
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 rounded border border-[#1e1e1e] bg-[#111111] px-3 py-1.5 text-xs text-[#888888] transition-colors hover:border-[#333333] hover:text-white sm:mt-3"
          >
            <Share2 className="h-3 w-3" />
            Share Profile
          </button>
        </div>
      </div>

      {/* Rankings Row */}
      <div className="mb-6 grid grid-cols-3 gap-2 sm:mb-8 sm:gap-4">
        <div
          className="rounded border border-[#1e1e1e] bg-[#111111] p-3 text-center transition-shadow hover:shadow-lg hover:shadow-white/5 sm:p-4"
        >
          <div className="mb-0.5 font-['JetBrains_Mono'] text-lg sm:mb-1 sm:text-2xl">#{student.ranks?.overall ?? "—"}</div>
          <div className="text-[10px] text-[#888888] sm:text-xs">Overall Rank</div>
        </div>
        <div
          className="rounded border border-[#1e1e1e] bg-[#111111] p-3 text-center transition-shadow hover:shadow-lg hover:shadow-white/5 sm:p-4"
        >
          <div className="mb-0.5 font-['JetBrains_Mono'] text-lg sm:mb-1 sm:text-2xl">#{student.ranks?.yearWise ?? "—"}</div>
          <div className="text-[10px] text-[#888888] sm:text-xs">Year Rank</div>
        </div>
        <div
          className="rounded border border-[#1e1e1e] bg-[#111111] p-3 text-center transition-shadow hover:shadow-lg hover:shadow-white/5 sm:p-4"
        >
          <div className="mb-0.5 font-['JetBrains_Mono'] text-lg sm:mb-1 sm:text-2xl">#{student.ranks?.branchWise ?? "—"}</div>
          <div className="text-[10px] text-[#888888] sm:text-xs">Branch Rank</div>
        </div>
      </div>

      {/* Platform Stats Cards */}
      <div className="mb-6 grid gap-3 sm:mb-8 sm:grid-cols-2 sm:gap-4">
        {platforms.map((platform, idx) => {
          const platformData = student[platform];
          const hasData = platformData?.hasUsername;
          const data = platformData?.stats;
          const score = student.scores?.[platform] ?? 0;
          const label = platform.charAt(0).toUpperCase() + platform.slice(1);

          return (
            <div
              key={platform}
              className="rounded border border-[#1e1e1e] bg-[#111111] p-4 transition-shadow hover:shadow-lg hover:shadow-white/5 sm:p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="h-5 w-5"
                  >
                    {getPlatformIcon(platform)}
                  </div>
                  <h3 className="font-['JetBrains_Mono'] text-lg">{label}</h3>
                </div>
                {hasData && (
                  <div className="font-['JetBrains_Mono'] text-xl">{score}</div>
                )}
              </div>

              {hasData ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-['JetBrains_Mono'] text-sm text-[#4ade80]">
                    Linked
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {platform === "github" && data && (
                      <>
                        <div>
                          <div className="text-[#666666]">Repos</div>
                          <div className="font-['JetBrains_Mono']">{data.publicRepos ?? 0}</div>
                        </div>
                        <div>
                          <div className="text-[#666666]">Stars</div>
                          <div className="font-['JetBrains_Mono']">{data.totalStars ?? 0}</div>
                        </div>
                        <div>
                          <div className="text-[#666666]">Followers</div>
                          <div className="font-['JetBrains_Mono']">{data.followers ?? 0}</div>
                        </div>
                        <div>
                          <div className="text-[#666666]">Contributions</div>
                          <div className="font-['JetBrains_Mono']">{data.contributions ?? 0}</div>
                        </div>
                      </>
                    )}
                    {platform === "leetcode" && data && (
                      <>
                        <div>
                          <div className="text-[#666666]">Total Solved</div>
                          <div className="font-['JetBrains_Mono']">{data.totalSolved ?? 0}</div>
                        </div>
                        <div>
                          <div className="text-[#666666]">Easy</div>
                          <div className="font-['JetBrains_Mono']">{data.easySolved ?? 0}</div>
                        </div>
                        <div>
                          <div className="text-[#666666]">Medium</div>
                          <div className="font-['JetBrains_Mono']">{data.mediumSolved ?? 0}</div>
                        </div>
                        <div>
                          <div className="text-[#666666]">Hard</div>
                          <div className="font-['JetBrains_Mono']">{data.hardSolved ?? 0}</div>
                        </div>
                        <div>
                          <div className="text-[#666666]">Contest Rating</div>
                          <div className="font-['JetBrains_Mono']">{data.contestRating ?? 0}</div>
                        </div>
                      </>
                    )}
                    {platform === "codeforces" && data && (
                      <>
                        <div>
                          <div className="text-[#666666]">Rating</div>
                          <div className="font-['JetBrains_Mono']">{data.rating ?? 0}</div>
                        </div>
                        <div>
                          <div className="text-[#666666]">Max Rating</div>
                          <div className="font-['JetBrains_Mono']">{data.maxRating ?? 0}</div>
                        </div>
                        <div>
                          <div className="text-[#666666]">Rank</div>
                          <div className="font-['JetBrains_Mono']">{data.rank || "—"}</div>
                        </div>
                        <div>
                          <div className="text-[#666666]">Problems Solved</div>
                          <div className="font-['JetBrains_Mono']">{data.problemsSolved ?? 0}</div>
                        </div>
                      </>
                    )}
                    {platform === "codechef" && data && (
                      <>
                        <div>
                          <div className="text-[#666666]">Current Rating</div>
                          <div className="font-['JetBrains_Mono']">{data.currentRating ?? 0}</div>
                        </div>
                        <div>
                          <div className="text-[#666666]">Highest Rating</div>
                          <div className="font-['JetBrains_Mono']">{data.highestRating ?? 0}</div>
                        </div>
                        <div>
                          <div className="text-[#666666]">Stars</div>
                          <div className="font-['JetBrains_Mono']">{data.stars ?? 0}★</div>
                        </div>
                        <div>
                          <div className="text-[#666666]">Problems Solved</div>
                          <div className="font-['JetBrains_Mono']">{data.totalProblemsSolved ?? 0}</div>
                        </div>
                        {data.globalRank > 0 && (
                          <div>
                            <div className="text-[#666666]">Global Rank</div>
                            <div className="font-['JetBrains_Mono']">{data.globalRank}</div>
                          </div>
                        )}
                        {data.countryRank > 0 && (
                          <div>
                            <div className="text-[#666666]">Country Rank</div>
                            <div className="font-['JetBrains_Mono']">{data.countryRank}</div>
                          </div>
                        )}
                      </>
                    )}
                    {platform === "gfg" && data && (
                      <>
                        <div>
                          <div className="text-[#666666]">Total Solved</div>
                          <div className="font-['JetBrains_Mono']">{data.totalSolved ?? 0}</div>
                        </div>
                        <div>
                          <div className="text-[#666666]">Easy</div>
                          <div className="font-['JetBrains_Mono']">{data.easySolved ?? 0}</div>
                        </div>
                        <div>
                          <div className="text-[#666666]">Medium</div>
                          <div className="font-['JetBrains_Mono']">{data.mediumSolved ?? 0}</div>
                        </div>
                        <div>
                          <div className="text-[#666666]">Hard</div>
                          <div className="font-['JetBrains_Mono']">{data.hardSolved ?? 0}</div>
                        </div>
                        <div>
                          <div className="text-[#666666]">Monthly Score</div>
                          <div className="font-['JetBrains_Mono']">{data.monthlyScore ?? 0}</div>
                        </div>
                        <div>
                          <div className="text-[#666666]">Institute Rank</div>
                          <div className="font-['JetBrains_Mono']">{data.instituteRank ?? 0}</div>
                        </div>
                        <div>
                          <div className="text-[#666666]">Streak</div>
                          <div className="font-['JetBrains_Mono']">{data.streak ?? 0}</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#666666]">Not linked</span>
                  <button
                    onClick={startEditing}
                    className="flex items-center gap-1.5 text-xs text-[#888888] transition-colors hover:text-white"
                  >
                    <Plus className="h-3 w-3" />
                    Add username
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Results Card (CGPA) */}
      {resultsLoading ? (
        <div className="mb-6 flex items-center justify-center rounded border border-[#1e1e1e] bg-[#111111] p-6 sm:mb-8">
          <Loader2 className="h-5 w-5 animate-spin text-[#888888]" />
          <span className="ml-2 text-sm text-[#888888]">Loading results...</span>
        </div>
      ) : resultsData ? (
        <div className="mb-6 rounded border border-[#1e1e1e] bg-[#111111] p-4 sm:mb-8 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <GraduationCap className="h-5 w-5 text-[#4ade80]" />
            <h3 className="font-['JetBrains_Mono'] text-lg">Academic Results</h3>
          </div>

          {/* CGPA and key stats */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <div className="rounded border border-[#1e1e1e] bg-[#0a0a0a] p-3 text-center sm:p-4">
              <div className="font-['JetBrains_Mono'] text-2xl text-[#4ade80] sm:text-3xl">{resultsData.cgpa.toFixed(2)}</div>
              <div className="mt-1 text-[10px] text-[#888888] sm:text-xs">CGPA</div>
            </div>
            <div className="rounded border border-[#1e1e1e] bg-[#0a0a0a] p-3 text-center sm:p-4">
              <div className="font-['JetBrains_Mono'] text-lg sm:text-2xl">#{resultsData.rank}</div>
              <div className="mt-1 text-[10px] text-[#888888] sm:text-xs">College Rank</div>
            </div>
            <div className="rounded border border-[#1e1e1e] bg-[#0a0a0a] p-3 text-center sm:p-4">
              <div className="font-['JetBrains_Mono'] text-lg sm:text-2xl">#{resultsData.branch_rank}</div>
              <div className="mt-1 text-[10px] text-[#888888] sm:text-xs">Branch Rank</div>
            </div>
            <div className="rounded border border-[#1e1e1e] bg-[#0a0a0a] p-3 text-center sm:p-4">
              <div className="font-['JetBrains_Mono'] text-lg sm:text-2xl">{resultsData.percentile.toFixed(1)}%</div>
              <div className="mt-1 text-[10px] text-[#888888] sm:text-xs">Percentile</div>
            </div>
          </div>

          {/* Credits */}
          <div className="mb-4 text-center text-xs text-[#888888]">
            Credits Completed: <span className="font-['JetBrains_Mono'] text-white">{resultsData.credits_completed}</span>
          </div>

          {/* Semester-wise SGPA */}
          {resultsData.semesters && resultsData.semesters.length > 0 && (
            <div>
              <h4 className="mb-3 font-['JetBrains_Mono'] text-xs uppercase tracking-wider text-[#888888]">
                Semester Performance
              </h4>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {resultsData.semesters.map((sem) => (
                  <div
                    key={sem.semester}
                    className="rounded border border-[#1e1e1e] bg-[#0a0a0a] p-3 text-center"
                  >
                    <div className="mb-1 text-[10px] text-[#666666]">Semester {sem.semester}</div>
                    <div className="font-['JetBrains_Mono'] text-lg text-white">{sem.sgpa.toFixed(2)}</div>
                    <div className="mt-1 text-[10px] text-[#888888]">
                      {sem.credits_secured}/{sem.credits_registered} credits
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 text-center text-xs text-[#888888]">
            For detailed academic results, visit{" "}
            <a href="https://resulthubnsut.com" target="_blank" rel="noopener noreferrer" className="text-[#4ade80] underline underline-offset-2 hover:text-[#86efac]">
              resulthubnsut.com
            </a>
          </div>
        </div>
      ) : null}

      {/* Edit Usernames Section */}
      <div
        ref={editSectionRef}
        className="mb-6 rounded border border-[#1e1e1e] bg-[#111111] p-4 sm:mb-8 sm:p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-['JetBrains_Mono'] text-lg">Platform Usernames</h3>
          <div className="flex items-center gap-4">
            {student.usernameHistory && student.usernameHistory.length > 0 && !isEditing && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 text-sm text-[#888888] transition-colors hover:text-white"
              >
                <History className="h-4 w-4" />
                History
              </button>
            )}
            {!isEditing && (
              <div className="flex items-center gap-3">
                {editCooldown !== null && editCooldown > 0 && (
                  <div
                    className="flex items-center gap-1 rounded bg-[#1e1e1e] px-2 py-1 text-xs text-[#888888]"
                  >
                    <Clock className="h-3 w-3" />
                    {editCooldown}h cooldown
                  </div>
                )}
                <button
                  onClick={startEditing}
                  disabled={editCooldown !== null && editCooldown > 0}
                  className="flex items-center gap-2 text-sm text-[#888888] transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit
                </button>
              </div>
            )}
          </div>
        </div>

        {!isEditing ? (
          <div className="font-['JetBrains_Mono'] text-sm text-[#888888]">
            {platforms.map((platform, idx) => {
              const linked = student[platform]?.hasUsername;
              const label = platform.charAt(0).toUpperCase() + platform.slice(1);
              return (
                <span key={platform}>
                  {label}: {linked ? "Linked" : "—"}
                  {idx < platforms.length - 1 && " | "}
                </span>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded border border-[#1e1e1e] bg-[#0a0a0a] p-3 text-xs text-[#888888]">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                Changes trigger a 24-hour edit cooldown
              </div>
            </div>
            {platforms.map((platform) => {
              const label = platform.charAt(0).toUpperCase() + platform.slice(1);
              const prefix = getPlatformPrefix(platform);
              const placeholder = platform === "github" ? "username" : platform === "leetcode" ? "u/username" : "username";
              return (
                <div key={platform}>
                  <label className="mb-2 flex items-center gap-2 text-sm text-[#888888]">
                    <span
                      className="h-4 w-4"
                    >
                      {getPlatformIcon(platform)}
                    </span>
                    {label}
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-['JetBrains_Mono'] text-xs text-[#666666]">
                      {prefix}
                    </div>
                    <input
                      type="text"
                      placeholder={placeholder}
                      value={editData[platform]}
                      onChange={(e) => {
                        const extracted = extractUsername(platform, e.target.value);
                        setEditData({ ...editData, [platform]: extracted });
                        validatePlatform(platform, extracted);
                      }}
                      style={{ paddingLeft: `calc(12px + ${prefix.length}ch)` }}
                      className={`h-10 w-full rounded border bg-[#0a0a0a] pr-10 font-['JetBrains_Mono'] text-xs text-white placeholder-[#555555] outline-none transition-all focus:shadow-lg focus:shadow-white/5 ${platformValidation[platform]?.status === "valid"
                        ? "border-[#4ade80] focus:border-[#4ade80]"
                        : platformValidation[platform]?.status === "invalid"
                          ? "border-[#ff4444] focus:border-[#ff4444]"
                          : "border-[#1e1e1e] focus:border-[#333333]"
                        }`}
                    />
                    {/* Validation indicator */}
                    {editData[platform].trim() && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {platformValidation[platform]?.status === "validating" && (
                          <Loader2 className="h-4 w-4 animate-spin text-[#888888]" />
                        )}
                        {platformValidation[platform]?.status === "valid" && (
                          <Check className="h-4 w-4 text-[#4ade80]" />
                        )}
                        {platformValidation[platform]?.status === "invalid" && (
                          <X className="h-4 w-4 text-[#ff4444]" />
                        )}
                      </div>
                    )}
                  </div>
                  {/* Stats preview */}
                  {platformValidation[platform]?.status === "valid" && platformValidation[platform]?.stats && (
                    <div className="mt-1 rounded border border-[#1e1e1e] bg-[#0a0a0a] p-2 font-['JetBrains_Mono'] text-[10px] text-[#888888]">
                      {Object.entries(platformValidation[platform].stats!).slice(0, 4).map(([k, v]) => (
                        <span key={k} className="mr-3">{k}: <span className="text-white">{String(v)}</span></span>
                      ))}
                    </div>
                  )}
                  {platformValidation[platform]?.status === "invalid" && (
                    <div className="mt-1 text-[10px] text-[#ff4444]">Username not found on {label}</div>
                  )}
                </div>
              );
            })}

            <div className="flex gap-3">
              {saveError && (
                <div className="flex-1 text-sm text-[#ff4444]">{saveError}</div>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving || hasInvalidPlatform}
                className="flex h-10 items-center gap-2 rounded bg-[#4ade80] px-4 text-sm text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setSaveError("");
                  setPlatformValidation({});
                  setEditData({
                    github: "",
                    leetcode: "",
                    codeforces: "",
                    codechef: "",
                    gfg: "",
                  });
                }}
                className="flex h-10 items-center gap-2 rounded border border-[#1e1e1e] px-4 text-sm text-[#888888] transition-colors hover:text-white"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Username History */}
        {showHistory && student.usernameHistory && (
          <div
            className="mt-6 space-y-3 border-t border-[#1e1e1e] pt-6"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-['JetBrains_Mono'] text-sm text-[#888888]">Edit History</h4>
              <span className="text-xs text-[#666666]">Last {student.usernameHistory.length} entries</span>
            </div>
            {student.usernameHistory.map((entry: any, idx: number) => (
              <div
                key={idx}
                className="rounded border border-[#1e1e1e] bg-[#0a0a0a] p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-[#666666]">
                    <Clock className="h-3 w-3" />
                    {entry.changedAt ? new Date(entry.changedAt).toLocaleString() : "—"}
                    {idx === 0 && student.usernameHistory.length > 1 && (
                      <span className="ml-2 rounded bg-[#1e1e1e] px-2 py-0.5 text-[#888888]">(original)</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRestore(entry, idx)}
                    disabled={editCooldown !== null && editCooldown > 0}
                    className="text-xs text-[#888888] transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Restore
                  </button>
                </div>
                <div className="mt-2 font-['JetBrains_Mono'] text-xs text-[#888888]">
                  {(entry.platforms || []).map((p: string, pidx: number) => (
                    <span key={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                      {pidx < (entry.platforms || []).length - 1 && ", "}
                    </span>
                  ))}
                  {(entry.platforms || []).length > 0 ? " updated" : "No changes"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Score History Chart */}
      {scoreHistory.length >= 1 && (
        <div
          className="rounded border border-[#1e1e1e] bg-[#111111] p-6"
        >
          <h3 className="mb-6 font-['JetBrains_Mono'] text-lg">Score History (Last 30 Days)</h3>
          {scoreHistory.length === 1 ? (
            <div className="text-center font-['Archivo'] text-sm text-[#666666] py-8">
              <div className="mb-2 font-['JetBrains_Mono'] text-2xl text-white">{scoreHistory[0].total}</div>
              <div>First snapshot recorded on {new Date(scoreHistory[0].date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
              <div className="mt-1 text-xs">Graph will appear once more data points are collected.</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={scoreHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                <XAxis
                  dataKey="date"
                  stroke="#888888"
                  style={{ fontSize: "12px", fontFamily: "JetBrains Mono" }}
                  tickFormatter={(d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                />
                <YAxis stroke="#888888" style={{ fontSize: "12px", fontFamily: "JetBrains Mono" }} />
                <Tooltip
                  content={<CustomChartTooltip activeLine={activeScoreLine} labelFormatter={formatChartDate} />}
                />
                <Legend
                  wrapperStyle={{
                    fontFamily: "JetBrains Mono",
                    fontSize: "12px",
                  }}
                  onClick={handleScoreLegendClick}
                  formatter={scoreLegendFormatter}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#ffffff"
                  strokeWidth={2}
                  name="Total"
                  dot={false}
                  activeDot={!activeScoreLine || activeScoreLine === "total"}
                  strokeOpacity={activeScoreLine && activeScoreLine !== "total" ? 0.1 : 1}
                  style={{ transition: "stroke-opacity 0.2s ease-in-out" }}
                />
                <Line
                  type="monotone"
                  dataKey="github"
                  stroke={platformColors.github}
                  strokeWidth={1.5}
                  name="GitHub"
                  dot={false}
                  activeDot={(!activeScoreLine || activeScoreLine === "github") ? { r: 3 } : false}
                  strokeOpacity={activeScoreLine && activeScoreLine !== "github" ? 0.1 : 1}
                  style={{ transition: "stroke-opacity 0.2s ease-in-out" }}
                />
                <Line
                  type="monotone"
                  dataKey="leetcode"
                  stroke={platformColors.leetcode}
                  strokeWidth={1.5}
                  name="LeetCode"
                  dot={false}
                  activeDot={(!activeScoreLine || activeScoreLine === "leetcode") ? { r: 3 } : false}
                  strokeOpacity={activeScoreLine && activeScoreLine !== "leetcode" ? 0.1 : 1}
                  style={{ transition: "stroke-opacity 0.2s ease-in-out" }}
                />
                <Line
                  type="monotone"
                  dataKey="codeforces"
                  stroke={platformColors.codeforces}
                  strokeWidth={1.5}
                  name="Codeforces"
                  dot={false}
                  activeDot={(!activeScoreLine || activeScoreLine === "codeforces") ? { r: 3 } : false}
                  strokeOpacity={activeScoreLine && activeScoreLine !== "codeforces" ? 0.1 : 1}
                  style={{ transition: "stroke-opacity 0.2s ease-in-out" }}
                />
                <Line
                  type="monotone"
                  dataKey="codechef"
                  stroke={platformColors.codechef}
                  strokeWidth={1.5}
                  name="CodeChef"
                  dot={false}
                  activeDot={(!activeScoreLine || activeScoreLine === "codechef") ? { r: 3 } : false}
                  strokeOpacity={activeScoreLine && activeScoreLine !== "codechef" ? 0.1 : 1}
                  style={{ transition: "stroke-opacity 0.2s ease-in-out" }}
                />
                <Line
                  type="monotone"
                  dataKey="gfg"
                  stroke={platformColors.gfg}
                  strokeWidth={1.5}
                  name="GFG"
                  dot={false}
                  activeDot={(!activeScoreLine || activeScoreLine === "gfg") ? { r: 3 } : false}
                  strokeOpacity={activeScoreLine && activeScoreLine !== "gfg" ? 0.1 : 1}
                  style={{ transition: "stroke-opacity 0.2s ease-in-out" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Rank History Chart */}
      {scoreHistory.length >= 2 && scoreHistory.some((s) => s.rankOverall !== null) && (
        <div className="rounded border border-[#1e1e1e] bg-[#111111] p-6">
          <h3 className="mb-6 font-['JetBrains_Mono'] text-lg">Rank History (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={scoreHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
              <XAxis
                dataKey="date"
                stroke="#888888"
                style={{ fontSize: "12px", fontFamily: "JetBrains Mono" }}
                tickFormatter={(d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              />
              <YAxis
                reversed
                stroke="#888888"
                style={{ fontSize: "12px", fontFamily: "JetBrains Mono" }}
                allowDecimals={false}
                tickFormatter={(v) => `#${v}`}
              />
              <Tooltip
                content={<CustomChartTooltip activeLine={activeRankLine} isRank={true} labelFormatter={formatChartDate} />}
              />
              <Legend
                wrapperStyle={{ fontFamily: "JetBrains Mono", fontSize: "12px" }}
                onClick={handleRankLegendClick}
                formatter={rankLegendFormatter}
              />
              <Line
                type="monotone"
                dataKey="rankOverall"
                stroke="#4ade80"
                strokeWidth={2}
                name="Overall"
                dot={false}
                connectNulls
                activeDot={(!activeRankLine || activeRankLine === "rankOverall") ? { r: 4 } : false}
                strokeOpacity={activeRankLine && activeRankLine !== "rankOverall" ? 0.1 : 1}
                style={{ transition: "stroke-opacity 0.2s ease-in-out" }}
              />
              <Line
                type="monotone"
                dataKey="rankYear"
                stroke="#60a5fa"
                strokeWidth={1.5}
                name="Year"
                dot={false}
                connectNulls
                activeDot={(!activeRankLine || activeRankLine === "rankYear") ? { r: 3 } : false}
                strokeOpacity={activeRankLine && activeRankLine !== "rankYear" ? 0.1 : 1}
                style={{ transition: "stroke-opacity 0.2s ease-in-out" }}
              />
              <Line
                type="monotone"
                dataKey="rankBranch"
                stroke="#f472b6"
                strokeWidth={1.5}
                name="Branch"
                dot={false}
                connectNulls
                activeDot={(!activeRankLine || activeRankLine === "rankBranch") ? { r: 3 } : false}
                strokeOpacity={activeRankLine && activeRankLine !== "rankBranch" ? 0.1 : 1}
                style={{ transition: "stroke-opacity 0.2s ease-in-out" }}
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="mt-3 text-center font-['JetBrains_Mono'] text-xs text-[#666666]">Lower is better — #1 is top</p>
        </div>
      )}

      {/* Activity Heatmaps */}
      {Object.keys(heatmapData).length > 0 && (
        <div className="mt-6 space-y-4 sm:mt-8">
          <h3 className="font-['JetBrains_Mono'] text-lg">Activity</h3>

          {/* Combined heatmap */}
          <div className="rounded border border-[#1e1e1e] bg-[#111111] p-4 sm:p-6">
            <CombinedHeatmap platformData={heatmapData} />
          </div>

          {/* Momentum Chart */}
          <MomentumChart heatmapData={heatmapData} />

          {/* Per-platform heatmaps */}
          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-3">
            {heatmapData.github && (
              <div className="rounded border border-[#1e1e1e] bg-[#111111] p-3 sm:p-4">
                <Heatmap data={heatmapData.github} label="GitHub" compact color={platformColors.github} />
              </div>
            )}
            {heatmapData.leetcode && (
              <div className="rounded border border-[#1e1e1e] bg-[#111111] p-3 sm:p-4">
                <Heatmap data={heatmapData.leetcode} label="LeetCode" compact color={platformColors.leetcode} />
              </div>
            )}
            {heatmapData.codeforces && (
              <div className="rounded border border-[#1e1e1e] bg-[#111111] p-3 sm:p-4">
                <Heatmap data={heatmapData.codeforces} label="Codeforces" compact color={platformColors.codeforces} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Social / Viral Section */}
      <div className="mt-6 flex flex-col gap-3 rounded border border-[#1e1e1e] bg-[#111111] p-4 sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5">
        <div className="space-y-1">
          <div className="text-sm">Challenge your friends</div>
          <div className="text-xs text-[#666666]">Know someone missing? Add them to the leaderboard.</div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/register"
            className="flex items-center gap-2 rounded border border-[#1e1e1e] px-4 py-2 text-xs text-[#888888] transition-colors hover:border-[#333333] hover:text-white"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Add Someone
          </Link>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 rounded bg-[#4ade80] px-4 py-2 text-xs text-[#0a0a0a] transition-opacity hover:opacity-90"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share Profile
          </button>
        </div>
      </div>
    </div>
  );
}

function MomentumChart({ heatmapData }: { heatmapData: Record<string, Record<string, number>> }) {
  const { activeLine, handleLegendClick, legendFormatter } = useChartFocus();

  const chartData = useMemo(() => {
    // Merge all platforms into one date→count map, and keep per-platform too
    const merged: Record<string, number> = {};
    const perPlatform: Record<string, Record<string, number>> = {};
    for (const [platform, data] of Object.entries(heatmapData)) {
      perPlatform[platform] = {};
      for (const [date, count] of Object.entries(data)) {
        merged[date] = (merged[date] || 0) + count;
        perPlatform[platform][date] = (perPlatform[platform][date] || 0) + count;
      }
    }
    const dates = Object.keys(merged).sort();
    if (dates.length === 0) return [];

    const start = new Date(dates[0]);
    const end = new Date(dates[dates.length - 1]);
    const allDates: string[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      allDates.push(d.toISOString().slice(0, 10));
    }

    const windowDays = 7;
    const sums: Record<string, number> = { total: 0 };
    const platformKeys = Object.keys(perPlatform);
    for (const k of platformKeys) sums[k] = 0;

    const result: Record<string, any>[] = [];
    for (let i = 0; i < allDates.length; i++) {
      const date = allDates[i];
      sums.total += merged[date] || 0;
      for (const k of platformKeys) sums[k] += perPlatform[k]?.[date] || 0;
      if (i >= windowDays) {
        const prev = allDates[i - windowDays];
        sums.total -= merged[prev] || 0;
        for (const k of platformKeys) sums[k] -= perPlatform[k]?.[prev] || 0;
      }
      if (i >= windowDays - 1 && i % 7 === 0) {
        const row: Record<string, any> = { date, total: sums.total };
        for (const k of platformKeys) row[k] = sums[k];
        result.push(row);
      }
    }
    return result;
  }, [heatmapData]);

  if (chartData.length === 0) return null;

  const platformKeys = Object.keys(heatmapData);

  return (
    <div className="rounded border border-[#1e1e1e] bg-[#111111] p-4 sm:p-6">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-['JetBrains_Mono'] text-xs text-[#888888]">Momentum</span>
        <span className="font-['JetBrains_Mono'] text-[10px] text-[#666666]">7-day rolling activity</span>
      </div>
      <div className="h-56 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#888888" }}
              tickFormatter={(d: string) => {
                const dt = new Date(d);
                return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
              }}
              interval="preserveStartEnd"
              minTickGap={40}
              stroke="#333333"
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#888888" }}
              stroke="#333333"
              allowDecimals={false}
            />
            <Tooltip
              content={<CustomChartTooltip activeLine={activeLine} labelFormatter={formatChartDate} />}
            />
            <Legend
              wrapperStyle={{ fontSize: "12px", fontFamily: "JetBrains Mono" }}
              onClick={handleLegendClick}
              formatter={legendFormatter}
            />
            <Line
              type="monotone"
              dataKey="total"
              name="Total"
              stroke="#ffffff"
              strokeWidth={2}
              dot={false}
              activeDot={(!activeLine || activeLine === "total") ? { r: 4 } : false}
              strokeOpacity={activeLine && activeLine !== "total" ? 0.1 : 1}
              style={{ transition: "stroke-opacity 0.2s ease-in-out" }}
            />
            {platformKeys.map((key) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={key.charAt(0).toUpperCase() + key.slice(1)}
                stroke={platformColors[key] || "#888888"}
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="4 2"
                activeDot={(!activeLine || activeLine === key) ? { r: 3 } : false}
                strokeOpacity={activeLine && activeLine !== key ? 0.1 : 1}
                style={{ transition: "stroke-opacity 0.2s ease-in-out" }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
