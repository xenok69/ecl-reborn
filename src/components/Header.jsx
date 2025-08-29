import styles from "./Header.module.css";
import Logo from "./Logo";
import Navigation from "./Navigation";
import ActionButtons from "./ActionButtons";
import { useNavigate, useNavigation } from "react-router";
import { useLoading } from "./LoadingContext";

export default function Header() {
  const navigate = useNavigate();
  const navigation = useNavigation();
  const { isLoading: contextLoading } = useLoading();
  
  // Show loading if either router navigation is happening OR context loading is true
  const isLoading = navigation.state === 'loading' || contextLoading;

  const navItems = [
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

  const handleLogoClick = () => {
    navigate("/");
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
