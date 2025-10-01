import styles from "./Header.module.css";
import Logo from "./Logo";
import Navigation from "./Navigation";
import ActionButtons from "./ActionButtons";
import { useNavigate, useNavigation } from "react-router";
import { useLoading } from "./LoadingContext";
import { useAuth } from "../hooks/useAuth";
import { useState } from "react";

export default function Header() {
  const navigate = useNavigate();
  const navigation = useNavigation();
  const { isLoading: contextLoading } = useLoading();
  const { user } = useAuth();
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

  const handleProfileClick = () => {
    if (user?.id) {
      navigate(`/profile/${user.id}`);
    }
  };

  return (
    <header className={styles.MainHeader}>
      <div className={styles.HeaderGlow}></div>

      <div className={styles.HeaderContent}>
        <Logo onClick={handleLogoClick} />

        <Navigation navItems={navItems} />

        <ActionButtons
          onProfileClick={handleProfileClick}
          profileInitial="U"
          navigate={navigate}
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
