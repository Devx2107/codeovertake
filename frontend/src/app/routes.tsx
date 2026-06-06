import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Leaderboard } from "./components/Leaderboard";
import { DailyLeaderboard } from "./components/DailyLeaderboard";
import { Register } from "./components/Register";
import { StudentProfile } from "./components/StudentProfile";
import { About } from "./components/About";
import { HeadOn } from "./components/HeadOn";
import { Analytics } from "./components/Analytics";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Leaderboard },
      { path: "daily-gainers", Component: DailyLeaderboard },
      { path: "register", Component: Register },
      { path: "student/:rollNo", Component: StudentProfile },
      { path: "headon", Component: HeadOn },
      { path: "analytics", Component: Analytics },
      { path: "about", Component: About },
    ],
  },
]);
