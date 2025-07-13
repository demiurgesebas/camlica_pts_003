import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertLeaveRequestSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Plus, Check, X, Clock, User, ChevronUp, ChevronDown, Download } from "lucide-react";
import { z } from "zod";

const leaveRequestFormSchema = insertLeaveRequestSchema.extend({
  startDate: z.string().min(1, "Başlangıç tarihi gereklidir"),
  endDate: z.string().min(1, "Bitiş tarihi gereklidir"),
  leaveType: z.string().min(1, "İzin türü gereklidir"),
  totalDays: z.number().min(1, "Toplam gün sayısı gereklidir"),
});

export default function LeaveManagement() {
  const [, setLocation] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [showOnLeaveModal, setShowOnLeaveModal] = useState(false);
  const [selectedLeaveRequest, setSelectedLeaveRequest] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [sortField, setSortField] = useState<string>('startDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof leaveRequestFormSchema>>({
    resolver: zodResolver(leaveRequestFormSchema),
    defaultValues: {
      startDate: "",
      endDate: "",
      leaveType: "",
      totalDays: 1,
      reason: "",
    },
  });

  const { data: leaveRequests, isLoading } = useQuery({
    queryKey: ["/api/leave-requests"],
  });

  const { data: personnel } = useQuery({
    queryKey: ["/api/personnel"],
  });

  // Sıralama fonksiyonu
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Filtreleme ve arama fonksiyonu
  const filteredLeaveRequests = leaveRequests?.filter((request: any) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      request.personnel?.firstName?.toLowerCase().includes(searchLower) ||
      request.personnel?.lastName?.toLowerCase().includes(searchLower) ||
      request.personnel?.employeeNumber?.toLowerCase().includes(searchLower) ||
      request.leaveType?.toLowerCase().includes(searchLower) ||
      request.reason?.toLowerCase().includes(searchLower) ||
      request.status?.toLowerCase().includes(searchLower)
    );
  }) || [];

  // Sıralama uygulama
  const sortedLeaveRequests = [...filteredLeaveRequests].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue = '';
    let bValue = '';
    
    switch (sortField) {
      case 'personnel':
        aValue = `${a.personnel?.firstName || ''} ${a.personnel?.lastName || ''}`;
        bValue = `${b.personnel?.firstName || ''} ${b.personnel?.lastName || ''}`;
        break;
      case 'leaveType':
        aValue = a.leaveType || '';
        bValue = b.leaveType || '';
        break;
      case 'startDate':
        aValue = a.startDate || '';
        bValue = b.startDate || '';
        break;
      case 'status':
        aValue = a.status || '';
        bValue = b.status || '';
        break;
      default:
        return 0;
    }
    
    if (sortDirection === 'asc') {
      return aValue.localeCompare(bValue, 'tr');
    } else {
      return bValue.localeCompare(aValue, 'tr');
    }
  });

  // Sayfalama hesaplaması
  const totalPages = Math.ceil(sortedLeaveRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLeaveRequests = sortedLeaveRequests.slice(startIndex, startIndex + itemsPerPage);

  const createLeaveRequestMutation = useMutation({
    mutationFn: async (data: z.infer<typeof leaveRequestFormSchema>) => {
      await apiRequest("/api/leave-requests", { method: "POST", body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      toast({
        title: "Başarılı",
        description: "İzin talebi başarıyla oluşturuldu",
      });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const approveLeaveRequestMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/leave-requests/${id}/approve`, { method: "PUT" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      toast({
        title: "Başarılı",
        description: "İzin talebi onaylandı",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectLeaveRequestMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      await apiRequest(`/api/leave-requests/${id}/reject`, { method: "PUT", body: { reason } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      toast({
        title: "Başarılı",
        description: "İzin talebi reddedildi",
      });
      setRejectionDialogOpen(false);
      setRejectionReason("");
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // PDF dilekçe indirme fonksiyonu
  const downloadPetition = async (leaveRequestId: number) => {
    try {
      const response = await fetch(`/api/leave-requests/${leaveRequestId}/download-petition`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'PDF indirme hatası');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `izin_dilekce_${leaveRequestId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Başarılı",
        description: "Dilekçe PDF'i indirildi",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "PDF indirme hatası",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = (data: z.infer<typeof leaveRequestFormSchema>) => {
    // Calculate total days
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;
    
    createLeaveRequestMutation.mutate({
      ...data,
      totalDays,
    });
  };

  const handleApprove = (id: number) => {
    if (confirm("Bu izin talebini onaylamak istediğinizden emin misiniz?")) {
      approveLeaveRequestMutation.mutate(id);
    }
  };

  const handleReject = (leaveRequest: any) => {
    setSelectedLeaveRequest(leaveRequest);
    setRejectionDialogOpen(true);
  };

  const handleRejectionSubmit = () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Hata",
        description: "Ret nedeni gereklidir",
        variant: "destructive",
      });
      return;
    }

    rejectLeaveRequestMutation.mutate({
      id: selectedLeaveRequest.id,
      reason: rejectionReason,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Beklemede</Badge>;
      case "approved":
        return <Badge variant="default">Onaylandı</Badge>;
      case "rejected":
        return <Badge variant="destructive">Reddedildi</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    switch (type) {
      case "annual":
        return "Yıllık İzin";
      case "sick":
        return "Hastalık İzni";
      case "maternity":
        return "Doğum İzni";
      case "unpaid":
        return "Ücretsiz İzin";
      default:
        return type;
    }
  };

  const getPersonnelInfo = (personnelId: number) => {
    const person = (personnel as any[])?.find((p: any) => p.id === personnelId);
    if (person) {
      return {
        name: `${person.firstName} ${person.lastName}`,
        employeeNumber: person.employeeNumber,
        position: person.position,
        branch: person.branch?.name || "Belirtilmemiş",
        id: person.id
      };
    }
    return {
      name: "Bilinmeyen Personel",
      employeeNumber: "",
      position: "",
      branch: "",
      id: personnelId
    };
  };

  const handlePersonnelClick = (personnelId: number) => {
    setLocation(`/personnel?id=${personnelId}`);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">İzin Yönetimi</h1>
          <p className="text-gray-600">İzin talepleri ve onay süreçleri</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Yeni İzin Talebi
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni İzin Talebi Oluştur</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="personnelId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personel</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Personel seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(personnel as any[])?.map((person: any) => (
                            <SelectItem key={person.id} value={person.id.toString()}>
                              {person.firstName} {person.lastName} ({person.employeeNumber})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="leaveType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İzin Türü</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="İzin türü seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="annual">Yıllık İzin</SelectItem>
                          <SelectItem value="sick">Hastalık İzni</SelectItem>
                          <SelectItem value="maternity">Doğum İzni</SelectItem>
                          <SelectItem value="unpaid">Ücretsiz İzin</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Başlangıç Tarihi</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bitiş Tarihi</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Açıklama</FormLabel>
                      <FormControl>
                        <Textarea placeholder="İzin nedeni..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    disabled={createLeaveRequestMutation.isPending}
                  >
                    Oluştur
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* İzinli Personel Kartı */}
      <div className="mb-6">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
          onClick={() => setShowOnLeaveModal(true)}
        >
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                <User className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">İzinli Personel</p>
                <p className="text-2xl font-bold text-orange-600">
                  {(leaveRequests as any[])?.filter((request: any) => 
                    request.status === 'approved' && 
                    new Date(request.startDate) <= new Date() && 
                    new Date(request.endDate) >= new Date()
                  ).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            İzin Talepleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Arama ve Filtreleme */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4 mb-4">
            <h4 className="font-medium text-gray-900">Arama ve Filtreleme</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Personel adı, ID, izin türü..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Sayfa başına:</label>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                  setItemsPerPage(parseInt(value));
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setCurrentPage(1);
                  }}
                >
                  Filtreleri Temizle
                </Button>
              </div>
            </div>

            {/* Sonuç Bilgisi */}
            <div className="text-sm text-gray-600">
              {filteredLeaveRequests.length} izin talebi bulundu
              {searchTerm && ` (${leaveRequests?.length || 0} toplam talep içinde)`}
            </div>
          </div>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort('personnel')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Personel</span>
                      {sortField === 'personnel' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort('leaveType')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>İzin Türü</span>
                      {sortField === 'leaveType' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort('startDate')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Tarih Aralığı</span>
                      {sortField === 'startDate' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Süre</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Durum</span>
                      {sortField === 'status' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLeaveRequests?.map((request: any) => {
                  const personnelInfo = getPersonnelInfo(request.personnelId);
                  return (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div 
                          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors"
                          onClick={() => handlePersonnelClick(request.personnelId)}
                        >
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-blue-600 hover:text-blue-800">
                              {personnelInfo.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {personnelInfo.employeeNumber && `#${personnelInfo.employeeNumber}`}
                              {personnelInfo.position && ` • ${personnelInfo.position}`}
                            </p>
                            {personnelInfo.branch && (
                              <p className="text-xs text-gray-400">{personnelInfo.branch}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getLeaveTypeLabel(request.leaveType)}</TableCell>
                      <TableCell>
                        {new Date(request.startDate).toLocaleDateString('tr-TR')} - {new Date(request.endDate).toLocaleDateString('tr-TR')}
                      </TableCell>
                      <TableCell>{request.totalDays} gün</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          {request.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleApprove(request.id)}
                                className="text-green-600 hover:text-green-800"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReject(request)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {request.status === "approved" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadPetition(request.id)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Dilekçe PDF İndir"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          
          {/* Sayfalama */}
          {filteredLeaveRequests.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredLeaveRequests.length)} 
                arası, toplam {filteredLeaveRequests.length} sonuç
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Önceki
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNumber = i + 1;
                    return (
                      <Button
                        key={pageNumber}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNumber)}
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Sonraki
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* İzinli Personel Listesi Modal */}
      <Dialog open={showOnLeaveModal} onOpenChange={setShowOnLeaveModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>İzinli Personel Listesi</DialogTitle>
          </DialogHeader>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {(leaveRequests as any[])?.filter((request: any) => 
                request.status === 'approved' && 
                new Date(request.startDate) <= new Date() && 
                new Date(request.endDate) >= new Date()
              ).length === 0 ? (
                <p className="text-center text-gray-500 py-8">Şu anda izinli personel bulunmuyor.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(leaveRequests as any[])?.filter((request: any) => 
                    request.status === 'approved' && 
                    new Date(request.startDate) <= new Date() && 
                    new Date(request.endDate) >= new Date()
                  ).map((request: any) => {
                    const personnelInfo = getPersonnelInfo(request.personnelId);
                    const remainingDays = Math.ceil((new Date(request.endDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                    
                    return (
                      <Card 
                        key={request.id} 
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => {
                          setShowOnLeaveModal(false);
                          handlePersonnelClick(request.personnelId);
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-orange-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-blue-600 hover:text-blue-800">
                                {personnelInfo.name}
                              </h3>
                              <p className="text-sm text-gray-600">{personnelInfo.position}</p>
                              <p className="text-xs text-gray-500">{personnelInfo.branch}</p>
                              
                              <div className="mt-2 space-y-1">
                                <div className="flex items-center text-sm">
                                  <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                                  <span className="text-gray-600">
                                    {getLeaveTypeLabel(request.leaveType)}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500">
                                  {new Date(request.startDate).toLocaleDateString('tr-TR')} - {new Date(request.endDate).toLocaleDateString('tr-TR')}
                                </p>
                                <div className="flex items-center justify-between">
                                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                    İzinli
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {remainingDays > 0 ? `${remainingDays} gün kaldı` : 'Son gün'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>İzin Talebini Reddet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Lütfen ret nedenini belirtin:
            </p>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Ret nedeni..."
              rows={4}
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setRejectionDialogOpen(false)}
              >
                İptal
              </Button>
              <Button
                onClick={handleRejectionSubmit}
                disabled={rejectLeaveRequestMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                Reddet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
