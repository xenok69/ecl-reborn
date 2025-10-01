import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";

import "./index.css";
import App from "./App.jsx";
import Header from "./components/Header.jsx";
import HomeRoute from "./routes/HomeRoute.jsx";
import ChallengesRoute, { challengesLoader } from "./routes/ChallengesRoute.jsx";
import SignInRoute from "./routes/SignInRoute.jsx";
import AdminSubmitRoute, { adminSubmitAction, editLevelLoader } from "./routes/AdminSubmitRoute.jsx";
import AdminCompletionsRoute, { adminCompletionsAction } from "./routes/AdminCompletionsRoute.jsx";
import LeaderboardRoute, { leaderboardLoader } from "./routes/LeaderboardRoute.jsx";
import UserProfileRoute, { userProfileLoader } from "./routes/UserProfileRoute.jsx";
import LevelDataRoute, { levelDataLoader } from "./routes/LevelDataRoute.jsx";
import SearchRoute from "./routes/SearchRoute.jsx";
import AboutRoute from "./routes/AboutRoute.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminProtectedRoute from "./components/AdminProtectedRoute.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <HomeRoute />,
      },
      {
        path: "signin",
        element: <SignInRoute />,
      },
      {
        path: "challenges/",
        element: <ChallengesRoute />,
        loader: challengesLoader,
      },
      {
        path: "challenges/:placement",
        element: <ChallengesRoute />,
        loader: challengesLoader,
      },
      {
        path: "edit/:id",
        element: (
          <AdminProtectedRoute>
            <AdminSubmitRoute />
          </AdminProtectedRoute>
        ),
        loader: editLevelLoader,
        action: adminSubmitAction,
      },
      {
        path: "leaderboard/",
        element: (
          <ProtectedRoute>
            <LeaderboardRoute />
          </ProtectedRoute>
        ),
        loader: leaderboardLoader,
      },
      {
        path: "profile/:userId",
        element: (
          <ProtectedRoute>
            <UserProfileRoute />
          </ProtectedRoute>
        ),
        loader: userProfileLoader,
      },
      {
        path: "level/:placement",
        element: <LevelDataRoute />,
        loader: levelDataLoader,
      },
      {
        path: "search",
        element: <SearchRoute />,
      },
      {
        path: "about/",
        element: <AboutRoute />,
      },
      {
        path: "submit",
        element: (
          <AdminProtectedRoute>
            <AdminSubmitRoute />
          </AdminProtectedRoute>
        ),
        action: adminSubmitAction,
      },
      {
        path: "admin/completions",
        element: (
          <AdminProtectedRoute>
            <AdminCompletionsRoute />
          </AdminProtectedRoute>
        ),
        action: adminCompletionsAction,
      },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
