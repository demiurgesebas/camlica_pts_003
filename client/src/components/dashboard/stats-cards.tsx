import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, CalendarX, Clock } from "lucide-react";

interface StatsCardsProps {
  stats?: {
    totalPersonnel: number;
    workingToday: number;
    onLeave: number;
    lateArrivals: number;
  };
  isLoading: boolean;
  onCardClick?: (cardType: string) => void;
}

export default function StatsCards({ stats, isLoading, onCardClick }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Toplam Personel",
      value: stats?.totalPersonnel || 0,
      change: "+5",
      changeLabel: "bu ay",
      icon: Users,
      gradient: "stat-card",
      textColor: "text-blue-100",
      iconColor: "text-blue-200",
      changeColor: "text-green-300",
      type: "total"
    },
    {
      title: "Bugün Çalışan",
      value: stats?.workingToday || 0,
      change: "70%",
      changeLabel: "katılım oranı",
      icon: UserCheck,
      gradient: "stat-card-secondary",
      textColor: "text-green-100",
      iconColor: "text-green-200",
      changeColor: "text-white",
      type: "working"
    },
    {
      title: "İzinli Personel",
      value: stats?.onLeave || 0,
      change: "3",
      changeLabel: "onay bekliyor",
      icon: CalendarX,
      gradient: "stat-card-warning",
      textColor: "text-orange-100",
      iconColor: "text-orange-200",
      changeColor: "text-white",
      type: "leave"
    },
    {
      title: "Geç Gelenler",
      value: stats?.lateArrivals || 0,
      change: "-2",
      changeLabel: "dünkü karşılaştırma",
      icon: Clock,
      gradient: "stat-card-error",
      textColor: "text-red-100",
      iconColor: "text-red-200",
      changeColor: "text-white",
      type: "late"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card 
            key={index} 
            className={`${card.gradient} text-white card-hover cursor-pointer transition-all duration-200 hover:scale-105`}
            onClick={() => onCardClick?.(card.type)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${card.textColor} text-sm`}>{card.title}</p>
                  <p className="text-3xl font-bold">{card.value}</p>
                </div>
                <Icon className={`text-2xl ${card.iconColor}`} />
              </div>
              <div className={`mt-4 text-sm ${card.textColor}`}>
                <span className={card.changeColor}>{card.change}</span> {card.changeLabel}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
