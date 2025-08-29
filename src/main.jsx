import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";

import "./index.css";
import App from "./App.jsx";
import Header from "./components/Header.jsx";
import ChallengesRoute from "./routes/ChallengesRoute.jsx";
import SignInRoute from "./routes/SignInRoute.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

const router = createBrowserRouter([
  {
    path: "/ecl-reborn",
    element: <App />,
    children: [
      {
        index: true,
        element: <></>,
      },
      {
        path: "signin",
        element: <SignInRoute />,
      },
      {
        path: "challenges/",
        element: (
          <ProtectedRoute>
            <ChallengesRoute />
          </ProtectedRoute>
        ),
      },
      {
        path: "leaderboard/",
        element: (
          <ProtectedRoute>
            <></>
          </ProtectedRoute>
        ),
      },
      {
        path: "about/",
        element: <></>,
      },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
