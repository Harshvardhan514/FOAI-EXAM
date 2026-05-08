import { createContext } from "react";
export const ThemeContext = createContext({ theme: "dark", toggleTheme: () => {} });
export const ISSContext = createContext({});
export const NewsContext = createContext({});
export const ToastContext = createContext({ addToast: () => {} });
