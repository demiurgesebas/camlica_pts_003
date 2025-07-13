import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, Building, Bell, QrCode } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export default function Header() {
  const { user, logout, refreshUser } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const { data: notifications } = useQuery({
    queryKey: ["/api/notifications"],
  });

  const unreadCount = notifications?.filter((n: any) => !n.isRead).length || 0;

  const handleLogout = async () => {
    try {
      console.log('Header logout - calling AuthContext logout...');
      await logout();
    } catch (error) {
      console.error("Header logout error:", error);
      // Force redirect even on error
      window.location.href = "/login";
    }
  };

  const handleQRCode = () => {
    setLocation("/qr-management");
  };

  const handleNotifications = () => {
    setLocation("/notifications");
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 fixed w-full top-0 z-50">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Users className="text-primary text-xl" />
            <h1 className="text-xl font-semibold text-gray-800">
              Çamlıca Personel Takip Sistemi
            </h1>
          </div>
          <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
            <Building className="w-4 h-4" />
            <span>Merkez Şube</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Notification Bell */}
          <button 
            onClick={handleNotifications}
            className="relative p-2 text-gray-600 hover:text-primary transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
              >
                {unreadCount}
              </Badge>
            )}
          </button>
          
          {/* QR Code Quick Access */}
          <Button
            onClick={handleQRCode}
            size="sm"
            className="bg-primary text-white hover:bg-blue-700"
          >
            <QrCode className="w-4 h-4 mr-1" />
            QR Kod
          </Button>
          
          {/* User Profile */}
          <div className="flex items-center space-x-3">
            <div className="text-right text-sm">
              <p className="font-medium text-gray-800">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email || "Kullanıcı"
                }
              </p>
              <p className="text-gray-600">
                {user?.role === "super_admin" 
                  ? "Süper Admin"
                  : user?.role === "admin"
                  ? "Yönetici"
                  : "Personel"
                }
              </p>
            </div>
            {user?.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt="Profil"
                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                {user?.firstName?.[0] || user?.email?.[0] || "U"}
              </div>
            )}
            <Button
              onClick={refreshUser}
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-800 mr-2"
            >
              Yenile
            </Button>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-800"
            >
              Çıkış
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
