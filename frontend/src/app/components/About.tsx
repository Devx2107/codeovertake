import { useEffect, useState } from "react";
import { Code2, Globe, Linkedin, Github, Mail, Users } from "lucide-react";
import { Link } from "react-router";
import { fetchContributors } from "../api";

interface Contributor {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
}

export function About() {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContributors() {
      try {
        const data = await fetchContributors();
        setContributors(data);
      } catch (err) {
        console.error("Failed to load contributors:", err);
      } finally {
        setLoading(false);
      }
    }
    loadContributors();
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
      {/* Hero */}
      <div className="mb-16 text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <Code2 className="h-8 w-8 sm:h-10 sm:w-10 text-[#4ade80]" strokeWidth={1.5} />
          <h1 className="font-['JetBrains_Mono'] text-3xl tracking-tight sm:text-4xl">Code<span className="text-[#4ade80]">Overtake</span></h1>
        </div>
        <p className="mx-auto max-w-xl font-['Archivo'] text-base leading-relaxed text-[#888888] sm:text-lg">
          The unified coding leaderboard for NSUT. Track your progress, compare with peers, and climb the ranks across every major platform.
        </p>
      </div>

      {/* What is CodeOvertake */}
      <section className="mb-14">
        <h2 className="mb-6 font-['JetBrains_Mono'] text-lg tracking-tight sm:text-xl">What is CodeOvertake?</h2>
        <div className="space-y-4 font-['Archivo'] text-sm leading-relaxed text-[#888888] sm:text-base">
          <p>
            CodeOvertake aggregates your coding profiles from GitHub, LeetCode, Codeforces, and CodeChef into a single score. 
            It pulls your stats automatically and ranks you against other NSUT students no manual tracking needed.
          </p>
          <p>
            Whether you're grinding DSA, contributing to open source, or competing in contests, every effort counts toward your score. 
            The leaderboard updates daily, so you always know where you stand.
          </p>
        </div>
      </section>

      {/* How Scoring Works */}
      <section className="mb-14">
        <h2 className="mb-6 font-['JetBrains_Mono'] text-lg tracking-tight sm:text-xl">How Scoring Works</h2>
        <div className="space-y-5 font-['Archivo'] text-sm text-[#888888] sm:text-base">
          <p>
            Each platform contributes up to <span className="text-white">1000 points</span> to your total score (max 4000). 
            Scores use <span className="text-white">exponential curves</span> for activity metrics (so early effort has the biggest impact) 
            and <span className="text-white">linear scaling</span> for ratings.
          </p>

          {/* Scoring Table */}
          <div className="overflow-hidden rounded-lg border border-[#1e1e1e]">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#1e1e1e] bg-[#111111]">
                  <th className="px-4 py-3 font-['JetBrains_Mono'] text-xs font-medium text-[#666666]">Platform</th>
                  <th className="px-4 py-3 font-['JetBrains_Mono'] text-xs font-medium text-[#666666]">Component</th>
                  <th className="hidden px-4 py-3 text-right font-['JetBrains_Mono'] text-xs font-medium text-[#666666] sm:table-cell">Max</th>
                  <th className="hidden px-4 py-3 font-['JetBrains_Mono'] text-xs font-medium text-[#666666] sm:table-cell">Curve</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#111111]">
                {[
                  { platform: "GitHub", total: "1000", rows: [
                    { name: "Contributions", max: "800", curve: "Exponential" },
                    { name: "Stars", max: "100", curve: "Exponential" },
                    { name: "Public Repos", max: "50", curve: "Exponential" },
                    { name: "Followers", max: "50", curve: "Exponential" },
                  ]},
                  { platform: "LeetCode", total: "1000", rows: [
                    { name: "Problems Solved (Easy×1 + Med×3 + Hard×6)", max: "700", curve: "Exponential" },
                    { name: "Contest Rating", max: "300", curve: "Linear" },
                  ]},
                  { platform: "Codeforces", total: "1000", rows: [
                    { name: "Problems Solved", max: "500", curve: "Exponential" },
                    { name: "Current Rating", max: "400", curve: "Linear" },
                    { name: "Peak Rating", max: "100", curve: "Linear" },
                  ]},
                  { platform: "CodeChef", total: "1000", rows: [
                    { name: "Problems Solved", max: "500", curve: "Exponential" },
                    { name: "Current Rating", max: "400", curve: "Linear" },
                    { name: "Highest Rating", max: "100", curve: "Linear" },
                  ]},
                ].map((group) => (
                  group.rows.map((row, i) => (
                    <tr key={`${group.platform}-${i}`} className="transition-colors hover:bg-[#111111]">
                      <td className="px-4 py-2.5 font-['JetBrains_Mono']">
                        {i === 0 ? (
                          <span className="text-white">{group.platform} <span className="text-[#666666]">/ {group.total}</span></span>
                        ) : (
                          <span className="text-transparent select-none">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-[#888888]">{row.name}</td>
                      <td className="hidden px-4 py-2.5 text-right font-['JetBrains_Mono'] text-white sm:table-cell">{row.max}</td>
                      <td className="hidden px-4 py-2.5 sm:table-cell">
                        <span className={`inline-block rounded px-1.5 py-0.5 font-['JetBrains_Mono'] text-[10px] ${
                          row.curve === "Exponential" ? "bg-[#1e1e1e] text-[#4ade80]" : "bg-[#1e1e1e] text-[#60a5fa]"
                        }`}>{row.curve}</span>
                      </td>
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 text-xs text-[#666666] sm:flex-row sm:items-start sm:gap-6">
            <div className="flex items-center gap-2">
              <span className="inline-block rounded bg-[#1e1e1e] px-1.5 py-0.5 font-['JetBrains_Mono'] text-[10px] text-[#4ade80]">Exponential</span>
              <span>Early effort has the biggest impact, with diminishing returns</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block rounded bg-[#1e1e1e] px-1.5 py-0.5 font-['JetBrains_Mono'] text-[10px] text-[#60a5fa]">Linear</span>
              <span>Score scales proportionally with rating</span>
            </div>
          </div>

          <p className="text-xs text-[#666666]">
            All scores are recalculated daily from live platform data. Max total score: <span className="font-['JetBrains_Mono'] text-[#888888]">4000</span>.
          </p>
        </div>
      </section>

      {/* Ranking System */}
      <section className="mb-14">
        <h2 className="mb-6 font-['JetBrains_Mono'] text-lg tracking-tight sm:text-xl">Ranking System</h2>
        <div className="space-y-4 font-['Archivo'] text-sm text-[#888888] sm:text-base">
          <p>
            Your <span className="text-white">total score</span> (sum of all platform scores, max 4000) determines your rank. 
            CodeOvertake computes three separate rankings:
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-4">
              <div className="mb-2 font-['JetBrains_Mono'] text-xs text-[#4ade80]">Overall</div>
              <p className="text-xs text-[#666666]">Ranked against every registered student. Your global position at NSUT.</p>
            </div>
            <div className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-4">
              <div className="mb-2 font-['JetBrains_Mono'] text-xs text-[#4ade80]">Year-wise</div>
              <p className="text-xs text-[#666666]">Ranked within your batch (e.g. 2028). See how you compare to your batchmates.</p>
            </div>
            <div className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-4">
              <div className="mb-2 font-['JetBrains_Mono'] text-xs text-[#4ade80]">Branch-wise</div>
              <p className="text-xs text-[#666666]">Ranked within your year + branch combo (e.g. 2028 CSAI). The most competitive view.</p>
            </div>
          </div>
          <p className="text-xs text-[#666666]">Rankings are recalculated after every data refresh. Daily snapshots track your score history over time.</p>
        </div>
      </section>
      
      {/* Divider */}
      <div className="my-14 border-t border-[#1e1e1e]" />

      {/* Contributors*/}
      {!loading && contributors.length > 0 && (
        <section className="mb-14">
          <div className="mb-6 flex items-center gap-2">
            <Users className="h-5 w-5 text-[#4ade80]" strokeWidth={1.5} />
            <h2 className="font-['JetBrains_Mono'] text-lg tracking-tight sm:text-xl">Project Contributors</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {contributors.map((user) => (
              <a
                key={user.id}
                href={user.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center rounded-lg border border-[#1e1e1e] bg-[#111111] p-4 text-center transition-colors hover:border-[#4ade80]"
              >
                <img
                  src={user.avatar_url}
                  alt={`${user.login}'s profile`}
                  className="mb-3 h-14 w-14 rounded-full border border-[#1e1e1e] bg-[#1a1a1a]"
                />
                <span className="truncate max-w-full font-['JetBrains_Mono'] text-sm font-medium text-white">
                  {user.login}
                </span>
                <span className="mt-1 font-['Archivo'] text-xs text-[#666666]">
                  {user.contributions} {user.contributions === 1 ? 'commit' : 'commits'}
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Divider */}
      <div className="my-14 border-t border-[#1e1e1e]" />

      {/* Contact / Built by */}
      <section className="mb-14">
        <h2 className="mb-6 font-['JetBrains_Mono'] text-lg tracking-tight sm:text-xl">Contact</h2>
        <div className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-10">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <img
                src="https://api.dicebear.com/9.x/initials/svg?seed=SC&backgroundColor=1a1a1a&textColor=ffffff"
                alt="Sujal Chaudhary"
                className="h-20 w-20 rounded-full border border-[#1e1e1e]"
              />
            </div>

            {/* Info */}
            <div className="flex-1">
              <h3 className="font-['JetBrains_Mono'] text-lg text-white">Sujal Chaudhary</h3>
              <p className="mt-1 font-['Archivo'] text-sm text-[#888888]">
                Computer Science & AI · NSUT · Batch of 2028
              </p>
              <p className="mt-3 font-['Archivo'] text-sm leading-relaxed text-[#666666]">
                Built CodeOvertake to give NSUT coders a reason to push harder. Have feedback, found a bug, or want to contribute? Reach out through any of the links below.
              </p>

              {/* Links */}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <a
                  href="https://sujal.info"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-[#1e1e1e] px-3 py-2 font-['Archivo'] text-xs text-[#888888] transition-colors hover:border-[#333333] hover:text-white"
                >
                  <Globe className="h-3.5 w-3.5" /> Portfolio
                </a>
                <a
                  href="https://sujal.info/linkedin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-[#1e1e1e] px-3 py-2 font-['Archivo'] text-xs text-[#888888] transition-colors hover:border-[#333333] hover:text-white"
                >
                  <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                </a>
                <a
                  href="https://sujal.info/github"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-[#1e1e1e] px-3 py-2 font-['Archivo'] text-xs text-[#888888] transition-colors hover:border-[#333333] hover:text-white"
                >
                  <Github className="h-3.5 w-3.5" /> GitHub
                </a>
                <a
                  href="mailto:sujal@sujal.info"
                  className="inline-flex items-center gap-2 rounded-md border border-[#1e1e1e] px-3 py-2 font-['Archivo'] text-xs text-[#888888] transition-colors hover:border-[#333333] hover:text-white"
                >
                  <Mail className="h-3.5 w-3.5" /> Email
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="text-center">
        <p className="mb-4 font-['Archivo'] text-sm text-[#666666]">Ready to see where you stand?</p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/" className="rounded-md border border-[#1e1e1e] px-5 py-2.5 font-['JetBrains_Mono'] text-xs transition-colors hover:border-[#333333] hover:text-white">
            View Leaderboard
          </Link>
          <Link to="/register" className="rounded-md bg-[#4ade80] px-5 py-2.5 font-['JetBrains_Mono'] text-xs text-[#0a0a0a] transition-opacity hover:opacity-80">
            Claim Your Spot
          </Link>
        </div>
      </div>
    </div>
  );
}
