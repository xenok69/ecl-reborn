import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";

import "./index.css";
import App from "./App.jsx";
import Header from "./components/Header.jsx";
import ChallengesRoute from "./routes/ChallengesRoute.jsx";

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
        path: "challenges/",
        element: <ChallengesRoute />,
      },
      {
        path: "challenges/:placement",
        element: <ChallengesRoute />,
      },
      {
        path: "leaderboard/",
        element: <></>,
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
