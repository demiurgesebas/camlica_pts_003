import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { UserPlus, CalendarPlus, Bell, FileSpreadsheet } from "lucide-react";

export default function QuickActions() {
  const [, navigate] = useLocation();

  const actions = [
    {
      label: "Yeni Personel Ekle",
      icon: UserPlus,
      path: "/personnel",
      className: "bg-primary hover:bg-blue-700 text-white"
    },
    {
      label: "Vardiya Planla", 
      icon: CalendarPlus,
      path: "/shifts",
      className: "bg-green-600 hover:bg-green-700 text-white"
    },
    {
      label: "Bildirim Gönder",
      icon: Bell,
      path: "/notifications", 
      className: "bg-orange-500 hover:bg-orange-600 text-white"
    },
    {
      label: "Rapor İndir",
      icon: FileSpreadsheet,
      path: "/reports",
      className: "bg-gray-600 hover:bg-gray-700 text-white"
    }
  ];

  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">
          Hızlı İşlemler
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                onClick={() => navigate(action.path)}
                className={`w-full py-3 px-4 text-sm transition-colors flex items-center justify-center ${action.className}`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {action.label}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
