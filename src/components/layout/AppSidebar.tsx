import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, PlusCircle, CreditCard, Vault, Building, Target, BarChart3, Settings, Menu, X, TrendingUp, ArrowUpDown, LogOut } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const allMenuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: BarChart3,
    roles: ["admin", "funcionario"],
  },
  {
    title: "Lançamentos",
    url: "/lancamentos",
    icon: PlusCircle,
    roles: ["admin", "funcionario"],
  },
  {
    title: "Parcelamentos",
    url: "/parcelamentos",
    icon: CreditCard,
    roles: ["admin", "funcionario"],
  },
  {
    title: "Cofre Virtual",
    url: "/cofre",
    icon: Vault,
    roles: ["admin"],
  },
  {
    title: "Contas Bancárias",
    url: "/contas",
    icon: Building,
    roles: ["admin"],
  },
  {
    title: "Metas Mensais",
    url: "/metas",
    icon: Target,
    roles: ["admin"],
  },
  {
    title: "Relatórios",
    url: "/relatorios",
    icon: TrendingUp,
    roles: ["admin"],
  },
  {
    title: "Configurações",
    url: "/configuracoes",
    icon: Settings,
    roles: ["admin", "funcionario"],
  },
];
export function AppSidebar() {
  const navigate = useNavigate();
  const { signOut, userRole } = useAuth();
  const isMobile = useIsMobile();
  const location = useLocation();
  const currentPath = location.pathname;
  const { open, setOpen, openMobile, setOpenMobile } = useSidebar();
  
  const menuItems = allMenuItems.filter(item => 
    item.roles.includes(userRole || '')
  );
  
  // Mobile logic - use sidebar state directly
  useEffect(() => {
    if (isMobile) {
      setOpen(false); // Keep sidebar closed on mobile by default
    }
  }, [isMobile, setOpen]);

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({
    isActive: active
  }: {
    isActive: boolean;
  }) => `menu-item-elegant w-full justify-start ${active ? "active" : "text-sidebar-foreground hover:text-sidebar-accent-foreground"}`;
  
  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  const MenuItemWithTooltip = ({ item, collapsed }: { item: any, collapsed: boolean }) => (
    <TooltipProvider key={item.title}>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <SidebarMenuButton asChild>
            <NavLink 
              to={item.url} 
              end 
              className={getNavCls}
              onClick={handleLinkClick}
              title={item.title}
            >
              <item.icon className="menu-icon h-5 w-5 flex-shrink-0" />
              <span className="menu-text truncate group-data-[collapsible=icon]:hidden">
                {item.title}
              </span>
            </NavLink>
          </SidebarMenuButton>
        </TooltipTrigger>
        {collapsed && (
          <TooltipContent side="right" className="ml-2">
            <p>{item.title}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <>
      {/* Mobile trigger - always visible on mobile */}
      {isMobile && (
        <div className="fixed top-4 left-4 z-50 md:hidden">
          <SidebarTrigger className="bg-sidebar border border-sidebar-border shadow-md" />
        </div>
      )}
      
      <Sidebar 
        collapsible="icon"
        className="sidebar-elegant border-r border-sidebar-border"
      >
        <div className="sidebar-header-elegant flex h-16 items-center px-4">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary flex-shrink-0">
              <ArrowUpDown className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sidebar-foreground truncate group-data-[collapsible=icon]:hidden">
              FinanceiroApp
            </span>
          </div>
          
          {/* Desktop toggle - positioned at right */}
          {!isMobile && (
            <div className="flex-shrink-0 ml-2">
              <SidebarTrigger />
            </div>
          )}
        </div>

        <SidebarContent className="flex flex-col h-full px-2 py-4 overflow-hidden">
          <SidebarGroup className="flex-1 overflow-y-auto">
            <SidebarGroupLabel className="text-sidebar-foreground/70 text-xs uppercase tracking-wider font-medium mb-2 px-2 group-data-[collapsible=icon]:hidden">
              Menu Principal
            </SidebarGroupLabel>
            
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {menuItems.map(item => (
                  <SidebarMenuItem key={item.title}>
                    <MenuItemWithTooltip item={item} collapsed={!open && !isMobile} />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Botão de Logout */}
          <div className="mt-auto pt-4 border-t border-sidebar-border">
            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className="menu-item-elegant w-full justify-start text-sidebar-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-5 w-5 flex-shrink-0" />
                    <span className="menu-text ml-3 truncate group-data-[collapsible=icon]:hidden">
                      Sair
                    </span>
                  </Button>
                </TooltipTrigger>
                {(!open && !isMobile) && (
                  <TooltipContent side="right" className="ml-2">
                    <p>Sair</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </SidebarContent>
      </Sidebar>
    </>
  );
}