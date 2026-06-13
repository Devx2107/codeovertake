export interface Student {
  rollNo: string;
  name: string;
  branch: string;
  year: number;
  platforms: {
    github?: {
      username: string;
      repos: number;
      stars: number;
      followers: number;
      contributions: number;
      score: number;
    };
    leetcode?: {
      username: string;
      easy: number;
      medium: number;
      hard: number;
      total: number;
      contest: number;
      score: number;
    };
    codeforces?: {
      username: string;
      rating: number;
      maxRating: number;
      rank: string;
      solved: number;
      score: number;
    };
    codechef?: {
      username: string;
      rating: number;
      maxRating: number;
      stars: string;
      solved: number;
      globalRank?: number;
      countryRank?: number;
      score: number;
    };
    gfg?: {
      username: string;
      easy: number;
      medium: number;
      hard: number;
      total: number;
      score: number;
    };
  };
  totalScore: number;
  overallRank: number;
  yearRank: number;
  branchRank: number;
  scoreHistory?: Array<{
    date: string;
    total: number;
    github: number;
    leetcode: number;
    codeforces: number;
    codechef: number;
    gfg?: number;
  }>;
  usernameHistory?: Array<{
    timestamp: string;
    isOriginal: boolean;
    usernames: {
      github?: string;
      leetcode?: string;
      codeforces?: string;
      codechef?: string;
      gfg?: string;
    };
  }>;
}

export const mockStudents: Student[] = [
  {
    rollNo: "2022UIT3042",
    name: "Arjun Mehta",
    branch: "CSE",
    year: 2022,
    platforms: {
      github: {
        username: "arjunmehta",
        repos: 45,
        stars: 1203,
        followers: 234,
        contributions: 1456,
        score: 985,
      },
      leetcode: {
        username: "arjun_codes",
        easy: 245,
        medium: 178,
        hard: 56,
        total: 479,
        contest: 1876,
        score: 892,
      },
      codeforces: {
        username: "arjun_cf",
        rating: 1842,
        maxRating: 1924,
        rank: "Expert",
        solved: 456,
        score: 845,
      },
      codechef: {
        username: "arjun_chef",
        rating: 2145,
        maxRating: 2234,
        stars: "5★",
        solved: 389,
        globalRank: 1234,
        countryRank: 456,
        score: 878,
      },
    },
    totalScore: 3600,
    overallRank: 1,
    yearRank: 1,
    branchRank: 1,
    scoreHistory: [
      { date: "2026-03-15", total: 3400, github: 920, leetcode: 850, codeforces: 810, codechef: 820 },
      { date: "2026-03-20", total: 3450, github: 940, leetcode: 860, codeforces: 820, codechef: 830 },
      { date: "2026-03-25", total: 3520, github: 960, leetcode: 875, codeforces: 835, codechef: 850 },
      { date: "2026-03-30", total: 3550, github: 970, leetcode: 880, codeforces: 840, codechef: 860 },
      { date: "2026-04-05", total: 3580, github: 980, leetcode: 885, codeforces: 843, codechef: 872 },
      { date: "2026-04-10", total: 3600, github: 985, leetcode: 892, codeforces: 845, codechef: 878 },
    ],
    usernameHistory: [
      {
        timestamp: "2026-04-10 10:30 PM",
        isOriginal: false,
        usernames: {
          github: "arjunmehta",
          leetcode: "arjun_codes",
          codeforces: "arjun_cf",
          codechef: "arjun_chef",
        },
      },
      {
        timestamp: "2026-02-15 02:15 PM",
        isOriginal: true,
        usernames: {
          github: "arjun_m",
          leetcode: "arjun_codes",
          codeforces: "arjun_cf",
        },
      },
    ],
  },
  {
    rollNo: "2023UEC2156",
    name: "Priya Sharma",
    branch: "ECE",
    year: 2023,
    platforms: {
      github: {
        username: "priyasharma",
        repos: 32,
        stars: 856,
        followers: 145,
        contributions: 1089,
        score: 756,
      },
      leetcode: {
        username: "priya_lc",
        easy: 198,
        medium: 142,
        hard: 34,
        total: 374,
        contest: 1654,
        score: 745,
      },
      codeforces: {
        username: "priya_cf",
        rating: 1654,
        maxRating: 1702,
        rank: "Specialist",
        solved: 342,
        score: 712,
      },
      codechef: {
        username: "priya_cc",
        rating: 1876,
        maxRating: 1945,
        stars: "4★",
        solved: 298,
        globalRank: 2345,
        countryRank: 789,
        score: 734,
      },
    },
    totalScore: 2947,
    overallRank: 2,
    yearRank: 1,
    branchRank: 1,
  },
  {
    rollNo: "2022UIT3089",
    name: "Rahul Verma",
    branch: "IT",
    year: 2022,
    platforms: {
      github: {
        username: "rahulverma",
        repos: 28,
        stars: 645,
        followers: 98,
        contributions: 876,
        score: 634,
      },
      leetcode: {
        username: "rahul_v",
        easy: 176,
        medium: 119,
        hard: 28,
        total: 323,
        contest: 1543,
        score: 689,
      },
      codeforces: {
        username: "rahul_codes",
        rating: 1545,
        maxRating: 1612,
        rank: "Specialist",
        solved: 287,
        score: 678,
      },
    },
    totalScore: 2001,
    overallRank: 3,
    yearRank: 2,
    branchRank: 1,
  },
  {
    rollNo: "2024UCE1234",
    name: "Ananya Singh",
    branch: "CSE",
    year: 2024,
    platforms: {
      github: {
        username: "ananyasingh",
        repos: 18,
        stars: 234,
        followers: 67,
        contributions: 543,
        score: 456,
      },
      leetcode: {
        username: "ananya_lc",
        easy: 134,
        medium: 76,
        hard: 12,
        total: 222,
        contest: 1345,
        score: 534,
      },
      codechef: {
        username: "ananya_cc",
        rating: 1654,
        maxRating: 1689,
        stars: "3★",
        solved: 187,
        globalRank: 3456,
        countryRank: 1234,
        score: 587,
      },
    },
    totalScore: 1577,
    overallRank: 4,
    yearRank: 1,
    branchRank: 2,
  },
  {
    rollNo: "2023UIT2987",
    name: "Vikram Patel",
    branch: "IT",
    year: 2023,
    platforms: {
      leetcode: {
        username: "vikram_p",
        easy: 145,
        medium: 89,
        hard: 19,
        total: 253,
        contest: 1423,
        score: 589,
      },
      codeforces: {
        username: "vikram_cf",
        rating: 1478,
        maxRating: 1534,
        rank: "Pupil",
        solved: 234,
        score: 567,
      },
      codechef: {
        username: "vikram_chef",
        rating: 1567,
        maxRating: 1612,
        stars: "3★",
        solved: 178,
        score: 545,
      },
    },
    totalScore: 1701,
    overallRank: 5,
    yearRank: 2,
    branchRank: 2,
  },
  {
    rollNo: "2022UEC2045",
    name: "Neha Gupta",
    branch: "ECE",
    year: 2022,
    platforms: {
      github: {
        username: "nehagupta",
        repos: 21,
        stars: 432,
        followers: 78,
        contributions: 654,
        score: 523,
      },
      leetcode: {
        username: "neha_codes",
        easy: 123,
        medium: 67,
        hard: 15,
        total: 205,
        contest: 1289,
        score: 478,
      },
    },
    totalScore: 1001,
    overallRank: 6,
    yearRank: 3,
    branchRank: 2,
  },
];

export const branches = ["CSE", "ECE", "IT"];
export const years = [2022, 2023, 2024];
export const platforms = ["github", "leetcode", "codeforces", "codechef", "gfg"] as const;
export type Platform = typeof platforms[number];
