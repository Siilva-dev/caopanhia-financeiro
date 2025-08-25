import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Lancamentos from "./pages/Lancamentos";
import Parcelamentos from "./pages/Parcelamentos";
import Cofre from "./pages/Cofre";
import Contas from "./pages/Contas";
import Metas from "./pages/Metas";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 min-w-0 overflow-auto transition-all duration-300">
          <div className="p-3 sm:p-4 lg:p-6 w-full max-w-none pt-16 md:pt-3 lg:pt-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-r-transparent" />
          <span className="text-lg font-medium">Carregando...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/lancamentos" element={
              <ProtectedRoute>
                <Lancamentos />
              </ProtectedRoute>
            } />
            <Route path="/parcelamentos" element={
              <ProtectedRoute>
                <Parcelamentos />
              </ProtectedRoute>
            } />
            <Route path="/cofre" element={
              <ProtectedRoute>
                <Cofre />
              </ProtectedRoute>
            } />
            <Route path="/contas" element={
              <ProtectedRoute>
                <Contas />
              </ProtectedRoute>
            } />
            <Route path="/metas" element={
              <ProtectedRoute>
                <Metas />
              </ProtectedRoute>
            } />
            <Route path="/relatorios" element={
              <ProtectedRoute>
                <Relatorios />
              </ProtectedRoute>
            } />
            <Route path="/configuracoes" element={
              <ProtectedRoute>
                <Configuracoes />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;