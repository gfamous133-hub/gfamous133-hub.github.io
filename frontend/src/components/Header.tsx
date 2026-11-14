import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import type { User } from "../types/pi.ts";
import { languageOptions, useLanguage } from "../contexts/LanguageContext";

interface HeaderProps {
  onSignIn: () => void;
  onSignOut: () => void;
  onSendTestNotification: () => void;
  user: User | null;
  isLoading?: boolean;
}

const headerStyle: CSSProperties = {
  padding: 14,
  background: "linear-gradient(115deg, #0d1b31 0%, #18365b 100%)",
  color: "white",
  width: "100%",
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: 10,
  borderBottom: "3px solid #d8aa35",
  boxShadow: "0 5px 18px rgba(16, 33, 59, 0.16)",
};

const userSectionStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
};

const buttonStyle: CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #d8aa35",
  backgroundColor: "rgba(255,255,255,0.08)",
  color: "white",
  cursor: "pointer",
  textDecoration: "none",
};

const Header = ({
  user,
  onSignIn,
  onSignOut,
  onSendTestNotification,
  isLoading,
}: HeaderProps) => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header style={headerStyle}>
      <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: 0.35 }}>
        <span style={{ color: "#f0c75e" }}>GFAMOUS</span> MINERAL MARKET
      </div>

      <div style={userSectionStyle}>
        <label htmlFor="gfamous-language" style={{ fontSize: 13 }}>
          {t("language")}
        </label>
        <select
          id="gfamous-language"
          value={language}
          onChange={(event) => setLanguage(event.target.value as typeof language)}
          aria-label={t("language")}
          style={{
            padding: "8px 9px",
            borderRadius: 8,
            border: "1px solid #d8aa35",
            background: "#fff",
            color: "#10213b",
            maxWidth: 145,
          }}
        >
          {languageOptions.map((option) => (
            <option key={option.code} value={option.code}>
              {option.label}
            </option>
          ))}
        </select>

        {user ? (
          <>
            <span>@{user.username}</span>
            {user.roles.includes("admin") && (
              <Link to="/admin" style={buttonStyle}>
                {t("admin")}
              </Link>
            )}
            <button type="button" style={buttonStyle} onClick={onSignOut} disabled={isLoading}>
              {t("signOut")}
            </button>
            {user.roles.includes("core_team") && (
              <button type="button" style={buttonStyle} onClick={onSendTestNotification}>
                {t("testNotification")}
              </button>
            )}
          </>
        ) : (
          <button type="button" style={buttonStyle} onClick={onSignIn} disabled={isLoading}>
            {t("signIn")}
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
