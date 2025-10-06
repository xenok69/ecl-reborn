import { useState } from "react";
import { useNavigate, useNavigation } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { useLoading } from "./LoadingContext";
import Logo from "./Logo";
import Navigation from "./Navigation";
import ActionButtons from "./ActionButtons";
import styles from "./Header.module.css";

const NAV_ITEMS = [
  { id: "home", label: "Home", icon: "🏠", path: "/" },
  { id: "challenges", label: "Challenges", icon: "⚡", path: "/challenges/" },
  { id: "leaderboard", label: "Leaderboard", icon: "🏆", path: "/leaderboard/" },
  { id: "about", label: "About", icon: "✨", path: "/about/" },
];

export default function Header() {
  const navigate = useNavigate();
  const navigation = useNavigation();
  const { isLoading: contextLoading } = useLoading();
  const { user } = useAuth();
  const [isSearchActive, setIsSearchActive] = useState(false);

  const isLoading = navigation.state === 'loading' || contextLoading;
  const loadingClass = isLoading ? styles.Loading : styles.NotLoading;

  return (
    <header className={styles.MainHeader}>
      <div className={styles.HeaderGlow} />

      <div className={styles.HeaderContent}>
        <Logo onClick={() => navigate("/")} className={isSearchActive ? styles.MobileHidden : ''} />
        <Navigation navItems={NAV_ITEMS} className={isSearchActive ? styles.MobileHidden : ''} />
        <ActionButtons
          onProfileClick={() => user?.id && navigate(`/profile/${user.id}`)}
          profileInitial="U"
          navigate={navigate}
          onSearchToggle={setIsSearchActive}
          isSearchActive={isSearchActive}
        />
      </div>

      <div className={`${styles.AnimatedBorder} ${loadingClass}`} />
    </header>
  );
}
