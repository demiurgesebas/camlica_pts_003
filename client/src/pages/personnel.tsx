import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPersonnelSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Edit, Trash2, UserPlus, FileText, User, Briefcase, Shield, Heart, Award, File, Eye, TrendingUp, Upload, ChevronUp, ChevronDown, Clock, MessageCircle, Bell, Send } from "lucide-react";
import { z } from "zod";

const personnelFormSchema = insertPersonnelSchema.extend({
  employeeNumber: z.string().min(1, "Personel numarası gereklidir"),
  firstName: z.string().min(1, "Ad gereklidir"),
  lastName: z.string().min(1, "Soyad gereklidir"),
}).partial({ teamId: true, shiftId: true });

const leaveRequestFormSchema = z.object({
  leaveType: z.string().min(1, "İzin türü seçiniz"),
  startDate: z.string().min(1, "Başlangıç tarihi gereklidir"),
  endDate: z.string().min(1, "Bitiş tarihi gereklidir"),
  reason: z.string().min(1, "İzin açıklaması gereklidir"),
  notes: z.string().optional(),
});

export default function Personnel() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPersonnel, setEditingPersonnel] = useState<any>(null);
  const [selectedPersonnel, setSelectedPersonnel] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("kimlik");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showLeaveRequestForm, setShowLeaveRequestForm] = useState(false);
  const [importingExcel, setImportingExcel] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedShiftDetails, setSelectedShiftDetails] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [sortField, setSortField] = useState<string>('employeeNumber');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showSmsDialog, setShowSmsDialog] = useState(false);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [smsMessage, setSmsMessage] = useState("");
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof personnelFormSchema>>({
    resolver: zodResolver(personnelFormSchema),
    defaultValues: {
      employeeNumber: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      position: "",
      department: "",
      departmentId: "none",
      shiftId: "none",
      teamId: "none",
      isActive: true,
    },
  });

  const leaveForm = useForm<z.infer<typeof leaveRequestFormSchema>>({
    resolver: zodResolver(leaveRequestFormSchema),
    defaultValues: {
      leaveType: "",
      startDate: "",
      endDate: "",
      reason: "",
      notes: "",
    },
  });

  // SMS gönderme mutation
  const sendSMSMutation = useMutation({
    mutationFn: async ({ phoneNumber, message }: { phoneNumber: string; message: string }) => {
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber, message }),
      });
      
      if (!response.ok) {
        throw new Error('SMS gönderilemedi');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "SMS başarıyla gönderildi",
      });
      setShowSmsDialog(false);
      setSmsMessage("");
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "SMS gönderilirken hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Bildirim gönderme mutation
  const sendNotificationMutation = useMutation({
    mutationFn: async (notification: any) => {
      return apiRequest('/api/notifications', {
        method: 'POST',
        body: JSON.stringify(notification),
      });
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Bildirim başarıyla gönderildi",
      });
      setShowNotificationDialog(false);
      setNotificationTitle("");
      setNotificationMessage("");
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Bildirim gönderilirken hata oluştu",
        variant: "destructive",
      });
    },
  });

  const handleSendSMS = () => {
    if (!selectedPersonnel?.phone || !smsMessage) {
      toast({
        title: "Hata",
        description: "Telefon numarası ve mesaj gerekli",
        variant: "destructive",
      });
      return;
    }

    sendSMSMutation.mutate({
      phoneNumber: selectedPersonnel.phone,
      message: smsMessage
    });
  };

  const handleSendNotification = () => {
    if (!notificationTitle || !notificationMessage) {
      toast({
        title: "Hata",
        description: "Başlık ve mesaj gerekli",
        variant: "destructive",
      });
      return;
    }

    sendNotificationMutation.mutate({
      title: notificationTitle,
      message: notificationMessage,
      type: "personal",
      targetType: "personnel",
      targetId: selectedPersonnel.id,
    });
  };

  // Get today's date for dynamic shift info
  const today = new Date().toISOString().split('T')[0];
  
  const { data: personnel = [], isLoading } = useQuery({
    queryKey: ['/api/personnel/with-current-shifts'],
    retry: false,
  });

  const { data: branches = [] } = useQuery({
    queryKey: ["/api/branches"],
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["/api/departments"],
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ["/api/shifts"],
  });

  const { data: teams = [] } = useQuery({
    queryKey: ["/api/teams"],
  });

  // Seçili personel için detaylı bilgiler
  const { data: personnelShiftAssignments = [] } = useQuery({
    queryKey: [`/api/shift-assignments/personnel/${selectedPersonnel?.id}`],
    enabled: !!selectedPersonnel?.id,
  });

  const { data: personnelAttendance = [] } = useQuery({
    queryKey: [`/api/attendance/personnel/${selectedPersonnel?.id}`],
    enabled: !!selectedPersonnel?.id,
  });

  const { data: personnelLeaveRequests = [] } = useQuery({
    queryKey: [`/api/personnel/${selectedPersonnel?.id}/leave-requests`],
    enabled: !!selectedPersonnel?.id,
  });

  const { data: personnelDocuments = [], refetch: refetchDocuments } = useQuery({
    queryKey: [`/api/personnel/${selectedPersonnel?.id}/documents`],
    enabled: !!selectedPersonnel?.id,
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
  const filteredPersonnel = personnel?.filter((person: any) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      person.firstName?.toLowerCase().includes(searchLower) ||
      person.lastName?.toLowerCase().includes(searchLower) ||
      person.employeeNumber?.toLowerCase().includes(searchLower) ||
      person.email?.toLowerCase().includes(searchLower) ||
      person.phone?.toLowerCase().includes(searchLower) ||
      person.position?.toLowerCase().includes(searchLower) ||
      person.department?.toLowerCase().includes(searchLower) ||
      person.branch?.name?.toLowerCase().includes(searchLower)
    );
  }) || [];

  // Sıralama uygulama
  const sortedPersonnel = [...filteredPersonnel].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue = '';
    let bValue = '';
    
    switch (sortField) {
      case 'employeeNumber':
        // Sayısal sıralama için number'a çevir
        const aNum = parseInt(a.employeeNumber || '0', 10);
        const bNum = parseInt(b.employeeNumber || '0', 10);
        if (sortDirection === 'asc') {
          return aNum - bNum;
        } else {
          return bNum - aNum;
        }
      case 'name':
        aValue = `${a.firstName || ''} ${a.lastName || ''}`;
        bValue = `${b.firstName || ''} ${b.lastName || ''}`;
        break;
      case 'position':
        aValue = a.position || '';
        bValue = b.position || '';
        break;
      case 'department':
        aValue = a.department || '';
        bValue = b.department || '';
        break;
      case 'currentShift':
        aValue = a.currentShift || '';
        bValue = b.currentShift || '';
        break;
      case 'shift':
        // Shift bilgilerini shifts array'den bularak sırala
        const aShift = shifts?.find((s: any) => s.id === a.shiftId);
        const bShift = shifts?.find((s: any) => s.id === b.shiftId);
        aValue = aShift ? aShift.name : '';
        bValue = bShift ? bShift.name : '';
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
  const totalPages = Math.ceil(sortedPersonnel.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPersonnel = sortedPersonnel.slice(startIndex, startIndex + itemsPerPage);

  const createPersonnelMutation = useMutation({
    mutationFn: async (data: z.infer<typeof personnelFormSchema>) => {
      await apiRequest("/api/personnel", { method: 'POST', body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personnel"] });
      toast({
        title: "Başarılı",
        description: "Personel başarıyla oluşturuldu",
      });
      setDialogOpen(false);
      form.reset({
        employeeNumber: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        position: "",
        department: "",
        departmentId: "none",
        shiftId: "none", 
        teamId: "none",
        isActive: true,
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

  const updatePersonnelMutation = useMutation({
    mutationFn: async (data: z.infer<typeof personnelFormSchema>) => {
      await apiRequest("PUT", `/api/personnel/${editingPersonnel.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personnel"] });
      toast({
        title: "Başarılı",
        description: "Personel bilgileri güncellendi",
      });
      setDialogOpen(false);
      setEditingPersonnel(null);
      form.reset({
        employeeNumber: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        position: "",
        department: "",
        departmentId: "none",
        shiftId: "none", 
        teamId: "none",
        isActive: true,
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

  const deletePersonnelMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/personnel/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personnel"] });
      toast({
        title: "Başarılı",
        description: "Personel silindi",
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

  // Excel import mutation kaldırıldı - vardiya planları sayfasından otomatik olarak tüm personele atanıyor

  const handleFileUpload = async (file: File, category: string, documentType: string, notes: string = "") => {
    if (!selectedPersonnel || !file) {
      toast({
        title: "Hata",
        description: "Personel seçilmemiş veya dosya bulunamadı",
        variant: "destructive",
      });
      return;
    }

    setUploadingFile(true);
    console.log("Starting file upload:", { file: file.name, category, documentType, notes });
    
    try {
      const documentData = {
        documentType,
        documentCategory: category,
        fileName: file.name,
        filePath: `/uploads/${selectedPersonnel.id}/${file.name}`,
        fileSize: file.size,
        mimeType: file.type,
        status: "pending",
        notes: notes.trim() || null,
      };

      console.log("Document data to send:", documentData);

      console.log("Making API request to:", `/api/personnel/${selectedPersonnel.id}/documents`);
      console.log("With method: POST");
      console.log("With data:", documentData);
      
      const response = await apiRequest(`/api/personnel/${selectedPersonnel.id}/documents`, {
        method: 'POST',
        body: JSON.stringify(documentData),
      });
      console.log("Upload response:", response);

      toast({
        title: "Başarılı",
        description: `${file.name} başarıyla yüklendi`,
      });

    } catch (error: any) {
      console.error("=== DOSYA YÜKLEME HATASI ===");
      console.error("Hata detayları:", error);
      console.error("Hata mesajı:", error?.message);
      console.error("Hata kodu:", error?.status);
      console.error("Response:", error?.response);
      console.error("Stack trace:", error?.stack);
      console.error("=== HATA SONU ===");
      
      let errorMessage = "Belge yüklenirken bir hata oluştu";
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      // Hata mesajını hem toast hem de console'a yazdır
      console.error("Kullanıcıya gösterilen hata:", errorMessage);
      
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploadingFile(false);
    }
  };

  // Annual leave calculation mutation
  const calculateAnnualLeaveMutation = useMutation({
    mutationFn: async (personnelId: number) => {
      return await apiRequest(`/api/personnel/${personnelId}/calculate-annual-leave`, { method: 'POST', body: JSON.stringify({}) });
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Yıllık izin hesaplandı",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/personnel'] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Yıllık izin hesaplanamadı",
        variant: "destructive",
      });
    }
  });

  const calculateAllAnnualLeaveMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/personnel/calculate-all-annual-leave", { method: 'POST', body: JSON.stringify({}) });
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Tüm personelin yıllık izinleri hesaplandı",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/personnel'] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Yıllık izinler hesaplanamadı",
        variant: "destructive",
      });
    }
  });

  const createLeaveRequestMutation = useMutation({
    mutationFn: async (data: z.infer<typeof leaveRequestFormSchema>) => {
      if (!selectedPersonnel) throw new Error("Personel seçilmemiş");
      
      // Tarih farkını hesapla
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      const timeDiff = endDate.getTime() - startDate.getTime();
      const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 çünkü başlangıç ve bitiş günleri dahil
      
      const requestData = {
        personnelId: selectedPersonnel.id,
        leaveType: data.leaveType,
        startDate: data.startDate,
        endDate: data.endDate,
        totalDays: totalDays,
        reason: data.reason,
        notes: data.notes,
        status: "pending"
      };

      return await apiRequest('/api/leave-requests', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "İzin talebi başarıyla oluşturuldu",
      });
      leaveForm.reset();
      setShowLeaveRequestForm(false);
      
      // Cache'i temizle
      queryClient.invalidateQueries({ queryKey: ['/api/leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/leave-requests/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: [`/api/personnel/${selectedPersonnel?.id}/leave-requests`] });
    },
    onError: (error: any) => {
      console.error("İzin talebi oluşturma hatası:", error);
      console.error("Hata detayları:", error.stack);
      toast({
        title: "Hata",
        description: error.message || "İzin talebi oluşturulamadı",
        variant: "destructive",
      });
    }
  });

  const onSubmitLeaveRequest = (data: z.infer<typeof leaveRequestFormSchema>) => {
    // İzin günlerini hesapla
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const timeDiff = endDate.getTime() - startDate.getTime();
    const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 çünkü her iki gün de dahil
    
    const requestData = {
      ...data,
      totalDays
    };
    
    createLeaveRequestMutation.mutate(requestData);
  };

  // Excel import mutation
  const importExcelMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/excel/import-personnel", { method: 'POST', body: JSON.stringify({
        fileName: "TEMMUZ 2025 GÜNCEL_1751877395158.xlsx"
      }) });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Başarılı",
        description: `${data.imported} personel başarıyla import edildi. ${data.errors} hata.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/personnel'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
    },
    onError: (error: any) => {
      console.error("Excel import hatası:", error);
      toast({
        title: "Hata",
        description: error.message || "Excel dosyası import edilemedi",
        variant: "destructive",
      });
    }
  });

  const handleExcelImport = () => {
    setImportingExcel(true);
    importExcelMutation.mutate();
    setImportingExcel(false);
  };



  // Personel belgelerini getir (ikinci tanım kaldırıldı)

  // Personel izin taleplerini getir (ikinci tanım kaldırıldı)

  const DocumentUploadSection = ({ 
    category, 
    documentType, 
    title, 
    status = "Bekliyor" 
  }: { 
    category: string; 
    documentType: string; 
    title: string; 
    status?: string;
  }) => {
    const inputId = `${category}-${documentType}-upload`;
    const [notes, setNotes] = useState("");
    
    // Bu belge türü için yüklenen dosyaları bul
    const existingDoc = personnelDocuments.find(
      (doc: any) => doc.documentType === documentType && doc.documentCategory === category
    );
    
    return (
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h5 className="font-medium">{title}</h5>
          <Badge variant={existingDoc ? "default" : "outline"}>
            {existingDoc ? "Yüklendi" : status}
          </Badge>
        </div>
        
        {existingDoc && (
          <div className="bg-green-50 p-3 rounded border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">{existingDoc.fileName}</p>
                <p className="text-xs text-green-600">
                  {new Date(existingDoc.uploadedAt).toLocaleDateString('tr-TR')} tarihinde yüklendi
                </p>
                {existingDoc.notes && (
                  <p className="text-xs text-gray-600 mt-1">Not: {existingDoc.notes}</p>
                )}
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs"
                onClick={async () => {
                  try {
                    // Demo mode için alert göster
                    alert(`Dosya: ${existingDoc.fileName}\nBoyut: ${(existingDoc.fileSize / 1024).toFixed(1)} KB\nTür: ${existingDoc.mimeType}\n\nDemo modda çalışıyor - gerçek dosya görüntüleme için file server gerekli.`);
                  } catch (error) {
                    console.error("Dosya görüntüleme hatası:", error);
                    toast({
                      title: "Hata",
                      description: "Dosya görüntülenemedi",
                      variant: "destructive",
                    });
                  }
                }}
              >
                <Eye className="w-3 h-3 mr-1" />
                Görüntüle
              </Button>
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Açıklama/Notlar:</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Bu belge hakkında not ekleyebilirsiniz..."
            className="w-full p-2 border rounded text-sm resize-none h-16"
          />
        </div>
        
        <div className="flex gap-2">
          <input
            type="file"
            id={inputId}
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                await handleFileUpload(file, category, documentType, notes);
                refetchDocuments(); // Belgeleri yeniden yükle
                setNotes(""); // Notları temizle
              }
              e.target.value = '';
            }}
          />
          <Button
            onClick={() => document.getElementById(inputId)?.click()}
            disabled={uploadingFile}
            size="sm"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            {uploadingFile ? "Yükleniyor..." : existingDoc ? "Değiştir" : "Dosya Seç"}
          </Button>
        </div>
      </div>
    );
  };

  const handleSubmit = (data: z.infer<typeof personnelFormSchema>) => {
    // Safe number conversion function
    const safeNumberConvert = (value: any) => {
      if (value === null || value === undefined || value === "none" || value === "" || value === "null") {
        return null;
      }
      const num = parseInt(value.toString());
      return isNaN(num) ? null : num;
    };

    // Convert branchId and departmentId to numbers
    const submitData = {
      ...data,
      branchId: parseInt(data.branchId?.toString() || "0"),
      departmentId: safeNumberConvert(data.departmentId),
      shiftId: safeNumberConvert(data.shiftId),
      teamId: safeNumberConvert(data.teamId)
    };
    
    console.log("Original form data:", data);
    console.log("Submit data:", submitData);
    console.log("TeamId:", { type: typeof submitData.teamId, value: submitData.teamId });
    console.log("ShiftId:", { type: typeof submitData.shiftId, value: submitData.shiftId });
    
    if (editingPersonnel) {
      updatePersonnelMutation.mutate(submitData);
    } else {
      createPersonnelMutation.mutate(submitData);
    }
  };

  const handleEdit = (person: any) => {
    setEditingPersonnel(person);
    form.reset({
      employeeNumber: person.employeeNumber,
      firstName: person.firstName,
      lastName: person.lastName,
      email: person.email || "",
      phone: person.phone || "",
      position: person.position || "",
      department: person.department || "",
      branchId: person.branchId,
      departmentId: person.departmentId || "none",
      shiftId: person.shiftId?.toString() || "none",
      teamId: person.teamId?.toString() || "none",
      isActive: person.isActive,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Bu personeli silmek istediğinizden emin misiniz?")) {
      deletePersonnelMutation.mutate(id);
    }
  };

  const handleNewPersonnel = () => {
    setEditingPersonnel(null);
    form.reset({
      employeeNumber: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      position: "",
      department: "",
      departmentId: "none",
      shiftId: "none", 
      teamId: "none",
      isActive: true,
    });
    setDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Personel Yönetimi</h1>
          <p className="text-gray-600">Personel bilgilerini görüntüle ve yönet</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => calculateAllAnnualLeaveMutation.mutate()}
            disabled={calculateAllAnnualLeaveMutation.isPending}
            variant="secondary"
            className="flex items-center space-x-2"
          >
            <TrendingUp className="w-4 h-4" />
            <span>{calculateAllAnnualLeaveMutation.isPending ? "Hesaplanıyor..." : "Tüm İzinleri Hesapla"}</span>
          </Button>
          <Button 
            onClick={handleExcelImport}
            disabled={importingExcel || importExcelMutation.isPending}
            variant="outline"
          >
            <Upload className="w-4 h-4 mr-2" />
            {importingExcel || importExcelMutation.isPending ? "İçe Aktarılıyor..." : "Excel'den İçe Aktar"}
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewPersonnel} className="bg-primary hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Yeni Personel
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Arama ve Filtreleme */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
        <h4 className="font-medium text-gray-900">Arama ve Filtreleme</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Personel adı, numarası, pozisyon..."
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
          {filteredPersonnel.length} personel bulundu
          {searchTerm && ` (${personnel?.length || 0} toplam personel içinde)`}
        </div>
      </div>

      {/* Dialog Content */}
      <div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingPersonnel ? "Personel Düzenle" : "Yeni Personel Ekle"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="employeeNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Personel Numarası</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
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
                          onValueChange={(value) => {
                            field.onChange(parseInt(value, 10));
                            // Şube değiştiğinde departman seçimini sıfırla
                            form.setValue("departmentId", null);
                          }} 
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Şube seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(branches as any[]).map((branch: any) => (
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
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="departmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Birim</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value && value !== "none" ? parseInt(value, 10) : null)} 
                          value={field.value?.toString() || "none"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Birim seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Birim yok</SelectItem>
                            {(departments as any[])
                              .filter((dept: any) => !form.watch("branchId") || dept.branchId === form.watch("branchId"))
                              .map((dept: any) => (
                              <SelectItem key={dept.id} value={dept.id.toString()}>
                                {dept.name}
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
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pozisyon</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ad</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Soyad</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-posta</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefon</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pozisyon</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="shiftId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vardiya</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value && value !== "none" ? parseInt(value, 10) : null)} 
                          value={field.value?.toString() || "none"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Vardiya seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Vardiya yok</SelectItem>
                            {(shifts as any[])
                              .filter((shift: any) => !form.watch("branchId") || shift.branchId === form.watch("branchId"))
                              .map((shift: any) => (
                              <SelectItem key={shift.id} value={shift.id.toString()}>
                                {shift.name} ({shift.startTime} - {shift.endTime})
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
                    name="teamId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ekip</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value && value !== "none" ? parseInt(value, 10) : null)} 
                          value={field.value?.toString() || "none"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Ekip seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Ekip yok</SelectItem>
                            {(teams as any[])
                              .filter((team: any) => !form.watch("branchId") || team.branchId === form.watch("branchId"))
                              .map((team: any) => (
                              <SelectItem key={team.id} value={team.id.toString()}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="hireDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>İşe Alım Tarihi</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Doğum Tarihi</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ""} />
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
                    disabled={createPersonnelMutation.isPending || updatePersonnelMutation.isPending}
                  >
                    {editingPersonnel ? "Güncelle" : "Oluştur"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personel Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="w-4 h-4 text-gray-500" />
            <Input
              placeholder="Personel ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
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
                    onClick={() => handleSort('employeeNumber')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Personel No</span>
                      {sortField === 'employeeNumber' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Ad Soyad</span>
                      {sortField === 'name' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </TableHead>

                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort('department')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Birim</span>
                      {sortField === 'department' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort('currentShift')}
                  >
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span>Bugünkü Vardiya ({new Date().toLocaleDateString('tr-TR')})</span>
                      {sortField === 'currentShift' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </TableHead>

                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPersonnel?.map((person: any) => (
                  <TableRow 
                    key={person.id} 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedPersonnel(person)}
                  >
                    <TableCell className="font-medium">{person.employeeNumber}</TableCell>
                    <TableCell>{person.firstName} {person.lastName}</TableCell>
                    <TableCell>
                      {person.departmentId 
                        ? departments?.find((d: any) => d.id === person.departmentId)?.name || "Bilinmeyen Birim"
                        : "-"
                      }
                    </TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium shadow-sm transition-all duration-200 hover:shadow-md whitespace-nowrap ${
                        person.currentShiftType === 'morning' 
                          ? 'bg-gradient-to-r from-orange-100 via-yellow-50 to-orange-50 text-orange-800 border border-orange-200 hover:from-orange-200 hover:to-yellow-100' :
                        person.currentShiftType === 'evening' 
                          ? 'bg-gradient-to-r from-blue-100 via-indigo-50 to-blue-50 text-blue-800 border border-blue-200 hover:from-blue-200 hover:to-indigo-100' :
                        person.currentShiftType === 'off' 
                          ? 'bg-gradient-to-r from-red-100 via-pink-50 to-red-50 text-red-800 border border-red-200 hover:from-red-200 hover:to-pink-100' :
                        person.currentShiftType === 'working' 
                          ? 'bg-gradient-to-r from-green-100 via-emerald-50 to-green-50 text-green-800 border border-green-200 hover:from-green-200 hover:to-emerald-100' :
                        'bg-gradient-to-r from-gray-100 via-slate-50 to-gray-50 text-gray-600 border border-gray-200 hover:from-gray-200 hover:to-slate-100'
                      }`}>
                        <div className={`w-2 h-2 rounded-full mr-2 flex-shrink-0 animate-pulse ${
                          person.currentShiftType === 'morning' ? 'bg-orange-500' :
                          person.currentShiftType === 'evening' ? 'bg-blue-500' :
                          person.currentShiftType === 'off' ? 'bg-red-500' :
                          person.currentShiftType === 'working' ? 'bg-green-500' :
                          'bg-gray-400'
                        }`}></div>
                        <span className="truncate">{person.currentShift || "Vardiya atanmamış"}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant={person.isActive ? "default" : "secondary"}>
                        {person.isActive ? "Aktif" : "Pasif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPersonnel(person);
                          }}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Özlük
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPersonnel(person);
                            setShowSmsDialog(true);
                          }}
                          disabled={!person.phone}
                          title={!person.phone ? "Telefon numarası yok" : "SMS Gönder"}
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPersonnel(person);
                            setShowNotificationDialog(true);
                          }}
                          title="Bildirim Gönder"
                        >
                          <Bell className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(person);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(person.id);
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {/* Sayfalama */}
          {filteredPersonnel.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredPersonnel.length)} 
                arası, toplam {filteredPersonnel.length} sonuç
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

      {/* Özlük Bilgileri Dialog */}
      {selectedPersonnel && (
        <Dialog open={!!selectedPersonnel} onOpenChange={() => setSelectedPersonnel(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedPersonnel.firstName} {selectedPersonnel.lastName} - Özlük Bilgileri
              </DialogTitle>
            </DialogHeader>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10 gap-1">
                <TabsTrigger value="kimlik" className="text-xs">
                  <User className="w-4 h-4 mr-1" />
                  Kimlik
                </TabsTrigger>
                <TabsTrigger value="ise-alim" className="text-xs">
                  <Briefcase className="w-4 h-4 mr-1" />
                  İşe Alım
                </TabsTrigger>
                <TabsTrigger value="egitim" className="text-xs">
                  <Award className="w-4 h-4 mr-1" />
                  Eğitim
                </TabsTrigger>
                <TabsTrigger value="sgk-vergi" className="text-xs">
                  <Shield className="w-4 h-4 mr-1" />
                  SGK/Vergi
                </TabsTrigger>
                <TabsTrigger value="saglik" className="text-xs">
                  <Heart className="w-4 h-4 mr-1" />
                  Sağlık
                </TabsTrigger>
                <TabsTrigger value="performans" className="text-xs">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Performans
                </TabsTrigger>
                <TabsTrigger value="diger" className="text-xs">
                  <File className="w-4 h-4 mr-1" />
                  Diğer
                </TabsTrigger>
                <TabsTrigger value="izinler" className="text-xs">
                  📅
                  İzinler
                </TabsTrigger>
                <TabsTrigger value="giris-cikis" className="text-xs">
                  🕐
                  Giriş-Çıkış
                </TabsTrigger>
                <TabsTrigger value="vardiyalar" className="text-xs">
                  📋
                  Vardiyalar
                </TabsTrigger>
              </TabsList>

              {/* Kimlik ve İletişim Bilgileri */}
              <TabsContent value="kimlik" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Kimlik ve İletişim Bilgileri
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4">
                      <DocumentUploadSection 
                        category="kimlik" 
                        documentType="cv" 
                        title="Özgeçmiş (CV)"
                      />
                      
                      <DocumentUploadSection 
                        category="kimlik" 
                        documentType="id_copy" 
                        title="Nüfus Cüzdanı Fotokopisi"
                      />
                      
                      <DocumentUploadSection 
                        category="kimlik" 
                        documentType="address" 
                        title="İkametgâh Bilgileri"
                      />
                      
                      <DocumentUploadSection 
                        category="kimlik" 
                        documentType="military" 
                        title="Askerlik Durum Belgesi (Erkek çalışanlar için)"
                      />
                      
                      <DocumentUploadSection 
                        category="kimlik" 
                        documentType="marital_status" 
                        title="Medeni Hâl Belgesi"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* İşe Alım ve Sözleşme */}
              <TabsContent value="ise-alim" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Briefcase className="w-5 h-5 mr-2" />
                      İşe Alım ve Sözleşmeye İlişkin Belgeler
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Gerekli Belgeler:</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• İş başvuru formu</li>
                          <li>• İş sözleşmesi ve ekleri</li>
                          <li>• SGK giriş bildirgesi</li>
                          <li>• Taahhütname ve gizlilik sözleşmeleri</li>
                          <li>• Referans mektupları</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Belge Durumu:</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">İş Başvuru Formu</span>
                            <Badge variant="outline">Bekliyor</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">İş Sözleşmesi</span>
                            <Badge variant="outline">Bekliyor</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">SGK Giriş</span>
                            <Badge variant="outline">Bekliyor</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Taahhütname</span>
                            <Badge variant="outline">Bekliyor</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Referans</span>
                            <Badge variant="outline">Bekliyor</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-4">
                      <DocumentUploadSection 
                        category="ise-alim" 
                        documentType="application_form" 
                        title="İş Başvuru Formu"
                      />
                      
                      <DocumentUploadSection 
                        category="ise-alim" 
                        documentType="contract" 
                        title="İş Sözleşmesi ve Ekleri"
                      />
                      
                      <DocumentUploadSection 
                        category="ise-alim" 
                        documentType="sgk_declaration" 
                        title="SGK Giriş Bildirgesi"
                      />
                      
                      <DocumentUploadSection 
                        category="ise-alim" 
                        documentType="confidentiality" 
                        title="Taahhütname ve Gizlilik Sözleşmeleri"
                      />
                      
                      <DocumentUploadSection 
                        category="ise-alim" 
                        documentType="references" 
                        title="Referans Mektupları"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Eğitim ve Mesleki Yeterlilik */}
              <TabsContent value="egitim" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Award className="w-5 h-5 mr-2" />
                      Eğitim ve Mesleki Yeterlilik Belgeleri
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4">
                      <DocumentUploadSection 
                        category="egitim" 
                        documentType="diploma" 
                        title="Diploma Fotokopileri"
                      />
                      
                      <DocumentUploadSection 
                        category="egitim" 
                        documentType="certificates" 
                        title="Sertifikalar (Mesleki Eğitim, Dil)"
                      />
                      
                      <DocumentUploadSection 
                        category="egitim" 
                        documentType="internship" 
                        title="Staj veya Çıraklık Belgeleri"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* SGK ve Vergi */}
              <TabsContent value="sgk-vergi" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="w-5 h-5 mr-2" />
                      SGK ve Vergi ile İlgili Belgeler
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Gerekli Belgeler:</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• SGK işe giriş bildirgesi</li>
                          <li>• Vergi levhası veya vergi numarası</li>
                          <li>• Emeklilik durum belgesi</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Belge Durumu:</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">SGK Giriş</span>
                            <Badge variant="outline">Bekliyor</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Vergi Levhası</span>
                            <Badge variant="outline">Bekliyor</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Emeklilik</span>
                            <Badge variant="outline">Bekliyor</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-4">
                      <DocumentUploadSection 
                        category="sgk-vergi" 
                        documentType="sgk_entry" 
                        title="SGK Giriş Bildirgesi"
                      />
                      
                      <DocumentUploadSection 
                        category="sgk-vergi" 
                        documentType="tax_plate" 
                        title="Vergi Levhası veya Vergi Numarası"
                      />
                      
                      <DocumentUploadSection 
                        category="sgk-vergi" 
                        documentType="retirement_status" 
                        title="Emeklilik Durum Belgesi"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Sağlık ve İş Güvenliği */}
              <TabsContent value="saglik" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Heart className="w-5 h-5 mr-2" />
                      Sağlık ve İş Güvenliği Belgeleri
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Gerekli Belgeler:</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Sağlık raporu (işe giriş muayenesi)</li>
                          <li>• Periyodik sağlık kontrolleri</li>
                          <li>• Aşı kartı</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Belge Durumu:</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Sağlık Raporu</span>
                            <Badge variant="outline">Bekliyor</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Periyodik Kontrol</span>
                            <Badge variant="outline">Bekliyor</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Aşı Kartı</span>
                            <Badge variant="outline">Bekliyor</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-4">
                      <DocumentUploadSection 
                        category="saglik" 
                        documentType="health_report" 
                        title="Sağlık Raporu"
                      />
                      
                      <DocumentUploadSection 
                        category="saglik" 
                        documentType="periodic_checkup" 
                        title="Periyodik Kontrol Raporu"
                      />
                      
                      <DocumentUploadSection 
                        category="saglik" 
                        documentType="vaccination_card" 
                        title="Aşı Kartı (Gerekirse)"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Performans ve Disiplin */}
              <TabsContent value="performans" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Award className="w-5 h-5 mr-2" />
                      Performans ve Disiplin Kayıtları
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Gerekli Belgeler:</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Performans değerlendirme raporları</li>
                          <li>• Disiplin cezaları veya ödül belgeleri</li>
                          <li>• İşten ayrılma belgeleri</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Belge Durumu:</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Performans Raporu</span>
                            <Badge variant="outline">Bekliyor</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Disiplin/Ödül</span>
                            <Badge variant="outline">Bekliyor</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Ayrılma Belgesi</span>
                            <Badge variant="outline">Bekliyor</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-4">
                      <DocumentUploadSection 
                        category="performans" 
                        documentType="performance_report" 
                        title="Performans Raporu"
                      />
                      
                      <DocumentUploadSection 
                        category="performans" 
                        documentType="discipline_record" 
                        title="Disiplin/Ödül Kayıtları"
                      />
                      
                      <DocumentUploadSection 
                        category="performans" 
                        documentType="termination_doc" 
                        title="Ayrılma Belgesi (Gerekirse)"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Diğer Belgeler */}
              <TabsContent value="diger" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <File className="w-5 h-5 mr-2" />
                      Diğer Önemli Belgeler
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Gerekli Belgeler:</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Yabancı uyruklu çalışma izni</li>
                          <li>• Vekâletname (ücret ödemeleri için)</li>
                          <li>• İzin talepleri ve yazışmalar</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Belge Durumu:</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Çalışma İzni</span>
                            <Badge variant="outline">Gerekli Değil</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Vekâletname</span>
                            <Badge variant="outline">Bekliyor</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">İzin Talepleri</span>
                            <Badge variant="outline">Bekliyor</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-4">
                      <DocumentUploadSection 
                        category="diger" 
                        documentType="work_permit" 
                        title="Çalışma İzni (Yabancı Uyruklu için)"
                      />
                      
                      <DocumentUploadSection 
                        category="diger" 
                        documentType="power_of_attorney" 
                        title="Vekâletname (Gerekirse)"
                      />
                      
                      <DocumentUploadSection 
                        category="diger" 
                        documentType="special_documents" 
                        title="Özel Belgeler (Sektöre Özgü)"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* İzin Yönetimi */}
              <TabsContent value="izinler" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      📅 İzin Yönetimi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">İzin Durumu:</h4>
                        <div className="space-y-2">
                          <div className="bg-blue-50 p-3 rounded">
                            <p className="text-sm font-medium">Yıllık İzin Hakkı</p>
                            <p className="text-lg font-bold text-blue-600">{selectedPersonnel.annualLeaveEntitlement || 20} gün</p>
                          </div>
                          <div className="bg-green-50 p-3 rounded">
                            <p className="text-sm font-medium">Kullanılan İzin</p>
                            <p className="text-lg font-bold text-green-600">{selectedPersonnel.usedAnnualLeave || 0} gün</p>
                          </div>
                          <div className="bg-orange-50 p-3 rounded">
                            <p className="text-sm font-medium">Kalan İzin</p>
                            <p className="text-lg font-bold text-orange-600">{(selectedPersonnel.annualLeaveEntitlement || 20) - (selectedPersonnel.usedAnnualLeave || 0)} gün</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Son İzin Talepleri:</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {personnelLeaveRequests.length > 0 ? (
                            personnelLeaveRequests.map((request: any) => (
                              <div key={request.id} className="border rounded p-2">
                                <p className="text-sm font-medium">
                                  {request.leaveType === 'yillik' ? 'Yıllık İzin' :
                                   request.leaveType === 'hastalik' ? 'Hastalık İzni' :
                                   request.leaveType === 'dogum' ? 'Doğum İzni' :
                                   request.leaveType === 'ucretsiz' ? 'Ücretsiz İzin' : request.leaveType}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {new Date(request.startDate).toLocaleDateString('tr-TR')} - {new Date(request.endDate).toLocaleDateString('tr-TR')} ({request.totalDays} gün)
                                </p>
                                <Badge 
                                  variant={request.status === 'approved' ? "default" : 
                                          request.status === 'rejected' ? "destructive" : "outline"} 
                                  className="text-xs"
                                >
                                  {request.status === 'pending' ? 'Beklemede' :
                                   request.status === 'approved' ? 'Onaylandı' :
                                   request.status === 'rejected' ? 'Reddedildi' : request.status}
                                </Badge>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500">Henüz izin talebi bulunmuyor.</p>
                          )}
                        </div>
                        <Button size="sm" className="mt-2" onClick={() => setShowLeaveRequestForm(true)}>
                          <Plus className="w-4 h-4 mr-1" />
                          Yeni İzin Talebi
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Giriş-Çıkış Kayıtları */}
              <TabsContent value="giris-cikis" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      🕐 Giriş-Çıkış Kayıtları
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Bu Hafta Özeti:</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center border-b pb-1">
                            <span className="text-sm">Pazartesi</span>
                            <span className="text-sm font-medium">09:00 - 18:00</span>
                          </div>
                          <div className="flex justify-between items-center border-b pb-1">
                            <span className="text-sm">Salı</span>
                            <span className="text-sm font-medium">09:15 - 18:05</span>
                          </div>
                          <div className="flex justify-between items-center border-b pb-1">
                            <span className="text-sm">Çarşamba</span>
                            <span className="text-sm font-medium">08:55 - 17:58</span>
                          </div>
                          <div className="flex justify-between items-center border-b pb-1">
                            <span className="text-sm">Perşembe</span>
                            <span className="text-sm font-medium">09:10 - 18:02</span>
                          </div>
                          <div className="flex justify-between items-center border-b pb-1">
                            <span className="text-sm">Cuma</span>
                            <span className="text-sm font-medium text-green-600">Aktif</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Aylık İstatistikler:</h4>
                        <div className="space-y-2">
                          <div className="bg-green-50 p-3 rounded">
                            <p className="text-sm font-medium">Toplam Çalışma Saati</p>
                            <p className="text-lg font-bold text-green-600">164 saat</p>
                          </div>
                          <div className="bg-orange-50 p-3 rounded">
                            <p className="text-sm font-medium">Geç Geliş</p>
                            <p className="text-lg font-bold text-orange-600">3 kez</p>
                          </div>
                          <div className="bg-blue-50 p-3 rounded">
                            <p className="text-sm font-medium">Mesai Saati</p>
                            <p className="text-lg font-bold text-blue-600">12 saat</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Vardiya Yönetimi */}
              <TabsContent value="vardiyalar" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center">
                        📋 Vardiya Yönetimi
                      </CardTitle>
                      <div className="text-sm text-gray-600 p-2 bg-blue-50 rounded">
                        <p>💡 Vardiya Planları sayfasından Excel yüklenir</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Güncel Vardiya Durumu:</h4>
                        <div className="border rounded p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Bugün</p>
                              <p className="text-sm text-gray-600">{new Date().toLocaleDateString('tr-TR')}</p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                              selectedPersonnel.currentShiftType === 'morning' ? 'bg-orange-100 text-orange-800' :
                              selectedPersonnel.currentShiftType === 'evening' ? 'bg-blue-100 text-blue-800' :
                              selectedPersonnel.currentShiftType === 'off' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {selectedPersonnel.currentShift || "Atanmamış"}
                            </div>
                          </div>
                        </div>
                        
                        <h4 className="font-medium mb-2 mt-4">Son Vardiya Kayıtları:</h4>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {personnelShiftAssignments.length > 0 ? (
                            personnelShiftAssignments.slice(0, 10).map((assignment: any) => (
                              <div key={assignment.id} className="flex justify-between text-sm border-b pb-1">
                                <span>{new Date(assignment.date || assignment.assignedDate).toLocaleDateString('tr-TR')}</span>
                                <span className={`font-medium ${
                                  assignment.shiftType === 'morning' ? 'text-orange-600' :
                                  assignment.shiftType === 'evening' ? 'text-blue-600' :
                                  assignment.shiftType === 'off' ? 'text-red-600' :
                                  assignment.shiftType === 'working' ? 'text-green-600' :
                                  'text-gray-600'
                                }`}>
                                  {assignment.shiftType === 'morning' ? 'Sabah (08:00-20:00)' :
                                   assignment.shiftType === 'evening' ? 'Akşam (20:00-08:00)' :
                                   assignment.shiftType === 'off' ? 'İzin' :
                                   assignment.shiftType === 'working' ? 'Çalışıyor' :
                                   assignment.shiftType || 'Bilinmiyor'}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500">Henüz vardiya ataması bulunmuyor.</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Vardiya Takvimi:</h4>
                        <div className="space-y-2">
                          {/* Takvim Başlığı */}
                          <div className="grid grid-cols-7 gap-1 text-xs font-medium text-center">
                            <div className="p-2 bg-gray-100 rounded">Pzt</div>
                            <div className="p-2 bg-gray-100 rounded">Sal</div>
                            <div className="p-2 bg-gray-100 rounded">Çar</div>
                            <div className="p-2 bg-gray-100 rounded">Per</div>
                            <div className="p-2 bg-gray-100 rounded">Cum</div>
                            <div className="p-2 bg-gray-100 rounded">Cmt</div>
                            <div className="p-2 bg-gray-100 rounded">Paz</div>
                          </div>
                          
                          {/* Takvim Günleri */}
                          <div className="grid grid-cols-7 gap-1 text-xs">
                            {(() => {
                              // Temmuz 2025 için sabit değerler kullan
                              const currentMonth = 6; // Temmuz = 6 (0-bazlı)
                              const currentYear = 2025;
                              const today = new Date();
                              
                              // Ayın ilk günü
                              const firstDay = new Date(currentYear, currentMonth, 1);
                              const lastDay = new Date(currentYear, currentMonth + 1, 0);
                              
                              // 1 Temmuz 2025 Salı günü - JavaScript'te getDay() Pazar=0, Pazartesi=1, Salı=2
                              // Takvimimizde Pazartesi=0 olması için (firstDay.getDay() + 6) % 7 kullanıyoruz
                              // 1 Temmuz 2025 = Salı = getDay()=2, (2+6)%7 = 1 (takvimde Salı konumu)
                              const firstDayOfWeek = (firstDay.getDay() + 6) % 7;
                              
                              const days = [];
                              
                              // Önceki ayın son günlerini ekle
                              for (let i = firstDayOfWeek - 1; i >= 0; i--) {
                                const prevDay = new Date(firstDay);
                                prevDay.setDate(prevDay.getDate() - (i + 1));
                                days.push(
                                  <div key={`prev-${prevDay.getDate()}`} className="p-2 text-gray-300 text-center">
                                    {prevDay.getDate()}
                                  </div>
                                );
                              }
                              
                              // Bu ayın günleri
                              for (let day = 1; day <= lastDay.getDate(); day++) {
                                const currentDate = new Date(currentYear, currentMonth, day);
                                // Timezone offset sorununu çözmek için manuel tarih formatı
                                const year = currentDate.getFullYear();
                                const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                                const dayStr = String(currentDate.getDate()).padStart(2, '0');
                                const dateStr = `${year}-${month}-${dayStr}`;
                                
                                // Bu tarihteki vardiya atamasını bul
                                const assignment = personnelShiftAssignments.find((a: any) => {
                                  // Hem date hem de assignedDate alanlarını kontrol et
                                  const assignmentDate = a.date || a.assignedDate;
                                  if (!assignmentDate) return false;
                                  
                                  // Tarihleri karşılaştır
                                  const normalizedAssignmentDate = new Date(assignmentDate).toISOString().split('T')[0];
                                  return normalizedAssignmentDate === dateStr;
                                });
                                
                                // Bugün kontrolü - sadece Temmuz 2025 için 
                                const isToday = day === today.getDate() && 
                                               currentMonth === today.getMonth() && 
                                               currentYear === today.getFullYear();
                                

                                
                                // Vardiya tipini emoji ve renk için belirle
                                let shiftDisplay = '';
                                let shiftClass = 'hover:bg-gray-100';
                                
                                if (assignment) {
                                  const shiftType = assignment.shiftType;
                                  if (shiftType === 'morning') {
                                    shiftDisplay = '🌅';
                                    shiftClass = 'bg-orange-100 text-orange-800 hover:bg-orange-200';
                                  } else if (shiftType === 'evening') {
                                    shiftDisplay = '🌙';
                                    shiftClass = 'bg-blue-100 text-blue-800 hover:bg-blue-200';
                                  } else if (shiftType === 'off') {
                                    shiftDisplay = '🏖️';
                                    shiftClass = 'bg-red-100 text-red-800 hover:bg-red-200';
                                  } else if (shiftType === 'working') {
                                    shiftDisplay = '💼';
                                    shiftClass = 'bg-green-100 text-green-800 hover:bg-green-200';
                                  }
                                }
                                
                                days.push(
                                  <div 
                                    key={day}
                                    className={`p-2 text-center cursor-pointer rounded transition-all duration-200 hover:scale-105 ${
                                      isToday ? 'bg-blue-500 text-white font-bold' : shiftClass
                                    }`}
                                    onClick={() => {
                                      if (assignment) {
                                        setSelectedDate(dateStr);
                                        setSelectedShiftDetails(assignment);
                                      }
                                    }}
                                    title={assignment ? 
                                      `${assignment.shiftType === 'morning' ? 'Sabah Vardiyası (08:00-20:00)' :
                                        assignment.shiftType === 'evening' ? 'Akşam Vardiyası (20:00-08:00)' :
                                        assignment.shiftType === 'off' ? 'İzin Günü' :
                                        assignment.shiftType === 'working' ? 'Çalışma Günü' :
                                        'Bilinmiyor'}` : 
                                      'Vardiya atanmamış'}
                                  >
                                    <div className="font-medium">{day}</div>
                                    {assignment && (
                                      <div className="text-xs mt-1">
                                        {shiftDisplay}
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                              
                              // Sonraki ayın ilk günlerini ekle (7'nin katı olana kadar)
                              const remainingDays = 42 - days.length; // 6 hafta x 7 gün
                              for (let day = 1; day <= remainingDays; day++) {
                                const nextDay = new Date(currentYear, currentMonth + 1, day);
                                days.push(
                                  <div key={`next-${day}`} className="p-2 text-gray-300 text-center">
                                    {nextDay.getDate()}
                                  </div>
                                );
                              }
                              
                              return days;
                            })()}
                          </div>
                          
                          {/* Vardiya Açıklamaları */}
                          <div className="flex justify-between text-xs mt-3 pt-3 border-t">
                            <div className="flex items-center space-x-1">
                              <div className="w-3 h-3 bg-orange-100 rounded"></div>
                              <span>🌅 Sabah (08:00-20:00)</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <div className="w-3 h-3 bg-blue-100 rounded"></div>
                              <span>🌙 Akşam (20:00-08:00)</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <div className="w-3 h-3 bg-red-100 rounded"></div>
                              <span>🏖️ İzin</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Vardiya Detay Dialog */}
      <Dialog open={!!selectedShiftDetails} onOpenChange={() => setSelectedShiftDetails(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vardiya Detayları</DialogTitle>
          </DialogHeader>
          
          {selectedShiftDetails && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-lg font-medium">
                  {new Date(selectedShiftDetails.date || selectedShiftDetails.assignedDate).toLocaleDateString('tr-TR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
                <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-medium mt-2 ${
                  selectedShiftDetails.shiftType === 'morning' ? 'bg-orange-100 text-orange-800' :
                  selectedShiftDetails.shiftType === 'evening' ? 'bg-blue-100 text-blue-800' :
                  selectedShiftDetails.shiftType === 'off' ? 'bg-red-100 text-red-800' :
                  selectedShiftDetails.shiftType === 'working' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {selectedShiftDetails.shiftType === 'morning' ? '🌅 Sabah Vardiyası' :
                   selectedShiftDetails.shiftType === 'evening' ? '🌙 Akşam Vardiyası' :
                   selectedShiftDetails.shiftType === 'off' ? '🏖️ İzin Günü' :
                   selectedShiftDetails.shiftType === 'working' ? '💼 Çalışma Günü' :
                   '❓ Bilinmiyor'}
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">Vardiya Türü:</span>
                  <span className="text-lg font-bold">
                    {selectedShiftDetails.shiftType === 'morning' ? 'Sabah Vardiyası' :
                     selectedShiftDetails.shiftType === 'evening' ? 'Akşam Vardiyası' :
                     selectedShiftDetails.shiftType === 'off' ? 'İzin Günü' :
                     selectedShiftDetails.shiftType === 'working' ? 'Çalışma Günü' :
                     'Bilinmiyor'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">Çalışma Saatleri:</span>
                  <span className="font-medium text-blue-600">
                    {selectedShiftDetails.shiftType === 'morning' ? '08:00 - 20:00 (12 Saat)' :
                     selectedShiftDetails.shiftType === 'evening' ? '20:00 - 08:00 (12 Saat)' :
                     selectedShiftDetails.shiftType === 'off' ? 'İzin günü - Çalışma yok' :
                     selectedShiftDetails.shiftType === 'working' ? 'Özel çalışma günü' :
                     'Belirtilmemiş'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">Vardiya Kodu:</span>
                  <span className="font-bold text-green-600">
                    {selectedShiftDetails.shiftType === 'morning' ? 'S (Sabah)' :
                     selectedShiftDetails.shiftType === 'evening' ? 'A (Akşam)' :
                     selectedShiftDetails.shiftType === 'off' ? 'OF (İzin)' :
                     selectedShiftDetails.shiftType === 'working' ? 'Ç (Çalışma)' :
                     'Bilinmiyor'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">Durum:</span>
                  <span className="font-medium">
                    {selectedShiftDetails.status === 'assigned' ? '✅ Atanmış' :
                     selectedShiftDetails.status === 'completed' ? '✅ Tamamlanmış' :
                     selectedShiftDetails.status === 'pending' ? '⏳ Beklemede' :
                     '❓ Belirsiz'}
                  </span>
                </div>
                
                {selectedShiftDetails.shiftType !== 'off' && (
                  <div className="text-sm text-gray-600 text-center p-3 bg-blue-50 rounded border border-blue-200">
                    <p>💡 Bu vardiya Excel dosyasından otomatik olarak atanmıştır.</p>
                    <p className="text-xs mt-1">Vardiya planı değişiklikleri için Vardiya Planları sayfasını kullanın.</p>
                  </div>
                )}
                
                {selectedShiftDetails.notes && (
                  <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                    <span className="font-medium text-yellow-800">Not:</span>
                    <p className="text-sm text-yellow-700 mt-1">{selectedShiftDetails.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* İzin Talebi Formu */}
      <Dialog open={showLeaveRequestForm} onOpenChange={setShowLeaveRequestForm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Yeni İzin Talebi Oluştur</DialogTitle>
            </DialogHeader>
            <Form {...leaveForm}>
              <form onSubmit={leaveForm.handleSubmit(onSubmitLeaveRequest)} className="space-y-4">
                <FormField
                  control={leaveForm.control}
                  name="leaveType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İzin Türü</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="İzin türü seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="yillik">Yıllık İzin</SelectItem>
                          <SelectItem value="hastalik">Hastalık İzni</SelectItem>
                          <SelectItem value="dogum">Doğum İzni</SelectItem>
                          <SelectItem value="babalik">Babalık İzni</SelectItem>
                          <SelectItem value="mazeret">Mazeret İzni</SelectItem>
                          <SelectItem value="diger">Diğer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={leaveForm.control}
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
                  control={leaveForm.control}
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
                
                <FormField
                  control={leaveForm.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İzin Sebebi</FormLabel>
                      <FormControl>
                        <Textarea placeholder="İzin sebebini açıklayın..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={leaveForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ek Notlar (İsteğe Bağlı)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Ek notlarınızı buraya yazın..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowLeaveRequestForm(false)}>
                    İptal
                  </Button>
                  <Button type="submit" disabled={createLeaveRequestMutation.isPending}>
                    {createLeaveRequestMutation.isPending ? "Oluşturuluyor..." : "İzin Talebi Oluştur"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* SMS Gönderme Dialog */}
        <Dialog open={showSmsDialog} onOpenChange={setShowSmsDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <MessageCircle className="w-5 h-5 mr-2" />
                SMS Gönder - {selectedPersonnel?.firstName} {selectedPersonnel?.lastName}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Telefon Numarası</label>
                <Input 
                  value={selectedPersonnel?.phone || ""} 
                  disabled 
                  className="bg-gray-50"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Mesaj</label>
                <Textarea
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  placeholder="SMS mesajınızı yazın..."
                  rows={4}
                  maxLength={160}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {smsMessage.length}/160 karakter
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSmsDialog(false)}
                >
                  İptal
                </Button>
                <Button
                  onClick={handleSendSMS}
                  disabled={sendSMSMutation.isPending || !smsMessage}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sendSMSMutation.isPending ? "Gönderiliyor..." : "SMS Gönder"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Bildirim Gönderme Dialog */}
        <Dialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Bildirim Gönder - {selectedPersonnel?.firstName} {selectedPersonnel?.lastName}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Başlık</label>
                <Input
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                  placeholder="Bildirim başlığı..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Mesaj</label>
                <Textarea
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  placeholder="Bildirim mesajınızı yazın..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowNotificationDialog(false)}
                >
                  İptal
                </Button>
                <Button
                  onClick={handleSendNotification}
                  disabled={sendNotificationMutation.isPending || !notificationTitle || !notificationMessage}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sendNotificationMutation.isPending ? "Gönderiliyor..." : "Bildirim Gönder"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
    </div>
  );
}
