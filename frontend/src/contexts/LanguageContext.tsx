import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type Language =
  | "sw"
  | "en"
  | "fr"
  | "ar"
  | "zh"
  | "es"
  | "pt";

export const languageOptions: { code: Language; label: string }[] = [
  { code: "sw", label: "Kiswahili" },
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "ar", label: "العربية" },
  { code: "zh", label: "中文" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
];

const messages = {
  sw: {
    admin: "Dashibodi ya Admin",
    signIn: "Ingia kwa Pi",
    signOut: "Toka",
    testNotification: "Tuma taarifa ya majaribio",
    language: "Lugha",
  },
  en: {
    admin: "Admin Dashboard",
    signIn: "Sign in with Pi",
    signOut: "Sign out",
    testNotification: "Send Test Notification",
    language: "Language",
  },
  fr: {
    admin: "Tableau de bord administrateur",
    signIn: "Se connecter avec Pi",
    signOut: "Se déconnecter",
    testNotification: "Envoyer une notification test",
    language: "Langue",
  },
  ar: {
    admin: "لوحة تحكم المسؤول",
    signIn: "تسجيل الدخول باستخدام Pi",
    signOut: "تسجيل الخروج",
    testNotification: "إرسال إشعار تجريبي",
    language: "اللغة",
  },
  zh: {
    admin: "管理员面板",
    signIn: "使用 Pi 登录",
    signOut: "退出登录",
    testNotification: "发送测试通知",
    language: "语言",
  },
  es: {
    admin: "Panel de administración",
    signIn: "Iniciar sesión con Pi",
    signOut: "Cerrar sesión",
    testNotification: "Enviar notificación de prueba",
    language: "Idioma",
  },
  pt: {
    admin: "Painel do administrador",
    signIn: "Entrar com Pi",
    signOut: "Sair",
    testNotification: "Enviar notificação de teste",
    language: "Idioma",
  },
} as const;

type MessageKey = keyof typeof messages.sw;

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: MessageKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = window.localStorage.getItem("gfamous-language");
      return languageOptions.some((option) => option.code === saved)
        ? (saved as Language)
        : "sw";
    } catch {
      return "sw";
    }
  });

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    try {
      window.localStorage.setItem("gfamous-language", nextLanguage);
    } catch {
      // The selected language still works for this session if storage is unavailable.
    }
  };

  useEffect(() => {
    const isArabic = language === "ar";
    document.documentElement.lang = language;
    document.documentElement.dir = isArabic ? "rtl" : "ltr";
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key) => messages[language][key],
    }),
    [language]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return context;
}
