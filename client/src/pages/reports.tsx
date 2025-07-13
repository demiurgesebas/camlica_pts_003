import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart3, 
  Download, 
  Calendar, 
  Users, 
  Clock, 
  TrendingUp, 
  FileSpreadsheet,
  Printer
} from "lucide-react";

export default function Reports() {
  const [reportType, setReportType] = useState<string>("attendance");
  const [dateRange, setDateRange] = useState<string>("7");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const { toast } = useToast();

  const { data: branches } = useQuery({
    queryKey: ["/api/branches"],
  });

  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  // Mock report data
  const attendanceReportData = [
    { name: "Pazartesi", present: 45, absent: 5, late: 3 },
    { name: "Salı", present: 48, absent: 2, late: 2 },
    { name: "Çarşamba", present: 47, absent: 3, late: 4 },
    { name: "Perşembe", present: 46, absent: 4, late: 1 },
    { name: "Cuma", present: 49, absent: 1, late: 2 },
  ];

  const leaveReportData = [
    { type: "Yıllık İzin", count: 12, percentage: 60 },
    { type: "Hastalık İzni", count: 5, percentage: 25 },
    { type: "Doğum İzni", count: 2, percentage: 10 },
    { type: "Ücretsiz İzin", count: 1, percentage: 5 },
  ];

  const performanceReportData = [
    { department: "Satış", completed: 85, pending: 12, overdue: 3 },
    { department: "Üretim", completed: 92, pending: 6, overdue: 2 },
    { department: "İnsan Kaynakları", completed: 88, pending: 10, overdue: 2 },
    { department: "Muhasebe", completed: 95, pending: 4, overdue: 1 },
  ];

  const handleExportReport = (format: string) => {
    toast({
      title: "Rapor İndiriliyor",
      description: `${format.toUpperCase()} formatında rapor hazırlanıyor...`,
    });
    
    // Simulate download
    setTimeout(() => {
      toast({
        title: "Başarılı",
        description: "Rapor başarıyla indirildi",
      });
    }, 2000);
  };

  const getReportTitle = () => {
    switch (reportType) {
      case "attendance":
        return "Devam Raporu";
      case "leave":
        return "İzin Kullanım Raporu";
      case "performance":
        return "Performans Raporu";
      case "shift":
        return "Vardiya Raporu";
      default:
        return "Rapor";
    }
  };

  const renderAttendanceReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam Katılım</p>
                <p className="text-2xl font-bold text-green-600">94%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Geç Gelen</p>
                <p className="text-2xl font-bold text-orange-600">12</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Devamsızlık</p>
                <p className="text-2xl font-bold text-red-600">15</p>
              </div>
              <Users className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ortalama Çalışma</p>
                <p className="text-2xl font-bold text-blue-600">8.2h</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Haftalık Devam Durumu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {attendanceReportData.map((day, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">{day.name}</span>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Mevcut: {day.present}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Devamsız: {day.absent}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span>Geç: {day.late}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderLeaveReport = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>İzin Türü Dağılımı</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leaveReportData.map((leave, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{leave.type}</span>
                  <span className="text-sm text-gray-600">{leave.count} talep</span>
                </div>
                <Progress value={leave.percentage} className="h-2" />
                <div className="text-right text-sm text-gray-500">%{leave.percentage}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>İzin İstatistikleri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">20</p>
              <p className="text-sm text-gray-600">Toplam Talep</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">18</p>
              <p className="text-sm text-gray-600">Onaylanan</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">2</p>
              <p className="text-sm text-gray-600">Bekleyen</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">0</p>
              <p className="text-sm text-gray-600">Reddedilen</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPerformanceReport = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Departman Bazlı Performans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performanceReportData.map((dept, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">{dept.department}</h3>
                  <Badge variant="outline">
                    %{Math.round((dept.completed / (dept.completed + dept.pending + dept.overdue)) * 100)} tamamlama
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-600">{dept.completed}</p>
                    <p className="text-gray-600">Tamamlanan</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-orange-600">{dept.pending}</p>
                    <p className="text-gray-600">Devam Eden</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-red-600">{dept.overdue}</p>
                    <p className="text-gray-600">Geciken</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderShiftReport = () => (
    <Card>
      <CardHeader>
        <CardTitle>Vardiya Raporu</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-gray-500">
          <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>Vardiya raporu verileri hazırlanıyor...</p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Raporlama ve Analiz</h1>
          <p className="text-gray-600">Detaylı raporlar ve istatistikler</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={() => handleExportReport("excel")}
            variant="outline"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Excel
          </Button>
          <Button 
            onClick={() => handleExportReport("pdf")}
            variant="outline"
          >
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button 
            onClick={() => handleExportReport("print")}
            variant="outline"
          >
            <Printer className="w-4 h-4 mr-2" />
            Yazdır
          </Button>
        </div>
      </div>

      {/* Report Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Rapor Türü</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attendance">Devam Raporu</SelectItem>
                  <SelectItem value="leave">İzin Raporu</SelectItem>
                  <SelectItem value="performance">Performans Raporu</SelectItem>
                  <SelectItem value="shift">Vardiya Raporu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Zaman Aralığı</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Son 7 Gün</SelectItem>
                  <SelectItem value="30">Son 30 Gün</SelectItem>
                  <SelectItem value="month">Bu Ay</SelectItem>
                  <SelectItem value="quarter">Bu Çeyrek</SelectItem>
                  <SelectItem value="year">Bu Yıl</SelectItem>
                  <SelectItem value="custom">Özel Aralık</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Şube</label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Şubeler</SelectItem>
                  {branches?.map((branch: any) => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {dateRange === "custom" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Başlangıç</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bitiş</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            {getReportTitle()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reportType === "attendance" && renderAttendanceReport()}
          {reportType === "leave" && renderLeaveReport()}
          {reportType === "performance" && renderPerformanceReport()}
          {reportType === "shift" && renderShiftReport()}
        </CardContent>
      </Card>
    </div>
  );
}