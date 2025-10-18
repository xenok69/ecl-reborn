import { useState, useMemo } from "react";
import { useNavigate, useNavigation } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { useAdmin } from "../hooks/useAdmin";
import { useLoading } from "./LoadingContext";
import Logo from "./Logo";
import Navigation from "./Navigation";
import ActionButtons from "./ActionButtons";
import styles from "./Header.module.css";

const BASE_NAV_ITEMS = [
  { id: "home", label: "Home", icon: "🏠", path: "/" },
  { id: "challenges", label: "Challenges", icon: "⚡", path: "/challenges/" },
  { id: "leaderboard", label: "Leaderboard", icon: "🏆", path: "/leaderboard/" },
  { id: "about", label: "About", icon: "✨", path: "/about/" },
];

export default function Header() {
  const navigate = useNavigate();
  const navigation = useNavigation();
  const { isLoading: contextLoading } = useLoading();
  const { user, isAuthenticated } = useAuth();
  const { isAdmin } = useAdmin();
  const [isSearchActive, setIsSearchActive] = useState(false);

  const isLoading = navigation.state === 'loading' || contextLoading;
  const loadingClass = isLoading ? styles.Loading : styles.NotLoading;

  // Build dynamic navigation items based on auth status
  const navItems = useMemo(() => {
    const items = [...BASE_NAV_ITEMS];

    // Add authenticated user items
    if (isAuthenticated) {
      items.push({ id: "submit", label: "Submit", icon: "📤", path: "/submit-request" });
      items.push({ id: "my-submissions", label: "My Submissions", icon: "📋", path: "/my-submissions" });
    }

    // Add admin items
    if (isAdmin) {
      items.push({ id: "admin-review", label: "Review", icon: "✅", path: "/admin/review" });
    }

    return items;
  }, [isAuthenticated, isAdmin]);

  return (
    <header className={styles.MainHeader}>
      <div className={styles.HeaderGlow} />

      <div className={styles.HeaderContent}>
        <Logo onClick={() => navigate("/")} className={isSearchActive ? styles.MobileHidden : ''} />
        <Navigation navItems={navItems} className={isSearchActive ? styles.MobileHidden : ''} />
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
