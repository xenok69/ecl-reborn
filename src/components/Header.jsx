import styles from "./Header.module.css";
import Logo from "./Logo";
import Navigation from "./Navigation";
import ActionButtons from "./ActionButtons";
import { useNavigate } from "react-router";
import { useLoading } from "./LoadingContext";

export default function Header() {
  const navigate = useNavigate();
  const { isLoading } = useLoading();

  const navItems = [
    { id: "home", label: "Home", icon: "🏠", path: "/ecl-reborn" },
    {
      id: "challenges",
      label: "Challenges",
      icon: "⚡",
      path: "/ecl-reborn/challenges/",
    },
    {
      id: "leaderboard",
      label: "Leaderboard",
      icon: "🏆",
      path: "/ecl-reborn/leaderboard/",
    },
    { id: "about", label: "About", icon: "✨", path: "/ecl-reborn/about/" },
  ];

  const handleLogoClick = () => {
    navigate("/ecl-reborn");
  };

  const handleSearchClick = () => {
    console.log("Search clicked");
  };

  const handleProfileClick = () => {
    console.log("Profile clicked");
  };

  return (
    <header className={styles.MainHeader}>
      <div className={styles.HeaderGlow}></div>

      <div className={styles.HeaderContent}>
        <Logo onClick={handleLogoClick} />

        <Navigation
          navItems={navItems}
        />

        <ActionButtons
          onSearchClick={handleSearchClick}
          onProfileClick={handleProfileClick}
          profileInitial="U"
        />
      </div>

      <div
        className={`${styles.AnimatedBorder} ${
          isLoading ? styles.Loading : styles.NotLoading
        }`}
      ></div>
    </header>
  );
}
