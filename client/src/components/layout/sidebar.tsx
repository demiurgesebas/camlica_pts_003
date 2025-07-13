import { cn } from "@/lib/utils";
import { useLocation, Link } from "wouter";
import { useState, useEffect } from "react";
import {
  BarChart3,
  Bell,
  Building,
  Building2,
  Calendar,
  Clock,
  Cog,
  QrCode,
  Gauge,
  ListTodo,
  Users,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const defaultMenuItems = [
  {
    id: "dashboard",
    path: "/",
    label: "Dashboard",
    icon: Gauge,
    permission: "dashboard",
  },
  {
    id: "leave-management",
    path: "/leave-management",
    label: "İzin Yönetimi",
    icon: Calendar,
    permission: "leave_management",
  },
  {
    id: "tasks",
    path: "/tasks",
    label: "İş Takip",
    icon: ListTodo,
    permission: "tasks",
  },
  {
    id: "attendance",
    path: "/attendance",
    label: "Giriş Çıkış Verileri",
    icon: UserCheck,
    permission: "attendance",
  },
  {
    id: "notifications",
    path: "/notifications",
    label: "Bildirimler",
    icon: Bell,
    permission: "notifications",
  },
  {
    id: "personnel",
    path: "/personnel",
    label: "Personel Yönetimi",
    icon: Users,
    permission: "personnel",
  },
  {
    id: "shifts",
    path: "/shifts",
    label: "Vardiya Planlama",
    icon: Clock,
    permission: "shifts",
  },
  {
    id: "qr-management",
    path: "/qr-management",
    label: "QR Kod Yönetimi",
    icon: QrCode,
    permission: "qr_management",
  },
  {
    id: "reports",
    path: "/reports",
    label: "Raporlar",
    icon: BarChart3,
    permission: "reports",
  },
  {
    id: "branches",
    path: "/branches",
    label: "Şube Yönetimi",
    icon: Building,
    permission: "branches",
  },
  {
    id: "departments",
    path: "/departments",
    label: "Birim Yönetimi",
    icon: Building2,
    permission: "departments",
  },
  {
    id: "teams",
    path: "/teams",
    label: "Ekip Yönetimi",
    icon: Users,
    permission: "teams",
  },
  {
    id: "settings",
    path: "/settings",
    label: "Sistem Ayarları",
    icon: Cog,
    permission: "settings",
  },
  {
    id: "user-management",
    path: "/user-management",
    label: "Kullanıcı Yönetimi",
    icon: Shield,
    permission: "user_management",
  },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { hasPermission, user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isCollapsed.toString());
  }, [isCollapsed]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Get menu order from localStorage with state management
  const [menuItems, setMenuItems] = useState(defaultMenuItems);
  
  useEffect(() => {
    const getOrderedMenuItems = () => {
      const savedOrder = localStorage.getItem('menuOrder');
      console.log('Sidebar - localStorage menuOrder:', savedOrder);
      
      if (!savedOrder) {
        console.log('Sidebar - No saved order, using default');
        return defaultMenuItems;
      }
      
      try {
        const menuOrder = JSON.parse(savedOrder);
        console.log('Sidebar - Parsed menuOrder:', menuOrder);
        const orderedItems = [];
        
        // Apply saved order and enabled status
        for (const orderItem of menuOrder) {
          if (!orderItem.enabled) {
            console.log('Sidebar - Skipping disabled item:', orderItem.id);
            continue; // Skip disabled items
          }
          
          const menuItem = defaultMenuItems.find(item => item.id === orderItem.id);
          if (menuItem) {
            orderedItems.push(menuItem);
            console.log('Sidebar - Added menu item:', menuItem.id, menuItem.label);
          }
        }
        
        // Add any new menu items that aren't in saved order
        for (const menuItem of defaultMenuItems) {
          if (!menuOrder.find(orderItem => orderItem.id === menuItem.id)) {
            orderedItems.push(menuItem);
            console.log('Sidebar - Added missing item:', menuItem.id, menuItem.label);
          }
        }
        
        console.log('Sidebar - Final ordered items:', orderedItems.map(item => ({ id: item.id, label: item.label })));
        return orderedItems;
      } catch (error) {
        console.error('Sidebar - Error parsing menuOrder:', error);
        return defaultMenuItems;
      }
    };
    
    setMenuItems(getOrderedMenuItems());
  }, []);
  
  // Listen for menu order changes
  useEffect(() => {
    const handleMenuOrderChange = (e: CustomEvent) => {
      console.log('Sidebar - Menu order change event received:', e.detail);
      
      const getOrderedMenuItems = () => {
        const savedOrder = localStorage.getItem('menuOrder');
        console.log('Sidebar - Event: localStorage menuOrder:', savedOrder);
        
        if (!savedOrder) return defaultMenuItems;
        
        try {
          const menuOrder = JSON.parse(savedOrder);
          console.log('Sidebar - Event: Parsed menuOrder:', menuOrder);
          const orderedItems = [];
          
          // Apply saved order and enabled status
          for (const orderItem of menuOrder) {
            if (!orderItem.enabled) {
              console.log('Sidebar - Event: Skipping disabled item:', orderItem.id);
              continue; // Skip disabled items
            }
            
            const menuItem = defaultMenuItems.find(item => item.id === orderItem.id);
            if (menuItem) {
              orderedItems.push(menuItem);
              console.log('Sidebar - Event: Added menu item:', menuItem.id, menuItem.label);
            }
          }
          
          // Add any new menu items that aren't in saved order
          for (const menuItem of defaultMenuItems) {
            if (!menuOrder.find(orderItem => orderItem.id === menuItem.id)) {
              orderedItems.push(menuItem);
              console.log('Sidebar - Event: Added missing item:', menuItem.id, menuItem.label);
            }
          }
          
          console.log('Sidebar - Event: Final ordered items:', orderedItems.map(item => ({ id: item.id, label: item.label })));
          return orderedItems;
        } catch (error) {
          console.error('Sidebar - Event: Error parsing menuOrder:', error);
          return defaultMenuItems;
        }
      };
      
      setMenuItems(getOrderedMenuItems());
    };
    
    window.addEventListener('menuOrderChanged', handleMenuOrderChange as EventListener);
    return () => window.removeEventListener('menuOrderChanged', handleMenuOrderChange as EventListener);
  }, []);

  // İzin tabanlı menü filtrelemesi
  const filteredMenuItems = menuItems.filter(item => {
    return hasPermission(item.permission);
  });

  return (
    <div className={cn(
      "flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h1 className="text-xl font-bold text-gray-800">Çamlıca Personel</h1>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapse}
            className="p-2"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={cn(
                    "flex items-center p-3 rounded-lg transition-all text-gray-700 hover:bg-blue-50 hover:border-r-4 hover:border-primary w-full min-h-[48px]",
                    isActive && "bg-primary text-white border-r-4 border-blue-800",
                    isCollapsed ? "justify-center" : "space-x-3"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}