import { createContext, useContext, useEffect, useState } from "react";

// ============================================================
// Theme Context — DOAGuru Letters
// ============================================================
// Ye context poori app mein dark/light theme manage karta hai.
// 'dark' class ko <html> tag par add/remove karta hai,
// jo Tailwind ke darkMode: 'class' ke saath kaam karta hai.
// ============================================================

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  // localStorage se saved theme lo, default: 'light'
  const [theme, setTheme] = useState(
    () => localStorage.getItem("dg-theme") || "light"
  );

  // Jab bhi theme change ho, <html> par class toggle karo
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("dg-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const isDark = theme === "dark";

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook — components mein aasaani se use karo:
// const { theme, toggleTheme, isDark } = useTheme();
export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return ctx;
};
