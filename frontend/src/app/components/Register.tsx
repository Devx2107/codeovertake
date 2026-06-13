import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router";
import { AlertCircle, ArrowLeft, Search, UserPlus, Eye, Trophy, GitBranch, BarChart3, Users, CheckCircle2, XCircle, Loader2, Zap, Flame, Target, ChevronDown } from "lucide-react";
import { platforms, type Platform } from "../mockData";
import { searchStudents as apiSearchStudents, registerStudent as apiRegisterStudent, validatePlatformUsername } from "../api";
import { GithubIcon, LeetcodeIcon, CodeforcesIcon, CodechefIcon, GfgIcon } from "./PlatformIcons";

type Step = "search" | "form";

interface FormData {
  rollNo: string;
  name: string;
  branch: string;
  year: string;
  github: string;
  leetcode: string;
  codeforces: string;
  codechef: string;
  gfg: string;
}

interface SearchResult {
  rollNo: string;
  name: string;
  branch: string;
  year: number;
  isRegistered: boolean;
}

export function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    rollNo: "",
    name: "",
    branch: "",
    year: "",
    github: "",
    leetcode: "",
    codeforces: "",
    codechef: "",
    gfg: "",
  });
  const [autoFilled, setAutoFilled] = useState(false);
  const [successData, setSuccessData] = useState<{ rollno: string; name: string; ranks: any; scores: any } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [branches, setBranches] = useState<{ branchName: string; shortName: string }[]>([]);

  // Fetch branches on mount
  useEffect(() => {
    fetch("https://api.sujal.info/api/nsut/branches")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data)) setBranches(d.data);
      })
      .catch(() => {});
  }, []);

  // Platform validation state
  const [platformValidation, setPlatformValidation] = useState<
    Record<string, { status: "idle" | "validating" | "valid" | "invalid"; stats?: Record<string, any> }>
  >({});
  const validationTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const validatePlatform = useCallback((platform: Platform, username: string) => {
    // Clear previous timer
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

  // Check if any filled platform username is invalid (block submit)
  const hasInvalidPlatform = platforms.some((p) => {
    const username = formData[p].trim();
    if (!username) return false;
    const v = platformValidation[p];
    return !v || v.status !== "valid";
  });

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const data = await apiSearchStudents(searchQuery);
        setSearchResults(
          data.results.map((r) => ({
            rollNo: r.rollno,
            name: r.name,
            branch: r.branch,
            year: r.year,
            isRegistered: r.exists,
          }))
        );
      } catch {
        setSearchResults([]);
      }
      setIsSearching(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectStudent = (result: SearchResult) => {
    if (result.isRegistered) {
      navigate(`/student/${result.rollNo}`);
    } else {
      setFormData({
        rollNo: result.rollNo,
        name: result.name,
        branch: result.branch,
        year: String(result.year),
        github: "",
        leetcode: "",
        codeforces: "",
        codechef: "",
        gfg: "",
      });
      setAutoFilled(true);
      setStep("form");
    }
  };

  const handleEnterManually = () => {
    setFormData({
      rollNo: "",
      name: "",
      branch: "",
      year: "",
      github: "",
      leetcode: "",
      codeforces: "",
      codechef: "",
      gfg: "",
    });
    setAutoFilled(false);
    setStep("form");
  };

  const handleTryAsRollNumber = () => {
    if (/^\d{4}[A-Z]{3}\d{4}$/i.test(searchQuery)) {
      setFormData({
        rollNo: searchQuery.toUpperCase(),
        name: "",
        branch: "",
        year: "",
      github: "",
      leetcode: "",
      codeforces: "",
      codechef: "",
      gfg: "",
    });
      setAutoFilled(false);
      setStep("form");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const result = await apiRegisterStudent({
        rollno: formData.rollNo,
        name: formData.name,
        branch: formData.branch,
        year: formData.year,
        github: formData.github || undefined,
        leetcode: formData.leetcode || undefined,
        codeforces: formData.codeforces || undefined,
        codechef: formData.codechef || undefined,
        gfg: formData.gfg || undefined,
      });
      setIsSubmitting(false);
      setSuccessData({
        rollno: result.student.rollno,
        name: result.student.name,
        ranks: result.student.ranks,
        scores: result.student.scores,
      });
    } catch (err: any) {
      setIsSubmitting(false);
      if (err.errors && Array.isArray(err.errors)) {
        const errs: Record<string, string> = {};
        for (const e of err.errors) {
          errs[e.field] = e.message;
        }
        setFieldErrors(errs);
      } else {
        setError(err.message || "Registration failed");
      }
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
        return "https://leetcode.com/u/";
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

  // Success modal
  if (successData) {
    return (
      <div className="mx-auto max-w-2xl overflow-x-hidden px-3 py-10 sm:px-6 sm:py-16 lg:px-8">
        <div className="space-y-6 text-center sm:space-y-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#1e1e1e] bg-[#111111] sm:h-20 sm:w-20">
            <Trophy className="h-8 w-8 text-yellow-500 sm:h-10 sm:w-10" />
          </div>
          <div>
            <h1 className="mb-2 font-['JetBrains_Mono'] text-2xl tracking-tight sm:text-3xl">You&apos;re In!</h1>
            <p className="text-sm text-[#888888]">{successData.name} is now on the leaderboard</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="rounded border border-[#1e1e1e] bg-[#111111] p-3 sm:p-4">
              <div className="font-['JetBrains_Mono'] text-lg sm:text-2xl">#{successData.ranks?.overall ?? "??"}</div>
              <div className="mt-0.5 text-[10px] text-[#888888] sm:mt-1 sm:text-xs">Overall Rank</div>
            </div>
            <div className="rounded border border-[#1e1e1e] bg-[#111111] p-3 sm:p-4">
              <div className="font-['JetBrains_Mono'] text-lg sm:text-2xl">#{successData.ranks?.yearWise ?? "??"}</div>
              <div className="mt-0.5 text-[10px] text-[#888888] sm:mt-1 sm:text-xs">Year Rank</div>
            </div>
            <div className="rounded border border-[#1e1e1e] bg-[#111111] p-3 sm:p-4">
              <div className="font-['JetBrains_Mono'] text-lg sm:text-2xl">#{successData.ranks?.branchWise ?? "??"}</div>
              <div className="mt-0.5 text-[10px] text-[#888888] sm:mt-1 sm:text-xs">Branch Rank</div>
            </div>
          </div>
          <div className="font-['JetBrains_Mono'] text-sm text-[#888888]">
            Total Score: <span className="text-[#4ade80] text-lg">{successData.scores?.total ?? 0}</span>
          </div>
          <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              to={`/student/${successData.rollno}`}
              className="flex items-center gap-2 rounded bg-[#4ade80] px-6 py-2.5 font-['Archivo'] text-sm text-[#0a0a0a] transition-opacity hover:opacity-90"
            >
              View Full Profile
            </Link>
            <Link
              to="/"
              className="flex items-center gap-2 rounded border border-[#1e1e1e] px-6 py-2.5 font-['Archivo'] text-sm text-[#888888] transition-colors hover:text-white"
            >
              See Leaderboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl overflow-x-hidden px-3 py-8 sm:px-6 sm:py-12 lg:px-8">
      {step === "search" ? (
        <div>
          <h1 className="mb-2 font-['JetBrains_Mono'] text-2xl tracking-tight sm:text-3xl">Claim Your<span className="text-[#4ade80]"> Spot</span></h1>
          <p className="mb-6 text-sm text-[#666666] sm:mb-8">Find yourself and get ranked across 5 coding platforms</p>

          <div className="space-y-6">
            <div>
              <label htmlFor="search" className="mb-2 block text-sm text-[#888888]">
                Search by name or roll number
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#888888]" />
                <input
                  id="search"
                  type="text"
                  placeholder="e.g. Arjun Mehta or 2022UIT3042"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 w-full rounded border border-[#1e1e1e] bg-[#111111] pl-10 pr-4 text-white placeholder-[#888888] outline-none transition-colors focus:border-[#333333]"
                />
              </div>
            </div>

            {/* Search Results */}
            {searchQuery ? (
              <div className="space-y-3">
                {isSearching ? (
                  <div className="rounded border border-[#1e1e1e] bg-[#111111] p-4 text-center text-sm text-[#888888]">
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((result) => (
                    <button
                      key={result.rollNo}
                      onClick={() => handleSelectStudent(result)}
                      className="flex w-full items-center justify-between rounded border border-[#1e1e1e] bg-[#111111] p-4 text-left transition-all hover:border-[#333333] hover:bg-[#0f0f0f]"
                    >
                      <div>
                        <div className="font-['Archivo']">{result.name}</div>
                        <div className="mt-1 flex items-center gap-2 text-sm text-[#888888]">
                          <span className="font-['JetBrains_Mono']">{result.rollNo}</span>
                          <span>•</span>
                          <span>{result.branch}</span>
                          <span>•</span>
                          <span>{result.year}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {result.isRegistered ? (
                          <>
                            <Eye className="h-4 w-4" />
                            View Profile
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4" />
                            Claim Spot
                          </>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="space-y-3">
                    <div className="rounded border border-[#1e1e1e] bg-[#111111] p-4 text-center text-sm text-[#888888]">
                      You&apos;re not on the leaderboard yet.
                    </div>
                    <div className="flex gap-3">
                      {/^\d{4}[A-Z]{3}\d{4}$/i.test(searchQuery) && (
                        <button
                          onClick={handleTryAsRollNumber}
                          className="flex-1 rounded border border-[#1e1e1e] bg-[#111111] px-4 py-2 text-sm transition-colors hover:bg-[#0f0f0f]"
                        >
                          Use This Roll Number
                        </button>
                      )}
                      <button
                        onClick={handleEnterManually}
                        className="flex-1 rounded border border-[#1e1e1e] bg-[#111111] px-4 py-2 text-sm transition-colors hover:bg-[#0f0f0f]"
                      >
                        Add Yourself Manually
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Empty state content */
              <div className="space-y-8">
                {/* How it works */}
                <div className="rounded border border-[#1e1e1e] bg-[#111111] p-6">
                  <h2 className="mb-4 font-['JetBrains_Mono'] text-sm uppercase tracking-wider text-[#888888]">How it works</h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-[#1e1e1e] font-['JetBrains_Mono'] text-sm text-[#888888]">1</div>
                      <div>
                        <div className="text-sm font-medium">Search</div>
                        <div className="mt-0.5 text-xs text-[#666666]">Find yourself by name or roll number</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-[#1e1e1e] font-['JetBrains_Mono'] text-sm text-[#888888]">2</div>
                      <div>
                        <div className="text-sm font-medium">Link Profiles</div>
                        <div className="mt-0.5 text-xs text-[#666666]">Add your coding platform usernames</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-[#1e1e1e] font-['JetBrains_Mono'] text-sm text-[#888888]">3</div>
                      <div>
                        <div className="text-sm font-medium">Compete</div>
                        <div className="mt-0.5 text-xs text-[#666666]">Track your rank on the leaderboard</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Supported platforms */}
                <div>
                  <h2 className="mb-3 font-['JetBrains_Mono'] text-sm uppercase tracking-wider text-[#888888]">Supported Platforms</h2>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {[
                      { icon: <GithubIcon />, name: "GitHub", desc: "Contributions" },
                      { icon: <LeetcodeIcon />, name: "LeetCode", desc: "Problems solved" },
                      { icon: <CodeforcesIcon />, name: "Codeforces", desc: "Rating" },
                      { icon: <CodechefIcon />, name: "CodeChef", desc: "Rating" },
                      { icon: <GfgIcon />, name: "GFG", desc: "Problems solved" },
                    ].map((p) => (
                      <div key={p.name} className="flex items-center gap-3 rounded border border-[#1e1e1e] bg-[#111111] p-3">
                        <span className="h-5 w-5 flex-shrink-0">{p.icon}</span>
                        <div>
                          <div className="text-sm">{p.name}</div>
                          <div className="text-xs text-[#666666]">{p.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          <button
            onClick={() => setStep("search")}
            className="mb-6 flex items-center gap-2 text-sm text-[#888888] transition-all hover:text-white hover:gap-3"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="mb-8 font-['JetBrains_Mono'] text-2xl tracking-tight sm:text-3xl">Claim Your Spot</h1>

          {/* Roll Number Display */}
          {formData.rollNo && (
            <div className="mb-6 flex items-center gap-4 rounded border border-[#1e1e1e] bg-[#111111] p-4">
              <div className="flex-1">
                <div className="text-xs text-[#888888]">Roll Number</div>
                <div className="font-['JetBrains_Mono'] text-lg">{formData.rollNo}</div>
              </div>
              <button
                onClick={() => setStep("search")}
                className="text-sm text-[#888888] transition-colors hover:text-white"
              >
                Change
              </button>
            </div>
          )}

          {/* Auto-fill Notice */}
          {autoFilled && (
            <div className="mb-6 rounded border border-[#4ade80]/20 bg-[#4ade80]/10 p-3 text-sm text-[#4ade80]">
              Details fetched from NSUT records
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-8">
            {/* Personal Info Section */}
            <div className="space-y-4">
              <h2 className="font-['JetBrains_Mono'] text-sm uppercase tracking-wider text-[#888888]">
                Personal Information
              </h2>

              {!formData.rollNo && (
                <div>
                  <label htmlFor="rollNo" className="mb-2 block text-sm text-[#888888]">
                    Roll Number
                  </label>
                  <input
                    id="rollNo"
                    type="text"
                    value={formData.rollNo}
                    onChange={(e) => setFormData({ ...formData, rollNo: e.target.value.toUpperCase() })}
                    required
                    className="h-12 w-full rounded border border-[#1e1e1e] bg-[#111111] px-4 font-['JetBrains_Mono'] text-white outline-none transition-colors focus:border-[#333333]"
                  />
                </div>
              )}

              <div>
                <label htmlFor="name" className="mb-2 block text-sm text-[#888888]">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                  readOnly={autoFilled}
                  required
                  className="h-12 w-full rounded border border-[#1e1e1e] bg-[#111111] px-4 text-white outline-none transition-colors focus:border-[#333333] read-only:text-[#888888]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="branch" className="mb-2 block text-sm text-[#888888]">
                    Branch
                  </label>
                  {autoFilled ? (
                    <input
                      id="branch"
                      type="text"
                      value={formData.branch}
                      readOnly
                      className="h-12 w-full rounded border border-[#1e1e1e] bg-[#111111] px-4 text-[#888888] outline-none"
                    />
                  ) : (
                    <div className="relative">
                      <select
                        id="branch"
                        value={formData.branch}
                        onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                        required
                        className="h-12 w-full appearance-none rounded border border-[#1e1e1e] bg-[#111111] px-4 pr-10 text-white outline-none transition-colors focus:border-[#333333]"
                      >
                        <option value="" disabled>Select branch</option>
                        {branches.map((b) => (
                          <option key={b.shortName} value={b.shortName}>
                            {b.shortName} — {b.branchName}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#888888]" />
                    </div>
                  )}
                </div>
                <div>
                  <label htmlFor="year" className="mb-2 block text-sm text-[#888888]">
                    Year
                  </label>
                  {autoFilled ? (
                    <input
                      id="year"
                      type="text"
                      value={formData.year}
                      readOnly
                      className="h-12 w-full rounded border border-[#1e1e1e] bg-[#111111] px-4 text-[#888888] outline-none"
                    />
                  ) : (
                    <div className="relative">
                      <select
                        id="year"
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                        required
                        className="h-12 w-full appearance-none rounded border border-[#1e1e1e] bg-[#111111] px-4 pr-10 text-white outline-none transition-colors focus:border-[#333333]"
                      >
                        <option value="" disabled>Select year</option>
                        <option value="2022">2022</option>
                        <option value="2023">2023</option>
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#888888]" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Platform Usernames Section */}
            <div className="space-y-4">
              <div>
                <h2 className="font-['JetBrains_Mono'] text-sm uppercase tracking-wider text-[#888888]">
                  Platform Usernames
                </h2>
                <p className="mt-1 text-sm text-[#666666]">Link platforms to boost your score • Paste URLs or usernames</p>
                <p className="mt-1.5 text-xs text-yellow-500/80">⚠ Usernames cannot be deleted once added — only updated.</p>
                <div className="mt-3 rounded-lg border border-[#4ade80]/20 bg-[#4ade80]/5 px-4 py-3">
                  <p className="font-['JetBrains_Mono'] text-sm text-[#4ade80]">Your usernames are completely private</p>
                  <p className="mt-1 text-xs text-[#888888]">Only your stats are shown publicly - no one can see your usernames. So go ahead, add them without any worries!</p>
                </div>
              </div>

              {platforms.map((platform) => {
                const label = platform.charAt(0).toUpperCase() + platform.slice(1);
                const fieldError = fieldErrors[platform];
                const prefix = getPlatformPrefix(platform);
                const validation = platformValidation[platform];
                const validationStatus = validation?.status || "idle";

                return (
                  <div key={platform}>
                    <label htmlFor={platform} className="mb-2 flex items-center gap-2 text-sm text-[#888888]">
                      <span className="h-4 w-4">{getPlatformIcon(platform)}</span>
                      {label} Username
                      {validationStatus === "validating" && <Loader2 className="h-3 w-3 animate-spin text-[#888888]" />}
                      {validationStatus === "valid" && <CheckCircle2 className="h-3 w-3 text-[#4ade80]" />}
                      {validationStatus === "invalid" && <XCircle className="h-3 w-3 text-[#ff4444]" />}
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-['JetBrains_Mono'] text-sm text-[#666666]">
                        {prefix}
                      </div>
                      <input
                        id={platform}
                        type="text"
                        placeholder="username"
                        value={formData[platform]}
                        onChange={(e) => {
                          const extracted = extractUsername(platform, e.target.value);
                          setFormData({ ...formData, [platform]: extracted });
                          validatePlatform(platform, extracted);
                        }}
                        style={{ paddingLeft: `calc(12px + ${prefix.length}ch)` }}
                        className={`h-12 w-full rounded border pr-4 font-['JetBrains_Mono'] text-sm text-white placeholder-[#555555] outline-none transition-colors ${
                          fieldError || validationStatus === "invalid"
                            ? "border-[#ff4444] bg-[#ff4444]/5"
                            : validationStatus === "valid"
                            ? "border-[#4ade80]/40 bg-[#4ade80]/5"
                            : "border-[#1e1e1e] bg-[#111111] focus:border-[#333333]"
                        }`}
                      />
                    </div>
                    {validationStatus === "invalid" && (
                      <div className="mt-1 text-xs text-[#ff4444]">
                        {label} account &quot;{formData[platform]}&quot; not found
                      </div>
                    )}
                    {fieldError && validationStatus !== "invalid" && (
                      <div className="mt-1 text-xs text-[#ff4444]">{fieldError}</div>
                    )}
                    {/* Account preview */}
                    {validationStatus === "valid" && validation?.stats && (
                      <div className="mt-2 rounded border border-[#4ade80]/20 bg-[#4ade80]/5 p-3">
                        <div className="mb-1 flex items-center gap-2 text-xs text-[#4ade80]">
                          <CheckCircle2 className="h-3 w-3" />
                          Account verified
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          {platform === "github" && (
                            <>
                              <span className="text-xs text-[#888888]">Repos: <span className="text-white">{validation.stats.publicRepos}</span></span>
                              <span className="text-xs text-[#888888]">Stars: <span className="text-white">{validation.stats.totalStars}</span></span>
                              <span className="text-xs text-[#888888]">Followers: <span className="text-white">{validation.stats.followers}</span></span>
                              <span className="text-xs text-[#888888]">Contributions: <span className="text-white">{validation.stats.contributions}</span></span>
                            </>
                          )}
                          {platform === "leetcode" && (
                            <>
                              <span className="text-xs text-[#888888]">Solved: <span className="text-white">{validation.stats.totalSolved}</span></span>
                              <span className="text-xs text-[#888888]">Easy: <span className="text-white">{validation.stats.easySolved}</span></span>
                              <span className="text-xs text-[#888888]">Medium: <span className="text-white">{validation.stats.mediumSolved}</span></span>
                              <span className="text-xs text-[#888888]">Hard: <span className="text-white">{validation.stats.hardSolved}</span></span>
                              {validation.stats.contestRating > 0 && (
                                <span className="text-xs text-[#888888]">Contest: <span className="text-white">{validation.stats.contestRating}</span></span>
                              )}
                            </>
                          )}
                          {platform === "codeforces" && (
                            <>
                              <span className="text-xs text-[#888888]">Rating: <span className="text-white">{validation.stats.rating}</span></span>
                              <span className="text-xs text-[#888888]">Max: <span className="text-white">{validation.stats.maxRating}</span></span>
                              <span className="text-xs text-[#888888]">Rank: <span className="text-white">{validation.stats.rank}</span></span>
                              <span className="text-xs text-[#888888]">Solved: <span className="text-white">{validation.stats.problemsSolved}</span></span>
                            </>
                          )}
                          {platform === "gfg" && (
                            <>
                              <span className="text-xs text-[#888888]">Total: <span className="text-white">{validation.stats.totalSolved}</span></span>
                              <span className="text-xs text-[#888888]">Easy: <span className="text-white">{validation.stats.easySolved}</span></span>
                              <span className="text-xs text-[#888888]">Medium: <span className="text-white">{validation.stats.mediumSolved}</span></span>
                              <span className="text-xs text-[#888888]">Hard: <span className="text-white">{validation.stats.hardSolved}</span></span>
                              <span className="text-xs text-[#888888]">Score: <span className="text-white">{validation.stats.score}</span></span>
                            </>
                          )}
                          {platform === "codechef" && (
                            <>
                              <span className="text-xs text-[#888888]">Rating: <span className="text-white">{validation.stats.currentRating}</span></span>
                              <span className="text-xs text-[#888888]">Stars: <span className="text-white">{"★".repeat(validation.stats.stars || 0)}</span></span>
                              <span className="text-xs text-[#888888]">Solved: <span className="text-white">{validation.stats.totalProblemsSolved}</span></span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded border border-[#ff4444]/20 bg-[#ff4444]/10 p-3 text-sm text-[#ff4444]">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || hasInvalidPlatform}
              className="h-12 w-full rounded bg-[#4ade80] font-['Archivo'] text-sm font-medium text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Calculating your rank...</span>
              ) : (
                <span className="flex items-center justify-center gap-2"><Target className="h-4 w-4" /> See My Rank</span>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
