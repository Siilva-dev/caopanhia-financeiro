import { createRoot } from 'react-dom/client'
import { ThemeProvider } from "@/hooks/useTheme";
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="dark" storageKey="lovable-theme">
    <App />
  </ThemeProvider>
);
