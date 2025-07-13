import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import StatsCards from "@/components/dashboard/stats-cards";
import ShiftStatus from "@/components/dashboard/shift-status";
import RecentActivities from "@/components/dashboard/recent-activities";
import QRManagementWidget from "@/components/dashboard/qr-management";
import PendingLeaves from "@/components/dashboard/pending-leaves";
import QuickActions from "@/components/dashboard/quick-actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, User, Phone, Mail, Building, Calendar, Settings, Plus, X } from "lucide-react";

// Sürüklenebilir kart bileşeni
interface DashboardCardProps {
  id: string;
  index: number;
  card: {
    id: string;
    title: string;
    value: string | number;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: React.ReactNode;
    onClick: () => void;
  };
  moveCard: (dragIndex: number, hoverIndex: number) => void;
  onRemove: (id: string) => void;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ id, index, card, moveCard, onRemove }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'card',
    item: { id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'card',
    hover: (draggedItem: { id: string; index: number }) => {
      if (draggedItem.index !== index) {
        moveCard(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  return (
    <div ref={(node) => drag(drop(node))} className={`relative ${isDragging ? 'opacity-50' : ''}`}>
      <Card 
        className={`${card.bgColor} ${card.borderColor} cursor-pointer hover:shadow-lg transition-shadow`}
        onClick={card.onClick}
      >
        <CardContent className="p-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(card.id);
            }}
            className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${card.color} font-medium`}>{card.title}</p>
              <p className={`text-2xl font-bold ${card.color.replace('text-', 'text-').replace('-600', '-900')}`}>
                {card.value}
              </p>
              <p className={`text-xs ${card.color.replace('-600', '-500')} mt-1`}>Detaylar için tıklayın</p>
            </div>
            <div className={card.color}>
              {card.icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [showPersonnelModal, setShowPersonnelModal] = useState(false);
  const [selectedCardType, setSelectedCardType] = useState<string>("");
  const [modalTitle, setModalTitle] = useState("");
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  const [showAddCardDialog, setShowAddCardDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  // Kart sırası ve görünürlük yönetimi
  const [cardOrder, setCardOrder] = useState([
    'attendance-in', 'shifts', 'leaves', 'attendance-out', 'recent-activity'
  ]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 30000, // 30 saniyede bir yenile
  });

  const { data: shiftAssignments, isLoading: shiftsLoading } = useQuery({
    queryKey: ["/api/shift-assignments/today"],
    refetchInterval: 60000, // 1 dakikada bir yenile
  });

  const { data: pendingLeaves, isLoading: leavesLoading } = useQuery({
    queryKey: ["/api/leave-requests/pending"],
    refetchInterval: 60000, // 1 dakikada bir yenile
  });

  const { data: attendanceRecords, isLoading: attendanceLoading } = useQuery({
    queryKey: ["/api/attendance/today"],
    refetchInterval: 30000, // 30 saniyede bir yenile
  });

  const { data: allPersonnel, isLoading: personnelLoading } = useQuery({
    queryKey: ["/api/personnel"],
    enabled: showPersonnelModal,
  });

  const { data: recentActivities, isLoading: activitiesLoading } = useQuery({
    queryKey: ["/api/dashboard/recent-activities"],
    refetchInterval: 30000, // 30 saniyede bir yenile
  });

  // Güncelleme zamanını otomatik olarak yenile
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdateTime(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Kart sürükleme fonksiyonu
  const moveCard = (dragIndex: number, hoverIndex: number) => {
    const newOrder = [...cardOrder];
    const draggedCard = newOrder[dragIndex];
    newOrder.splice(dragIndex, 1);
    newOrder.splice(hoverIndex, 0, draggedCard);
    setCardOrder(newOrder);
  };

  // Kart kaldırma fonksiyonu
  const removeCard = (cardId: string) => {
    setCardOrder(cardOrder.filter(id => id !== cardId));
  };

  // Kart ekleme fonksiyonu
  const addCard = (cardId: string) => {
    if (!cardOrder.includes(cardId)) {
      setCardOrder([...cardOrder, cardId]);
    }
    setShowAddCardDialog(false);
  };



  const handleCardClick = (cardType: string) => {
    setSelectedCardType(cardType);
    
    switch (cardType) {
      case "total":
        setModalTitle("Tüm Personel Listesi");
        break;
      case "working":
        setModalTitle("Bugün Çalışan Personel");
        break;
      case "leave":
        setModalTitle("İzinli Personel");
        break;
      case "late":
        setModalTitle("Geç Gelen Personel");
        break;
    }
    
    setShowPersonnelModal(true);
  };

  const handlePersonnelClick = (personnelId: number) => {
    setShowPersonnelModal(false);
    setLocation(`/personnel?id=${personnelId}`);
  };

  const getFilteredPersonnel = () => {
    if (!allPersonnel) return [];
    
    switch (selectedCardType) {
      case "total":
        return allPersonnel;
      case "working":
        // Filter personnel who have attendance today and are not on leave
        return allPersonnel.filter((p: any) => {
          const todayAttendance = attendanceRecords?.find((a: any) => a.personnelId === p.id);
          return todayAttendance && todayAttendance.status !== 'absent';
        });
      case "leave":
        // Filter personnel who are on leave today
        return allPersonnel.filter((p: any) => {
          const todayAttendance = attendanceRecords?.find((a: any) => a.personnelId === p.id);
          return todayAttendance?.status === 'absent' || pendingLeaves?.some((l: any) => l.personnelId === p.id);
        });
      case "late":
        // Filter personnel who arrived late today
        return allPersonnel.filter((p: any) => {
          const todayAttendance = attendanceRecords?.find((a: any) => a.personnelId === p.id);
          return todayAttendance?.status === 'late';
        });
      default:
        return allPersonnel;
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600">Personel takip sistemi genel bakış - Anlık veriler</p>
          <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Canlı veri akışı
            </div>
            <div>
              Son güncelleme: {lastUpdateTime.toLocaleTimeString('tr-TR')}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Select defaultValue="24h">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Son 24 Saat</SelectItem>
              <SelectItem value="7">Son 7 Gün</SelectItem>
              <SelectItem value="30">Son 30 Gün</SelectItem>
              <SelectItem value="month">Bu Ay</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-primary hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Rapor Al
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} isLoading={statsLoading} onCardClick={handleCardClick} />

      {/* Bugünkü Anlık Özet */}
      <DndProvider backend={HTML5Backend}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Anlık Kartlar</h3>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAddCardDialog(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Kart Ekle
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setEditMode(!editMode)}
            >
              <Settings className="w-4 h-4 mr-1" />
              {editMode ? 'Tamamla' : 'Düzenle'}
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card 
            className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 cursor-pointer hover:shadow-lg transition-shadow relative"
            onClick={() => !editMode && setLocation('/attendance')}
          >
            {editMode && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Kartı gizle
                }}
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Bugün Giriş Yapan</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {attendanceRecords?.filter(r => r.status === 'present' || r.status === 'late').length || 0}
                  </p>
                  <p className="text-xs text-blue-500 mt-1">Detaylar için tıklayın</p>
                </div>
                <div className="text-blue-600">
                  <User className="w-8 h-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 cursor-pointer hover:shadow-lg transition-shadow relative"
            onClick={() => !editMode && setLocation('/shifts')}
          >
            {editMode && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Kartı gizle
                }}
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Aktif Vardiya</p>
                  <p className="text-2xl font-bold text-green-900">
                    {shiftAssignments?.filter(s => s.status === 'assigned').length || 0}
                  </p>
                  <p className="text-xs text-green-500 mt-1">Detaylar için tıklayın</p>
                </div>
                <div className="text-green-600">
                  <Calendar className="w-8 h-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200 cursor-pointer hover:shadow-lg transition-shadow relative"
            onClick={() => !editMode && setLocation('/leave-management')}
          >
            {editMode && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Kartı gizle
                }}
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 font-medium">Bekleyen İzin</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {pendingLeaves?.length || 0}
                  </p>
                  <p className="text-xs text-yellow-500 mt-1">Detaylar için tıklayın</p>
                </div>
                <div className="text-yellow-600">
                  <Calendar className="w-8 h-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 cursor-pointer hover:shadow-lg transition-shadow relative"
            onClick={() => !editMode && setLocation('/attendance')}
          >
            {editMode && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Kartı gizle
                }}
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">Bugün Çıkış Yapan</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {attendanceRecords?.filter(r => r.checkOutTime).length || 0}
                  </p>
                  <p className="text-xs text-orange-500 mt-1">Detaylar için tıklayın</p>
                </div>
                <div className="text-orange-600">
                  <User className="w-8 h-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 cursor-pointer hover:shadow-lg transition-shadow relative"
            onClick={() => !editMode && setLocation('/notifications')}
          >
            {editMode && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Kartı gizle
                }}
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Son Aktivite</p>
                  <p className="text-xl font-bold text-purple-900">
                    {recentActivities?.[0]?.timestamp ? 
                      new Date(recentActivities[0].timestamp).toLocaleTimeString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '--:--'
                    }
                  </p>
                  <p className="text-xs text-purple-500 mt-1">Detaylar için tıklayın</p>
                </div>
                <div className="text-purple-600">
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DndProvider>

      {/* Kart Ekleme Dialogu */}
      <Dialog open={showAddCardDialog} onOpenChange={setShowAddCardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Kart Ekle</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 p-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAddCardDialog(false);
                // Yeni kart ekleme mantığı buraya
              }}
              className="p-6 h-auto flex-col"
            >
              <User className="w-8 h-8 mb-2" />
              <span>Personel Sayısı</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAddCardDialog(false);
                // Yeni kart ekleme mantığı buraya
              }}
              className="p-6 h-auto flex-col"
            >
              <Calendar className="w-8 h-8 mb-2" />
              <span>Vardiya Durumu</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAddCardDialog(false);
                // Yeni kart ekleme mantığı buraya
              }}
              className="p-6 h-auto flex-col"
            >
              <Building className="w-8 h-8 mb-2" />
              <span>Şube Bilgisi</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAddCardDialog(false);
                // Yeni kart ekleme mantığı buraya
              }}
              className="p-6 h-auto flex-col"
            >
              <Settings className="w-8 h-8 mb-2" />
              <span>Sistem Durumu</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <ShiftStatus 
            assignments={shiftAssignments} 
            isLoading={shiftsLoading} 
          />
          <RecentActivities 
            activities={recentActivities} 
            isLoading={activitiesLoading} 
          />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <QRManagementWidget />
          <PendingLeaves 
            leaves={pendingLeaves} 
            isLoading={leavesLoading} 
          />
          <QuickActions />
        </div>
      </div>

      {/* Personnel List Modal */}
      <Dialog open={showPersonnelModal} onOpenChange={setShowPersonnelModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{modalTitle}</DialogTitle>
          </DialogHeader>
          
          {personnelLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {getFilteredPersonnel().length === 0 ? (
                <p className="text-center text-gray-500 py-8">Bu kategoride personel bulunamadı.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getFilteredPersonnel().map((person: any) => (
                    <Card 
                      key={person.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handlePersonnelClick(person.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">
                              {person.firstName} {person.lastName}
                            </h3>
                            <p className="text-gray-600 text-sm">{person.position}</p>
                            
                            <div className="mt-2 space-y-1">
                              {person.phone && (
                                <div className="flex items-center text-sm text-gray-500">
                                  <Phone className="w-4 h-4 mr-2" />
                                  {person.phone}
                                </div>
                              )}
                              {person.email && (
                                <div className="flex items-center text-sm text-gray-500">
                                  <Mail className="w-4 h-4 mr-2" />
                                  {person.email}
                                </div>
                              )}
                              {person.branch && (
                                <div className="flex items-center text-sm text-gray-500">
                                  <Building className="w-4 h-4 mr-2" />
                                  {person.branch.name}
                                </div>
                              )}
                            </div>

                            <div className="mt-3 flex items-center space-x-2">
                              <Badge variant={person.isActive ? "default" : "secondary"}>
                                {person.isActive ? "Aktif" : "Pasif"}
                              </Badge>
                              {person.employeeNumber && (
                                <Badge variant="outline">#{person.employeeNumber}</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
