import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Clock, User, MapPin, Download, Search, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface AttendanceRecord {
  id: number;
  personnelId: number;
  checkInTime: string;
  checkOutTime?: string;
  workHours?: number;
  status: 'present' | 'late' | 'absent';
  location?: string;
  notes?: string;
  qrScreenId?: number;
  qrScreen?: {
    id: number;
    screenId: string;
    name: string;
    branchId: number;
  };
  personnel?: {
    id: number;
    firstName: string;
    lastName: string;
    employeeId: string;
    position: string;
    branch?: {
      name: string;
    };
  };
}

export default function Attendance() {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [sortField, setSortField] = useState<string>('checkInTime');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [modalData, setModalData] = useState<{title: string, records: AttendanceRecord[]}>({title: '', records: []});

  // Tarih aralığı için URL oluştur
  const dateRangeQuery = startDate === endDate 
    ? `/api/attendance/date/${startDate}`
    : `/api/attendance/range/${startDate}/${endDate}`;

  // Devam ettirilecek kayıtları getir
  const { data: attendanceRecords = [], isLoading } = useQuery<AttendanceRecord[]>({
    queryKey: [dateRangeQuery],
  });

  // Şube verilerini getir
  const { data: branches = [] } = useQuery({
    queryKey: ["/api/branches"],
  });

  // Personel verilerini getir
  const { data: personnel = [] } = useQuery({
    queryKey: ["/api/personnel"],
  });

  // Bugünkü vardiya atamalarını getir
  const { data: todayShiftAssignments = [] } = useQuery({
    queryKey: ["/api/shift-assignments/today"],
  });

  // Sıralama fonksiyonu
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filtreleme, arama ve sıralama fonksiyonu
  const filteredRecords = attendanceRecords?.filter((record: AttendanceRecord) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      record.personnel?.firstName?.toLowerCase().includes(searchLower) ||
      record.personnel?.lastName?.toLowerCase().includes(searchLower) ||
      record.personnel?.employeeId?.toLowerCase().includes(searchLower) ||
      record.personnel?.position?.toLowerCase().includes(searchLower) ||
      record.personnel?.branch?.name?.toLowerCase().includes(searchLower) ||
      record.location?.toLowerCase().includes(searchLower)
    );
    
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    const matchesBranch = branchFilter === "all" || record.personnel?.branch?.name === branchFilter;
    
    return matchesSearch && matchesStatus && matchesBranch;
  }).sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue = '';
    let bValue = '';
    
    switch (sortField) {
      case 'checkInTime':
        aValue = a.checkInTime || '';
        bValue = b.checkInTime || '';
        break;
      case 'personnelName':
        aValue = `${a.personnel?.firstName || ''} ${a.personnel?.lastName || ''}`;
        bValue = `${b.personnel?.firstName || ''} ${b.personnel?.lastName || ''}`;
        break;
      case 'position':
        aValue = a.personnel?.position || '';
        bValue = b.personnel?.position || '';
        break;
      case 'status':
        aValue = a.status || '';
        bValue = b.status || '';
        break;
      case 'workHours':
        const aHours = a.workHours || 0;
        const bHours = b.workHours || 0;
        if (sortDirection === 'asc') {
          return aHours - bHours;
        } else {
          return bHours - aHours;
        }
      default:
        return 0;
    }
    
    if (sortDirection === 'asc') {
      return aValue.localeCompare(bValue, 'tr');
    } else {
      return bValue.localeCompare(aValue, 'tr');
    }
  }) || [];

  // Sayfalama hesaplaması
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + itemsPerPage);



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'absent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present': return 'Zamanında';
      case 'late': return 'Geç Geldi';
      case 'absent': return 'Gelmedi';
      default: return 'Bilinmiyor';
    }
  };

  const calculateWorkHours = (checkIn: string, checkOut?: string) => {
    if (!checkOut) return 0;
    const checkInTime = new Date(checkIn);
    const checkOutTime = new Date(checkOut);
    const diffInHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
    return Math.round(diffInHours * 10) / 10; // 1 ondalık basamak
  };

  const exportToExcel = () => {
    // Excel export fonksiyonu buraya eklenecek
    console.log("Excel export çalışıyor...");
  };

  const handleCardClick = (type: string) => {
    let title = '';
    let records: AttendanceRecord[] = [];

    switch (type) {
      case 'checkedIn':
        title = 'Bugün Giriş Yapan Personel';
        records = filteredRecords.filter(r => r.status === 'present' || r.status === 'late');
        break;
      case 'checkedOut':
        title = 'Bugün Çıkış Yapan Personel';
        records = filteredRecords.filter(r => r.checkOutTime);
        break;
      case 'absent':
        title = 'Devamsızlık Yapan Personel';
        records = filteredRecords.filter(r => r.status === 'absent');
        break;
      case 'activeShift':
        title = 'Aktif Vardiyada Çalışan Personel';
        // Bugünkü vardiya atamalarından personel bilgilerini al
        const activePersonnelIds = todayShiftAssignments
          .filter((s: any) => s.status === 'assigned')
          .map((s: any) => s.personnelId);
        
        records = filteredRecords.filter(r => 
          activePersonnelIds.includes(r.personnelId)
        );
        break;
    }

    setModalData({ title, records });
    setShowDetailModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Giriş Çıkış Verileri</h1>
            <p className="text-gray-600 mt-2">Personel devam durumu ve çalışma saatleri</p>
          </div>
          <Button onClick={exportToExcel} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Excel'e Aktar
          </Button>
        </div>



        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtreler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Başlangıç Tarihi</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endDate">Bitiş Tarihi</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="search">Personel Ara</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="İsim, sicil no..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Durum</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="present">Zamanında</SelectItem>
                    <SelectItem value="late">Geç Geldi</SelectItem>
                    <SelectItem value="absent">Gelmedi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Şube</Label>
                <Select value={branchFilter} onValueChange={setBranchFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Şubeler</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.name}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>



        {/* Attendance Records */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Devam Kayıtları ({startDate === endDate 
                ? format(new Date(startDate), 'dd MMMM yyyy', { locale: tr })
                : `${format(new Date(startDate), 'dd MMM', { locale: tr })} - ${format(new Date(endDate), 'dd MMM yyyy', { locale: tr })}`
              })
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredRecords.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Bu tarih için devam kaydı bulunamadı.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRecords.map((record) => (
                  <div
                    key={record.id}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:space-x-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {record.personnel?.firstName} {record.personnel?.lastName}
                          </p>
                          <p className="text-sm text-gray-600">
                            Sicil: {record.personnel?.employeeId}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            Giriş: {record.checkInTime ? format(new Date(record.checkInTime), 'HH:mm') : '-'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            Çıkış: {record.checkOutTime ? format(new Date(record.checkOutTime), 'HH:mm') : 'Devam ediyor'}
                          </span>
                        </div>
                        {record.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{record.location}</span>
                          </div>
                        )}
                        {record.qrScreen && (
                          <div className="flex items-center space-x-1">
                            <div className="w-4 h-4 bg-blue-100 rounded flex items-center justify-center">
                              <span className="text-xs font-bold text-blue-600">Q</span>
                            </div>
                            <span>Ekran: {record.qrScreen.name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 mt-3 sm:mt-0">
                      <Badge className={getStatusColor(record.status)}>
                        {getStatusText(record.status)}
                      </Badge>
                      {record.checkOutTime && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">
                            {calculateWorkHours(record.checkInTime, record.checkOutTime)} saat
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail Modal */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{modalData.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {modalData.records.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Kayıt bulunamadı
                </div>
              ) : (
                modalData.records.map((record) => (
                  <div
                    key={record.id}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {record.personnel?.firstName} {record.personnel?.lastName}
                          </p>
                          <p className="text-sm text-gray-600">
                            Sicil: {record.personnel?.employeeId} | {record.personnel?.position}
                          </p>
                          <p className="text-xs text-gray-500">
                            Şube: {record.personnel?.branch?.name || 'Belirtilmemiş'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            Giriş: {record.checkInTime ? format(new Date(record.checkInTime), 'HH:mm') : '-'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            Çıkış: {record.checkOutTime ? format(new Date(record.checkOutTime), 'HH:mm') : 'Devam ediyor'}
                          </span>
                        </div>
                        {record.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{record.location}</span>
                          </div>
                        )}
                        {record.qrScreen && (
                          <div className="flex items-center space-x-1">
                            <div className="w-4 h-4 bg-blue-100 rounded flex items-center justify-center">
                              <span className="text-xs font-bold text-blue-600">Q</span>
                            </div>
                            <span>Ekran: {record.qrScreen.name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 mt-3 sm:mt-0">
                      <Badge className={getStatusColor(record.status)}>
                        {getStatusText(record.status)}
                      </Badge>
                      {record.checkOutTime && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">
                            {calculateWorkHours(record.checkInTime, record.checkOutTime)} saat
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}