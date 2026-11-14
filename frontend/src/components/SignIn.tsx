import type { CSSProperties } from "react";
import { useLanguage } from "../contexts/LanguageContext";

interface SignInProps {
  onSignIn: () => void;
  onModalClose: () => void;
  disabled?: boolean;
}

const modalStyle: CSSProperties = {
  background: "#ffffff",
  position: "absolute",
  left: "15vw",
  top: "40%",
  width: "70vw",
  height: "25vh",
  border: "1px solid #d6a62e",
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  padding: "1rem",
  gap: "1rem",
};

const buttonContainerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  gap: "1rem",
};

const SignIn = ({ onSignIn, onModalClose, disabled }: SignInProps) => {
  const { t } = useLanguage();
  return (
    <div style={modalStyle}>
      <p style={{ fontWeight: "bold" }}>{t("signInPrompt")}</p>
      <div style={buttonContainerStyle}>
        <button onClick={onSignIn} disabled={disabled}>
          {t("signInButton")}
        </button>
        <button onClick={onModalClose}>{t("close")}</button>
      </div>
    </div>
  );
};

export default SignIn;
