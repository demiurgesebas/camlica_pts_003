import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, LogIn, CalendarPlus, LogOut } from "lucide-react";

interface RecentActivitiesProps {
  activities?: any[];
  isLoading: boolean;
}

export default function RecentActivities({ activities, isLoading }: RecentActivitiesProps) {
  // Mock activities for display
  const mockActivities = [
    {
      id: 1,
      type: "check_in",
      userName: "Mehmet Demir",
      action: "giriş yaptı",
      time: "2 dakika önce",
      location: "Kapı 1",
      icon: LogIn,
      iconBg: "bg-green-100",
      iconColor: "text-green-600"
    },
    {
      id: 2,
      type: "leave_request",
      userName: "Ayşe Kaya",
      action: "izin talebi oluşturdu",
      time: "15 dakika önce",
      location: "Yıllık İzin",
      icon: CalendarPlus,
      iconBg: "bg-blue-100", 
      iconColor: "text-blue-600"
    },
    {
      id: 3,
      type: "check_out",
      userName: "Emre Özkan",
      action: "çıkış yaptı",
      time: "1 saat önce",
      location: "Kapı 2",
      icon: LogOut,
      iconBg: "bg-red-100",
      iconColor: "text-red-600"
    }
  ];

  return (
    <Card className="card-hover">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800">
            Son Personel Hareketleri
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-primary hover:text-blue-700">
            <History className="w-4 h-4 mr-1" />
            Tümünü Gör
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {mockActivities.map((activity) => {
              const Icon = activity.icon;
              return (
                <div key={activity.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-10 h-10 ${activity.iconBg} rounded-full flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${activity.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">
                      <span className="font-semibold">{activity.userName}</span> {activity.action}
                    </p>
                    <p className="text-xs text-gray-600">{activity.time}</p>
                  </div>
                  <div className="text-xs text-gray-500">{activity.location}</div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
