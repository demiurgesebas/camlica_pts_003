import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertShiftSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Clock, Plus, Edit, Trash2, Calendar, Upload, Download, FileSpreadsheet, ChevronUp, ChevronDown, Search, X, User, UserPlus, UserMinus } from "lucide-react";
import { z } from "zod";
import { auth } from "@/lib/firebase";

const shiftFormSchema = z.object({
  name: z.string().min(1, "Vardiya adı gereklidir"),
  startTime: z.string().min(1, "Başlangıç saati gereklidir"),
  endTime: z.string().min(1, "Bitiş saati gereklidir"),
  branchId: z.string().optional(),
  isActive: z.boolean().default(true),
});

export default function Shifts() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<any>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [importingShifts, setImportingShifts] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedFile, setSelectedFile] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [shiftImportDialogOpen, setShiftImportDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [sortField, setSortField] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [shiftPersonnelDialogOpen, setShiftPersonnelDialogOpen] = useState(false);
  const [personnelSearchTerm, setPersonnelSearchTerm] = useState('');
  const [selectedAssignments, setSelectedAssignments] = useState<number[]>([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof shiftFormSchema>>({
    resolver: zodResolver(shiftFormSchema),
    defaultValues: {
      name: "",
      startTime: "",
      endTime: "",
      branchId: "",
      isActive: true,
    },
  });

  const { data: shifts, isLoading } = useQuery({
    queryKey: ["/api/shifts"],
  });

  const { data: branches } = useQuery({
    queryKey: ["/api/branches"],
  });

  const { data: shiftAssignments, isLoading: isLoadingAssignments, error: assignmentsError } = useQuery({
    queryKey: ["/api/shift-assignments"],
    retry: 1,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
  });

  // Debug için console'a yazdır
  console.log('Shift assignments data:', shiftAssignments);
  console.log('Shift assignments loading:', isLoadingAssignments);
  console.log('Shift assignments error:', assignmentsError);

  const { data: personnel } = useQuery({
    queryKey: ["/api/personnel"],
  });

  const createShiftMutation = useMutation({
    mutationFn: async (data: z.infer<typeof shiftFormSchema>) => {
      await apiRequest("/api/shifts", { method: 'POST', body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      toast({
        title: "Başarılı",
        description: "Vardiya başarıyla oluşturuldu",
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

  const updateShiftMutation = useMutation({
    mutationFn: async (data: z.infer<typeof shiftFormSchema>) => {
      await apiRequest(`/api/shifts/${editingShift.id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      toast({
        title: "Başarılı",
        description: "Vardiya bilgileri güncellendi",
      });
      setDialogOpen(false);
      setEditingShift(null);
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

  const deleteShiftMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/shifts/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      toast({
        title: "Başarılı",
        description: "Vardiya silindi",
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

  const updatePersonnelShiftMutation = useMutation({
    mutationFn: async ({ personnelId, shiftId }: { personnelId, shiftId: number | null }) => {
      await apiRequest(`/api/personnel/${personnelId}`, { method: 'PUT', body: JSON.stringify({ shiftId }) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personnel"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      toast({
        title: "Başarılı",
        description: "Personel vardiya ataması güncellendi",
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

  // importExcelShiftsMutation ve eski apiRequest('/api/excel/import-shifts', ...) fonksiyonunu tamamen kaldırıyorum.
  // Sadece gelişmiş endpoint (fetch('/api/excel/upload-and-import-shifts-advanced', ...)) kullanılacak.

  const bulkDeleteMutation = useMutation({
    mutationFn: async (assignmentIds: number[]) => {
      return await apiRequest("/api/shift-assignments/bulk-delete", { method: 'POST', body: JSON.stringify({ assignmentIds }) });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Başarılı",
        description: `${data.deleted} vardiya ataması silindi.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/shift-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setSelectedAssignments([]);
      setBulkDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Vardiya atamaları silinemedi",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (data: z.infer<typeof shiftFormSchema>) => {
    const submitData = {
      ...data,
      branchId: data.branchId ? parseInt(data.branchId, 10) : undefined,
    };
    
    if (editingShift) {
      updateShiftMutation.mutate(submitData);
    } else {
      createShiftMutation.mutate(submitData);
    }
  };

  const handleEdit = (shift: any) => {
    setEditingShift(shift);
    form.reset({
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      branchId: shift.branchId ? shift.branchId.toString() : "",
      isActive: shift.isActive,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Bu vardiyayı silmek istediğinizden emin misiniz?")) {
      deleteShiftMutation.mutate(id);
    }
  };

  const handleShiftClick = (shift: any) => {
    setSelectedShift(shift);
    setPersonnelSearchTerm(''); // Arama terimini sıfırla
    setShiftPersonnelDialogOpen(true);
  };

  // Personel filtreleme fonksiyonu
  const filterPersonnel = (personnelList: any[]) => {
    if (!personnelSearchTerm) return personnelList;
    
    return personnelList.filter((person: any) => {
      const fullName = `${person.firstName} ${person.lastName}`.toLowerCase();
      const position = (person.position || '').toLowerCase();
      const employeeNumber = (person.employeeNumber || '').toLowerCase();
      const searchLower = personnelSearchTerm.toLowerCase();
      
      return fullName.includes(searchLower) || 
             position.includes(searchLower) || 
             employeeNumber.includes(searchLower);
    });
  };

  const handleAddPersonnelToShift = (personnelId: number) => {
    updatePersonnelShiftMutation.mutate({ personnelId, shiftId: selectedShift?.id });
  };

  const handleRemovePersonnelFromShift = (personnelId: number) => {
    updatePersonnelShiftMutation.mutate({ personnelId, shiftId: null });
  };

  const handleNewShift = () => {
    setEditingShift(null);
    form.reset();
    setDialogOpen(true);
  };

  // Excel import mutation
  const importShiftsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile && !uploadedFile) {
        throw new Error("Lütfen bir Excel dosyası seçin");
      }
      if (uploadedFile) {
        // Yeni dosya yükleme
        const formData = new FormData();
        formData.append('file', uploadedFile);
        formData.append('month', selectedMonth.toString());
        formData.append('year', selectedYear.toString());
        // Firebase Authentication token'ını al
        let idToken = null;
        if (auth.currentUser) {
          idToken = await auth.currentUser.getIdToken();
          console.log("[DEBUG] ID Token alındı:", idToken);
        } else {
          console.log("[DEBUG] auth.currentUser is null! Kullanıcı login değil veya login state henüz oluşmadı.");
        }
        // fetch ile gönderilen header'ı da logla
        console.log("[DEBUG] fetch Authorization header:", idToken ? `Bearer ${idToken}` : null);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 dakika timeout
        const response = await fetch('/api/excel/upload-and-import-shifts-advanced', {
          method: 'POST',
          body: formData,
          headers: {
            ...(idToken && { 'Authorization': `Bearer ${idToken}` }),
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Dosya yüklenemedi');
        }
        return await response.json();
      } else {
        // Mevcut dosya kullanma (eski sistem, opsiyonel)
        return await apiRequest("/api/excel/import-shifts", { method: 'POST', body: JSON.stringify({ fileName: selectedFile, month: selectedMonth, year: selectedYear }) });
      }
    },
    onSuccess: (data: any) => {
      toast({
        title: "Başarılı",
        description: `${data.message || ''}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/shift-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setShiftImportDialogOpen(false);
    },
    onError: (error: any) => {
      console.error("Excel vardiya import hatası:", error);
      toast({
        title: "Hata",
        description: error.message || "Excel dosyası import edilemedi",
        variant: "destructive",
      });
    }
  });

  const handleShiftImport = () => {
    setImportingShifts(true);
    importShiftsMutation.mutate();
    setImportingShifts(false);
  };

  const handleSelectAll = () => {
    const filteredAssignments = getFilteredAndSortedAssignments();
    if (selectedAssignments.length === filteredAssignments.length) {
      setSelectedAssignments([]);
    } else {
      setSelectedAssignments(filteredAssignments.map((assignment: any) => assignment.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedAssignments.length === 0) {
      toast({
        title: "Uyarı",
        description: "Lütfen silinecek vardiya atamalarını seçin.",
        variant: "destructive",
      });
      return;
    }
    setBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = () => {
    if (selectedAssignments.length > 0) {
      bulkDeleteMutation.mutate(selectedAssignments);
    }
  };

  const handleSelectAssignment = (assignmentId: number) => {
    setSelectedAssignments(prev => 
      prev.includes(assignmentId) 
        ? prev.filter(id => id !== assignmentId)
        : [...prev, assignmentId]
    );
  };



  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  // Arama ve filtreleme fonksiyonu
  const getFilteredAndSortedAssignments = () => {
    if (!shiftAssignments) return [];
    
    let filtered = shiftAssignments;
    
    // Tarih filtresi
    if (dateFilter) {
      filtered = filtered.filter((assignment: any) => {
        const assignmentDate = assignment.date || assignment.assignedDate;
        return assignmentDate && assignmentDate.includes(dateFilter);
      });
    }
    
    // Metin araması (personel adı, ID, vardiya türü)
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter((assignment: any) => {
        const person = personnel?.find((p: any) => p.id === assignment.personnelId);
        const personName = person ? `${person.firstName} ${person.lastName}`.toLowerCase() : '';
        const employeeNumber = person?.employeeNumber?.toLowerCase() || '';
        const personnelId = assignment.personnelId.toString();
        const shiftType = assignment.shiftType || '';
        
        return (
          personName.includes(lowerSearchTerm) ||
          employeeNumber.includes(lowerSearchTerm) ||
          personnelId.includes(lowerSearchTerm) ||
          shiftType.toLowerCase().includes(lowerSearchTerm)
        );
      });
    }
    
    // Sıralama
    return filtered.sort((a: any, b: any) => {
      let compareValue = 0;
      
      switch (sortField) {
        case 'personnelId':
          const personEmployeeA = personnel?.find((p: any) => p.id === a.personnelId);
          const personEmployeeB = personnel?.find((p: any) => p.id === b.personnelId);
          const employeeNumA = personEmployeeA?.employeeNumber || a.personnelId.toString();
          const employeeNumB = personEmployeeB?.employeeNumber || b.personnelId.toString();
          compareValue = employeeNumA.localeCompare(employeeNumB, 'tr', { numeric: true });
          break;
        case 'personnelName':
          const personA = personnel?.find((p: any) => p.id === a.personnelId);
          const personB = personnel?.find((p: any) => p.id === b.personnelId);
          const nameA = personA ? `${personA.firstName} ${personA.lastName}` : '';
          const nameB = personB ? `${personB.firstName} ${personB.lastName}` : '';
          compareValue = nameA.localeCompare(nameB, 'tr');
          break;
        case 'date':
          const dateA = new Date(a.date || a.assignedDate);
          const dateB = new Date(b.date || b.assignedDate);
          if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
            compareValue = dateA.getTime() - dateB.getTime();
          }
          break;
        case 'shiftType':
          const shiftTypeA = a.shiftType || '';
          const shiftTypeB = b.shiftType || '';
          compareValue = shiftTypeA.localeCompare(shiftTypeB);
          break;
        case 'status':
          const statusA = a.status || '';
          const statusB = b.status || '';
          compareValue = statusA.localeCompare(statusB);
          break;
        default:
          compareValue = 0;
      }
      
      return sortDirection === 'asc' ? compareValue : -compareValue;
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDateFilter('');
    setCurrentPage(1);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    // Excel dosyası kontrolü
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        title: "Hata",
        description: "Sadece Excel dosyaları (.xlsx, .xls) kabul edilir",
        variant: "destructive",
      });
      return;
    }
    setUploadingFile(true);
    try {
      setUploadedFile(file);
      setSelectedFile("");
      toast({
        title: "Başarılı",
        description: `${file.name} seçildi. Şimdi 'Vardiya Yükle' butonuna tıklayın.`,
      });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Dosya yüklenirken hata oluştu",
        variant: "destructive",
      });
    } finally {
      setUploadingFile(false);
      event.target.value = '';
    }
  };

  const downloadTemplate = () => {
    // Excel şablonu oluştur ve indir
    window.open('/api/shifts/template', '_blank');
  };

  const getShiftStatus = (shift: any) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startHour, startMinute] = shift.startTime.split(':').map(Number);
    const [endHour, endMinute] = shift.endTime.split(':').map(Number);
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    if (currentTime >= startTime && currentTime <= endTime) {
      return "Aktif";
    } else if (currentTime < startTime) {
      return "Hazırlanıyor";
    } else {
      return "Bekleniyor";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Aktif":
        return "default";
      case "Hazırlanıyor":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Vardiya Planlama</h1>
          <p className="text-gray-600">Vardiya tanımları ve günlük atamaları</p>
        </div>
        <div className="flex items-center space-x-3">
          <Dialog open={shiftImportDialogOpen} onOpenChange={setShiftImportDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline"
                className="border-purple-600 text-purple-600 hover:bg-purple-50"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Excel'den Vardiya Yükle
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Excel'den Vardiya Yükle</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Excel Dosyası</label>
                  <div className="space-y-3">
                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="fileSource"
                          checked={!uploadedFile}
                          onChange={() => setUploadedFile(null)}
                          className="text-purple-600"
                        />
                        <span>Mevcut dosyalardan seç</span>
                      </label>
                      {!uploadedFile && (
                        <div className="mt-2 ml-6">
                          <Select value={selectedFile} onValueChange={setSelectedFile}>
                            <SelectTrigger>
                              <SelectValue placeholder="Dosya seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="TEMMUZ 2025 GÜNCEL_1751751336661.xlsx">TEMMUZ 2025 GÜNCEL (1. Versiyon)</SelectItem>
                              <SelectItem value="TEMMUZ 2025 GÜNCEL_1751751738350.xlsx">TEMMUZ 2025 GÜNCEL (2. Versiyon)</SelectItem>
                              <SelectItem value="TEMMUZ 2025 GÜNCEL_1751877395158.xlsx">TEMMUZ 2025 GÜNCEL (Son Versiyon)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="fileSource"
                          checked={!!uploadedFile}
                          onChange={() => {
                            setSelectedFile("");
                            const input = document.getElementById('shift-file-input') as HTMLInputElement;
                            input?.click();
                          }}
                          className="text-purple-600"
                        />
                        <span>Yeni dosya yükle</span>
                      </label>
                      {uploadedFile && (
                        <div className="mt-2 ml-6 p-2 bg-green-50 border border-green-200 rounded">
                          <p className="text-sm text-green-800">📄 {uploadedFile.name}</p>
                        </div>
                      )}
                    </div>
                    
                    <input
                      id="shift-file-input"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setUploadedFile(file);
                          setSelectedFile("");
                        }
                      }}
                      className="hidden"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Ay</label>
                    <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                          <SelectItem key={month} value={month.toString()}>
                            {new Date(2025, month - 1, 1).toLocaleDateString('tr-TR', { month: 'long' })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Yıl</label>
                    <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2025">2025</SelectItem>
                        <SelectItem value="2026">2026</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Vardiya Kodları:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li><strong>S</strong> = Sabah vardiyası</li>
                    <li><strong>A</strong> = Akşam vardiyası</li>
                    <li><strong>OF</strong> = Çalışmıyor (Off)</li>
                    <li><strong>Ç</strong> = Çalışıyor (Genel)</li>
                  </ul>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setShiftImportDialogOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button 
                    onClick={handleShiftImport}
                    disabled={(!selectedFile && !uploadedFile) || importingShifts || importShiftsMutation.isPending}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {importingShifts || importShiftsMutation.isPending ? "İçe Aktarılıyor..." : "Vardiya Yükle"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button 
            variant="outline" 
            onClick={downloadTemplate}
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Şablon İndir
          </Button>
          
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                <Upload className="w-4 h-4 mr-2" />
                Excel Yükle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Vardiya Excel Dosyası Yükle</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <FileSpreadsheet className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 mb-4">
                    Excel dosyanızı seçin (.xlsx, .xls)
                  </p>
                  <Input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    disabled={uploadingFile}
                    className="cursor-pointer"
                  />
                </div>
                {uploadingFile && (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-gray-600 mt-2">Dosya yükleniyor...</p>
                  </div>
                )}
                <div className="text-xs text-gray-500 space-y-1">
                  <p>• <strong>Gerekli sütunlar:</strong> Personel, Tarih, Vardiya</p>
                  <p>• <strong>İsteğe bağlı:</strong> Açıklama, Şube, Pozisyon</p>
                  <p>• <strong>Personel:</strong> Tam ad veya personel numarası</p>
                  <p>• <strong>Tarih:</strong> YYYY-MM-DD formatında (örn: 2025-01-15)</p>
                  <p>• <strong>Vardiya:</strong> Gündüz, Akşam, Gece vb.</p>
                  <p>• Şablon dosyasını indirerek tam aylık format örneğini görebilirsiniz</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewShift} className="bg-primary hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Yeni Vardiya
              </Button>
            </DialogTrigger>
            <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingShift ? "Vardiya Düzenle" : "Yeni Vardiya Ekle"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vardiya Adı</FormLabel>
                      <FormControl>
                        <Input placeholder="Örn: Sabah Vardiyası" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="branchId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Şube</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Şube seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {branches?.map((branch: any) => (
                            <SelectItem key={branch.id} value={branch.id.toString()}>
                              {branch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Başlangıç Saati</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bitiş Saati</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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
                    disabled={createShiftMutation.isPending || updateShiftMutation.isPending}
                  >
                    {editingShift ? "Güncelle" : "Oluştur"}
                  </Button>
                </div>
              </form>
            </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Vardiya Tanımları */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Vardiya Tanımları ({shifts?.length || 0} adet)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!shifts || shifts?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Henüz vardiya tanımı bulunmuyor. "Yeni Vardiya" butonuna tıklayarak vardiya oluşturun.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vardiya Adı</TableHead>
                    <TableHead>Başlangıç</TableHead>
                    <TableHead>Bitiş</TableHead>
                    <TableHead>Şube</TableHead>
                    <TableHead>Personel</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shifts.map((shift: any) => {
                    const shiftPersonnel = personnel?.filter((p: any) => p.shiftId === shift.id) || [];
                    return (
                      <TableRow key={shift.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleShiftClick(shift)}>
                        <TableCell className="font-medium">{shift.name}</TableCell>
                        <TableCell>{shift.startTime}</TableCell>
                        <TableCell>{shift.endTime}</TableCell>
                        <TableCell>
                          {branches?.find((b: any) => b.id === shift.branchId)?.name || 'Tüm Şubeler'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {shiftPersonnel.length} personel
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={shift.isActive ? "default" : "secondary"}>
                            {shift.isActive ? "Aktif" : "Pasif"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(shift);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(shift.id);
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Excel'den İçe Aktarılan Vardiya Atamaları */}
      <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Vardiya Atamaları ({shiftAssignments?.length || 0} adet)
              </CardTitle>
              <div className="flex items-center space-x-2">
                {selectedAssignments.length > 0 && (
                  <Badge variant="secondary">
                    {selectedAssignments.length} seçili
                  </Badge>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={selectedAssignments.length === 0}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Seçilenleri Sil ({selectedAssignments.length})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!shiftAssignments || shiftAssignments?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Henüz vardiya ataması bulunmuyor. Excel'den vardiya yükleyin.
              </div>
            ) : (
              <div className="space-y-4">

                
                {/* Arama ve Filtreleme */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <h4 className="font-medium text-gray-900">Arama ve Filtreleme</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Metin araması */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Personel Ara (Ad, ID, Vardiya)
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Personel adı, ID veya vardiya türü..."
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    {/* Tarih filtresi */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tarih Filtresi
                      </label>
                      <Input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => {
                          setDateFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full"
                      />
                    </div>
                    
                    {/* Temizle butonu */}
                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        onClick={clearFilters}
                        className="w-full"
                        disabled={!searchTerm && !dateFilter}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Filtreleri Temizle
                      </Button>
                    </div>
                  </div>
                  
                  {/* Arama sonuçları özeti */}
                  {(searchTerm || dateFilter) && (
                    <div className="text-sm text-gray-600">
                      {getFilteredAndSortedAssignments().length} sonuç bulundu
                      {searchTerm && ` ("${searchTerm}" araması)`}
                      {dateFilter && ` (${new Date(dateFilter).toLocaleDateString('tr-TR')} tarihi)`}
                    </div>
                  )}
                </div>
                
                {isLoadingAssignments ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2">Vardiya atamaları yükleniyor...</span>
                  </div>
                ) : !shiftAssignments || shiftAssignments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Henüz vardiya ataması bulunmuyor.</p>
                    <p className="text-sm mt-2">Excel dosyası yükleyerek vardiya atamaları oluşturabilirsiniz.</p>
                    <p className="text-xs mt-1 text-blue-600">Debug: shiftAssignments = {JSON.stringify(shiftAssignments?.slice(0, 2))}</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <input
                            type="checkbox"
                            checked={selectedAssignments.length === getFilteredAndSortedAssignments().length && getFilteredAndSortedAssignments().length > 0}
                            onChange={handleSelectAll}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                        </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none"
                        onClick={() => handleSort('personnelId')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Personel No</span>
                          {getSortIcon('personnelId')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none"
                        onClick={() => handleSort('personnelName')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Ad Soyad</span>
                          {getSortIcon('personnelName')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none"
                        onClick={() => handleSort('date')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Tarih</span>
                          {getSortIcon('date')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none"
                        onClick={() => handleSort('shiftType')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Vardiya Türü</span>
                          {getSortIcon('shiftType')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Durum</span>
                          {getSortIcon('status')}
                        </div>
                      </TableHead>
                      <TableHead>Notlar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredAndSortedAssignments().slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((assignment: any) => {
                      const person = personnel?.find((p: any) => p.id === assignment.personnelId);
                      return (
                        <TableRow key={assignment.id}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedAssignments.includes(assignment.id)}
                              onChange={() => handleSelectAssignment(assignment.id)}
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {person?.employeeNumber || assignment.personnelId}
                          </TableCell>
                          <TableCell className="font-medium">
                            {person ? `${person.firstName} ${person.lastName}` : 'Personel bulunamadı'}
                          </TableCell>
                          <TableCell>
                            {assignment.date || assignment.assignedDate}
                            {/* Debug: tarih formatını göster */}
                            <div className="text-xs text-gray-400 mt-1">
                              {new Date(assignment.date || assignment.assignedDate).toLocaleDateString('tr-TR')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline"
                              className={
                                assignment.shiftType === 'morning' ? 'border-green-500 text-green-700' :
                                assignment.shiftType === 'evening' ? 'border-orange-500 text-orange-700' :
                                assignment.shiftType === 'off' ? 'border-red-500 text-red-700' :
                                assignment.shiftType === 'working' ? 'border-blue-500 text-blue-700' :
                                'border-gray-500 text-gray-700'
                              }
                            >
                              {assignment.shiftType === 'morning' ? 'Sabah' :
                               assignment.shiftType === 'evening' ? 'Akşam' :
                               assignment.shiftType === 'off' ? 'Çalışmıyor' :
                               assignment.shiftType === 'working' ? 'Çalışıyor' :
                               assignment.shiftType || 'Bilinmiyor'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={assignment.status === "assigned" ? "default" : "secondary"}>
                              {assignment.status === 'assigned' ? 'Atandı' : assignment.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {assignment.notes}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                )}
                
                {/* Sayfalama Kontrolleri */}
                {(() => {
                  const filteredData = getFilteredAndSortedAssignments();
                  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
                  
                  return filteredData.length > 0 && (
                    <div className="mt-6 space-y-4">
                      {/* Sayfa başına öğe seçimi */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-600">Sayfa başına:</span>
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
                        
                        <div className="text-sm text-gray-600">
                          {filteredData.length} sonuç - Sayfa {currentPage} / {totalPages}
                          {(searchTerm || dateFilter) && (
                            <span className="ml-2 text-blue-600">
                              (Toplam {shiftAssignments?.length} atamadan filtrelendi)
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Sayfa butonları */}
                      <div className="flex items-center justify-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                        >
                          Önceki
                        </Button>
                        
                        {/* Sayfa numaraları */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className="w-10"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Sonraki
                        </Button>
                      </div>
                      
                      {/* Hızlı sayfa atlama */}
                      <div className="flex items-center justify-center space-x-2 text-sm">
                        <span className="text-gray-600">Sayfaya git:</span>
                        <input
                          type="number"
                          min="1"
                          max={totalPages}
                          value={currentPage}
                          onChange={(e) => {
                            const page = parseInt(e.target.value);
                            if (page >= 1 && page <= totalPages) {
                              setCurrentPage(page);
                            }
                          }}
                          className="w-16 px-2 py-1 text-center border rounded"
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </CardContent>
      </Card>

      {/* Vardiya Personel Yönetimi Dialog */}
      <Dialog open={shiftPersonnelDialogOpen} onOpenChange={setShiftPersonnelDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              {selectedShift?.name} - Personel Yönetimi
            </DialogTitle>
          </DialogHeader>
          
          {selectedShift && (
            <div className="space-y-6">
              {/* Vardiya bilgileri */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <strong>Vardiya:</strong> {selectedShift.name}
                  </div>
                  <div>
                    <strong>Saatler:</strong> {selectedShift.startTime} - {selectedShift.endTime}
                  </div>
                  <div>
                    <strong>Şube:</strong> {branches?.find((b: any) => b.id === selectedShift.branchId)?.name || 'Tüm Şubeler'}
                  </div>
                </div>
              </div>

              {/* Personel Arama */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Personel ara (ad, soyad, pozisyon, personel no)"
                    value={personnelSearchTerm}
                    onChange={(e) => setPersonnelSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                  {personnelSearchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPersonnelSearchTerm('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Vardiyada Çalışan Personel */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Vardiyada Çalışan Personel ({filterPersonnel(personnel?.filter((p: any) => p.shiftId === selectedShift.id) || []).length})
                  </h3>
                  <div className="max-h-80 overflow-y-auto space-y-2">
                    {filterPersonnel(personnel?.filter((p: any) => p.shiftId === selectedShift.id) || []).map((person: any) => (
                      <div key={person.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div>
                          <div className="font-medium">{person.firstName} {person.lastName}</div>
                          <div className="text-sm text-gray-600">
                            {person.position || '-'}
                            {person.employeeNumber && (
                              <span className="ml-2 text-gray-500">#{person.employeeNumber}</span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemovePersonnelFromShift(person.id)}
                          className="text-red-600 hover:text-red-700"
                          disabled={updatePersonnelShiftMutation.isPending}
                        >
                          <UserMinus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {filterPersonnel(personnel?.filter((p: any) => p.shiftId === selectedShift.id) || []).length === 0 && (
                      <div className="text-center text-gray-500 py-8">
                        {personnelSearchTerm ? 'Arama kriterine uygun personel bulunamadı' : 'Bu vardiyada henüz personel yok'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Atanabilir Personel */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <UserMinus className="w-4 h-4 mr-2" />
                    Atanabilir Personel ({filterPersonnel(personnel?.filter((p: any) => !p.shiftId || p.shiftId !== selectedShift.id) || []).length})
                  </h3>
                  <div className="max-h-80 overflow-y-auto space-y-2">
                    {filterPersonnel(personnel?.filter((p: any) => !p.shiftId || p.shiftId !== selectedShift.id) || []).map((person: any) => (
                      <div key={person.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div>
                          <div className="font-medium">{person.firstName} {person.lastName}</div>
                          <div className="text-sm text-gray-600">
                            {person.position || '-'}
                            {person.employeeNumber && (
                              <span className="ml-2 text-gray-500">#{person.employeeNumber}</span>
                            )}
                            {person.shiftId && person.shiftId !== selectedShift.id && (
                              <span className="ml-2 text-orange-600">
                                (Başka vardiyada: {shifts?.find((s: any) => s.id === person.shiftId)?.name})
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddPersonnelToShift(person.id)}
                          className="text-green-600 hover:text-green-700"
                          disabled={updatePersonnelShiftMutation.isPending}
                        >
                          <UserPlus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {filterPersonnel(personnel?.filter((p: any) => !p.shiftId || p.shiftId !== selectedShift.id) || []).length === 0 && (
                      <div className="text-center text-gray-500 py-8">
                        {personnelSearchTerm ? 'Arama kriterine uygun personel bulunamadı' : 'Atanabilir personel yok'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShiftPersonnelDialogOpen(false)}
                >
                  Kapat
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Toplu Silme Onay Dialog'u */}
      <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vardiya Atamalarını Sil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              <strong>{selectedAssignments.length}</strong> adet vardiya atamasını silmek istediğinizden emin misiniz?
            </p>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                ⚠️ Bu işlem geri alınamaz. Seçili vardiya atamaları kalıcı olarak silinecektir.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setBulkDeleteDialogOpen(false)}
              >
                İptal
              </Button>
              <Button 
                variant="destructive"
                onClick={confirmBulkDelete}
                disabled={bulkDeleteMutation.isPending}
              >
                {bulkDeleteMutation.isPending ? "Siliniyor..." : "Sil"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
