import styles from "./Navigation.module.css";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router";

export default function Navigation({ navItems, activeNav, onNavChange, className }) {
  const navigate = useNavigate();
  const location = useLocation();

  const defaultNavItems = [
    { id: "home", label: "Home", icon: "🏠", path: "/" },
    {
      id: "challenges",
      label: "Challenges",
      icon: "⚡",
      path: "/challenges/",
    },
    {
      id: "leaderboard",
      label: "Leaderboard",
      icon: "🏆",
      path: "/leaderboard/",
    },
    { id: "about", label: "About", icon: "✨", path: "/about/" },
  ];

  const items = navItems || defaultNavItems;

  const getActiveNavFromPath = () => {
    const path = location.pathname;
    if (path === "/" || path === "/") return "home";
    if (path.includes("/challenges/")) return "challenges";
    if (path.includes("/leaderboard/")) return "leaderboard";
    if (path.includes("/about")) return "about";
    return null;
  };

  const [internalActiveNav, setInternalActiveNav] = useState(
    getActiveNavFromPath()
  );
  const currentActiveNav =
    activeNav !== undefined ? activeNav : getActiveNavFromPath();
  const handleNavChange = onNavChange || setInternalActiveNav;

  const handleNavClick = (item) => {
    handleNavChange(item.id);
    navigate(item.path);
  };

  return (
    <nav className={`${styles.Navigation} ${className || ''}`}>
      {items.map((item) => (
        <button
          key={item.id}
          className={`${styles.NavItem} ${
            currentActiveNav === item.id ? styles.NavActive : ""
          }`}
          onClick={() => handleNavClick(item)}
        >
          <span className={styles.NavIcon}>{item.icon}</span>
          <span className={styles.NavLabel}>{item.label}</span>
          <div className={styles.NavHighlight}></div>
        </button>
      ))}
    </nav>
  );
}
