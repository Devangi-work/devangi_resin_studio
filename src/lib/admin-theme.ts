export type AdminTheme = "light" | "dark";

export function getStoredAdminTheme(): AdminTheme {
  if (typeof window === "undefined") return "light";
  try {
    const saved = localStorage.getItem("admin_theme");
    return saved === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function applyAdminTheme(theme: AdminTheme) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("admin_theme", theme);
  } catch (e) {
    console.error("Failed to persist admin theme to localStorage:", e);
  }

  if (theme === "dark") {
    document.documentElement.classList.add("admin-dark");
    document.body.classList.add("admin-dark");
  } else {
    document.documentElement.classList.remove("admin-dark");
    document.body.classList.remove("admin-dark");
  }

  try {
    window.dispatchEvent(new CustomEvent("admin_theme_change", { detail: theme }));
  } catch (e) {
    console.error("Failed to dispatch admin_theme_change:", e);
  }
}
