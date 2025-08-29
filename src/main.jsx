import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";

import "./index.css";
import App from "./App.jsx";
import Header from "./components/Header.jsx";
import HomeRoute from "./routes/HomeRoute.jsx";
import ChallengesRoute, { challengesLoader } from "./routes/ChallengesRoute.jsx";
import SignInRoute from "./routes/SignInRoute.jsx";
import AdminSubmitRoute, { adminSubmitAction } from "./routes/AdminSubmitRoute.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

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
        path: "leaderboard/",
        element: (
          <>
          </>
        ),
      },
      {
        path: "about/",
        element: <></>,
      },
      {
        path: "submit",
        element: <AdminSubmitRoute />,
        action: adminSubmitAction,
      },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
