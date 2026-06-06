import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useSearchParams } from "react-router";
import { Search, Loader2, ArrowUpRight } from "lucide-react";
import { fetchFilters, fetchTopGainers } from "../api";

const ITEMS_PER_PAGE = 20;

export function DailyLeaderboard() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("search") || "");
  const [selectedYear, setSelectedYear] = useState<number | "all">(() => {
    const y = searchParams.get("year");
    return y ? Number(y) : "all";
  });
  const [selectedBranch, setSelectedBranch] = useState<string>(() => searchParams.get("branch") || "all");
  const [currentPage, setCurrentPage] = useState(1);
  const [students, setStudents] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [, setTotalCount] = useState(0);
  const [initialLoad, setInitialLoad] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filterYears, setFilterYears] = useState<number[]>([]);
  const [filterBranches, setFilterBranches] = useState<string[]>([]);
  const [period, setPeriod] = useState<{ from: string; to: string } | null>(null);
  
  const fetchIdRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Sync filters to URL
  useEffect(() => {
    const params: Record<string, string> = {};
    if (searchQuery) params.search = searchQuery;
    if (selectedYear !== "all") params.year = String(selectedYear);
    if (selectedBranch !== "all") params.branch = selectedBranch;
    setSearchParams(params, { replace: true });
  }, [searchQuery, selectedYear, selectedBranch]);

  // Load filter options
  useEffect(() => {
    fetchFilters().then((data) => {
      setFilterYears(data.years);
      setFilterBranches(data.branches);
    }).catch(() => {});
  }, []);

  // Fetch data
  const loadData = useCallback(async (append = false) => {
    const id = ++fetchIdRef.current;
    if (append) setLoadingMore(true);

    try {
      const page = append ? currentPage : 1;
      const params: any = { page, limit: ITEMS_PER_PAGE };
      if (selectedYear !== "all") params.year = selectedYear;
      if (selectedBranch !== "all") params.branch = selectedBranch;
      if (searchQuery) params.search = searchQuery;

      const result = await fetchTopGainers(params);
      
      if (id !== fetchIdRef.current) return;

      if (append) {
        setStudents((prev) => [...prev, ...result.gainers]);
      } else {
        setStudents(result.gainers);
      }
      // Depending on your API, pagination might be inside a pagination object or directly on result
      setTotalPages(result.pagination?.pages || 1);
      setTotalCount(result.pagination?.total || result.gainers.length);
      setPeriod(result.period);
    } catch {
      if (id !== fetchIdRef.current) return;
      if (!append) {
        setStudents([]);
        setTotalPages(1);
        setTotalCount(0);
      }
    }
    setInitialLoad(false);
    setLoadingMore(false);
  }, [searchQuery, selectedYear, selectedBranch, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
    loadData(false);
  }, [searchQuery, selectedYear, selectedBranch]);

  useEffect(() => {
    if (currentPage > 1) loadData(true);
  }, [currentPage]);

  // Infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && currentPage < totalPages) {
          setCurrentPage((p) => p + 1);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadingMore, currentPage, totalPages]);

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
      
      <Link to="/" className="mb-4 inline-block text-sm text-[#888888] hover:text-white transition-colors">
        ← Back to All-Time Leaderboard
      </Link>

      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:mb-8 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-['JetBrains_Mono'] text-2xl tracking-tight sm:text-3xl">
            Daily <span className="text-[#4ade80]">Gainers</span>
          </h1>
          {period && (
            <div className="mt-2 text-sm text-[#666666]">
              Tracking gains from {period.from} to {period.to}
            </div>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#888888]" />
          <input
            type="text"
            placeholder="Search by name or roll no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded border border-[#1e1e1e] bg-[#111111] pl-10 pr-4 text-sm text-white placeholder-[#888888] outline-none transition-colors focus:border-[#333333]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-4">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="h-10 rounded border border-[#1e1e1e] bg-[#111111] px-3 text-sm text-white outline-none transition-colors focus:border-[#333333] sm:px-4"
          >
            <option value="all">All Years</option>
            {filterYears.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="h-10 rounded border border-[#1e1e1e] bg-[#111111] px-3 text-sm text-white outline-none transition-colors focus:border-[#333333] sm:px-4"
          >
            <option value="all">All Branches</option>
            {filterBranches.map((branch) => <option key={branch} value={branch}>{branch}</option>)}
          </select>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="space-y-3 sm:hidden">
        {initialLoad ? (
          <div className="rounded border border-[#1e1e1e] bg-[#111111] p-8 text-center text-[#888888]">Loading...</div>
        ) : students.length === 0 ? (
          <div className="rounded border border-[#1e1e1e] bg-[#111111] p-8 text-center text-[#888888]">No gainers found today</div>
        ) : (
          students.map((student, idx) => (
            <Link key={`${student.rollno}-${idx}`} to={`/student/${student.rollno}`} className="block rounded border border-[#1e1e1e] bg-[#111111] p-4 transition-colors hover:border-[#333333]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-[#1e1e1e] font-['JetBrains_Mono'] text-sm text-[#888888]">{idx + 1}</div>
                  <div>
                    <div className="font-['Archivo'] text-sm truncate max-w-[150px]">{student.name}</div>
                    <div className="mt-0.5 font-['JetBrains_Mono'] text-xs text-[#888888]">{student.rollno}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1 font-['JetBrains_Mono'] text-lg font-bold text-[#4ade80]">
                    <ArrowUpRight className="h-4 w-4" />
                    {student.gain}
                  </div>
                  <div className="text-[10px] text-[#666666]">Today's Gain</div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Desktop Data Table */}
      <div className="hidden overflow-x-auto rounded border border-[#1e1e1e] sm:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#1e1e1e] bg-[#111111] font-['JetBrains_Mono']">
            <tr>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#888888]">#</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#888888]">Name</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#888888]">Roll No</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#888888]">Branch</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#888888]">Year</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#4ade80]">Today's Gain</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e1e1e] font-['Archivo']">
            {initialLoad ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[#888888]">Loading...</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[#888888]">No gainers found today</td></tr>
            ) : (
              students.map((student, idx) => (
                <tr key={`${student.rollno}-${idx}`} className="transition-colors hover:bg-[#111111]">
                  <td className="px-4 py-3 font-['JetBrains_Mono'] text-[#888888]">{idx + 1}</td>
                  <td className="w-[160px] max-w-[160px] px-4 py-3">
                    <Link to={`/student/${student.rollno}`} className="block transition-colors hover:text-white hover:underline truncate">
                      {student.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-['JetBrains_Mono'] text-[#888888]">{student.rollno}</td>
                  <td className="px-4 py-3 text-[#888888]">{student.branch}</td>
                  <td className="px-4 py-3 text-[#888888]">{student.year}</td>
                  <td className="px-4 py-3 font-['JetBrains_Mono'] font-bold text-[#4ade80] flex items-center gap-1">
                    <ArrowUpRight className="h-4 w-4" />
                    {student.gain}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div ref={sentinelRef} className="py-1" />
      {loadingMore && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-[#888888]" />
          <span className="ml-2 font-['Archivo'] text-sm text-[#888888]">Loading more...</span>
        </div>
      )}
    </div>
  );
}