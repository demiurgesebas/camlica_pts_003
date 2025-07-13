import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertNotificationSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Bell, Plus, Send, Users, Building, User, MessageCircle, Eye, CheckCircle } from "lucide-react";
import { z } from "zod";

const notificationFormSchema = insertNotificationSchema.extend({
  title: z.string().min(1, "Başlık gereklidir"),
  message: z.string().min(1, "Mesaj gereklidir"),
  type: z.string().min(1, "Bildirim türü gereklidir"),
  targetType: z.string().min(1, "Hedef türü gereklidir"),
});

export default function Notifications() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkSmsDialogOpen, setBulkSmsDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [smsMessage, setSmsMessage] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof notificationFormSchema>>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      title: "",
      message: "",
      type: "info",
      targetType: "all",
    },
  });

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["/api/notifications"],
  });

  const { data: branches } = useQuery({
    queryKey: ["/api/branches"],
  });

  const { data: departments } = useQuery({
    queryKey: ["/api/departments"],
  });

  const { data: personnel } = useQuery({
    queryKey: ["/api/personnel"],
  });

  const createNotificationMutation = useMutation({
    mutationFn: async (data: z.infer<typeof notificationFormSchema>) => {
      await apiRequest('/api/notifications', { method: 'POST', body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Başarılı",
        description: "Bildirim başarıyla gönderildi",
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

  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/notifications/${id}/read`, { method: 'PUT' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Başarılı",
        description: "Bildirim okundu olarak işaretlendi",
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

  // Toplu SMS gönderme mutation
  const sendBulkSMSMutation = useMutation({
    mutationFn: async ({ phoneNumbers, message }: { phoneNumbers: string[], message: string }) => {
      const response = await fetch('/api/sms/send-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumbers, message }),
      });
      
      if (!response.ok) {
        throw new Error('Toplu SMS gönderilemedi');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Başarılı",
        description: data.message || "Toplu SMS başarıyla gönderildi",
      });
      setBulkSmsDialogOpen(false);
      setSmsMessage("");
      setSelectedBranch("all");
      setSelectedDepartment("all");
      setShowPreview(false);
      setShowConfirmDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Toplu SMS gönderilirken hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Filtrelenmiş personel listesi
  const getFilteredPersonnel = () => {
    if (!personnel) return [];
    
    return personnel.filter((person: any) => {
      if (selectedBranch !== "all" && person.branchId !== parseInt(selectedBranch)) return false;
      if (selectedDepartment !== "all" && person.departmentId !== parseInt(selectedDepartment)) return false;
      return person.phone && person.phone.trim() !== "";
    });
  };

  const handlePreviewSMS = () => {
    const filteredPersonnel = getFilteredPersonnel();
    
    if (filteredPersonnel.length === 0) {
      toast({
        title: "Hata",
        description: "Seçilen kriterlere uygun telefon numarası bulunamadı",
        variant: "destructive",
      });
      return;
    }

    if (!smsMessage.trim()) {
      toast({
        title: "Hata",
        description: "SMS mesajı gerekli",
        variant: "destructive",
      });
      return;
    }

    setShowPreview(true);
  };

  const handleConfirmSend = () => {
    setShowPreview(false);
    setShowConfirmDialog(true);
  };

  const handleSendBulkSMS = () => {
    const filteredPersonnel = getFilteredPersonnel();
    const phoneNumbers = filteredPersonnel.map((person: any) => person.phone);
    
    sendBulkSMSMutation.mutate({
      phoneNumbers,
      message: smsMessage
    });
    
    setShowConfirmDialog(false);
  };

  const filteredNotifications = notifications?.filter((notification: any) =>
    filterType === "all" || notification.type === filterType
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case "info":
        return "default";
      case "warning":
        return "secondary";
      case "error":
        return "destructive";
      case "success":
        return "outline";
      default:
        return "default";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "info":
        return "Bilgi";
      case "warning":
        return "Uyarı";
      case "error":
        return "Hata";
      case "success":
        return "Başarılı";
      default:
        return type;
    }
  };

  const getTargetTypeLabel = (targetType: string) => {
    switch (targetType) {
      case "all":
        return "Tüm Personel";
      case "branch":
        return "Şube";
      case "individual":
        return "Bireysel";
      case "team":
        return "Takım";
      default:
        return targetType;
    }
  };

  const getTargetTypeIcon = (targetType: string) => {
    switch (targetType) {
      case "all":
        return Users;
      case "branch":
        return Building;
      case "individual":
        return User;
      case "team":
        return Users;
      default:
        return Bell;
    }
  };

  const handleSubmit = (data: z.infer<typeof notificationFormSchema>) => {
    createNotificationMutation.mutate(data);
  };

  const handleMarkAsRead = (id: number) => {
    markAsReadMutation.mutate(id);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Bildirim Yönetimi</h1>
          <p className="text-gray-600">Personele bildirim gönder ve geçmişi görüntüle</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={bulkSmsDialogOpen} onOpenChange={setBulkSmsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50">
                <MessageCircle className="w-4 h-4 mr-2" />
                Toplu SMS
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Toplu SMS Gönder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Şube</label>
                    <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                      <SelectTrigger>
                        <SelectValue placeholder="Şube seçin" />
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
                  <div>
                    <label className="text-sm font-medium">Birim</label>
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                      <SelectTrigger>
                        <SelectValue placeholder="Birim seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tüm Birimler</SelectItem>
                        {departments?.map((department: any) => (
                          <SelectItem key={department.id} value={department.id.toString()}>
                            {department.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Hedef Personel:</strong> {getFilteredPersonnel().length} kişi
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Sadece telefon numarası olan personele SMS gönderilir
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">SMS Mesajı</label>
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
                    onClick={() => setBulkSmsDialogOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handlePreviewSMS}
                    disabled={!smsMessage || getFilteredPersonnel().length === 0}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ön İzleme
                  </Button>
                  <Button
                    onClick={handlePreviewSMS}
                    disabled={!smsMessage || getFilteredPersonnel().length === 0}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Gönder
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Yeni Bildirim
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Yeni Bildirim Gönder</DialogTitle>
              </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Başlık</FormLabel>
                      <FormControl>
                        <Input placeholder="Bildirim başlığı" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mesaj</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Bildirim mesajı" rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bildirim Türü</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="info">Bilgi</SelectItem>
                            <SelectItem value="warning">Uyarı</SelectItem>
                            <SelectItem value="error">Hata</SelectItem>
                            <SelectItem value="success">Başarılı</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="targetType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hedef</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="all">Tüm Personel</SelectItem>
                            <SelectItem value="branch">Şube</SelectItem>
                            <SelectItem value="individual">Bireysel</SelectItem>
                            <SelectItem value="team">Takım</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {form.watch("targetType") === "branch" && (
                  <FormField
                    control={form.control}
                    name="targetId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Şube Seçin</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value?.toString()}>
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
                )}
                {form.watch("targetType") === "individual" && (
                  <FormField
                    control={form.control}
                    name="targetId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Personel Seçin</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Personel seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {personnel?.map((person: any) => (
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
                )}
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
                    disabled={createNotificationMutation.isPending}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Gönder
                  </Button>
                </div>
              </form>
            </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* SMS Ön İzleme Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>SMS Ön İzleme</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Mesaj Önizleme */}
            <div className="bg-blue-50 p-4 rounded-lg border">
              <h3 className="font-medium text-blue-900 mb-2">Gönderilecek Mesaj:</h3>
              <div className="bg-white p-3 rounded border text-sm">
                {smsMessage}
              </div>
              <p className="text-xs text-blue-600 mt-2">
                Karakter sayısı: {smsMessage.length}/160
              </p>
            </div>

            {/* Hedef Personel Listesi */}
            <div className="bg-green-50 p-4 rounded-lg border">
              <h3 className="font-medium text-green-900 mb-2">
                Hedef Personel ({getFilteredPersonnel().length} kişi):
              </h3>
              <div className="max-h-60 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {getFilteredPersonnel().map((person: any) => (
                    <div key={person.id} className="bg-white p-2 rounded border text-sm flex justify-between items-center">
                      <span>
                        <strong>{person.firstName} {person.lastName}</strong>
                        <br />
                        <span className="text-gray-600">
                          {person.employeeNumber} - {departments?.find((d: any) => d.id === person.departmentId)?.name || 'Birim yok'}
                        </span>
                      </span>
                      <span className="text-green-600 font-mono text-xs">
                        {person.phone}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Özet Bilgiler */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-medium text-gray-900 mb-2">Gönderim Özeti:</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Toplam Alıcı:</span>
                  <div className="font-bold text-lg">{getFilteredPersonnel().length}</div>
                </div>
                <div>
                  <span className="text-gray-600">Şube Filtresi:</span>
                  <div className="font-medium">
                    {selectedBranch === "all" 
                      ? "Tüm Şubeler" 
                      : branches?.find((b: any) => b.id.toString() === selectedBranch)?.name || "Bilinmeyen"
                    }
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Birim Filtresi:</span>
                  <div className="font-medium">
                    {selectedDepartment === "all" 
                      ? "Tüm Birimler" 
                      : departments?.find((d: any) => d.id.toString() === selectedDepartment)?.name || "Bilinmeyen"
                    }
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Mesaj Uzunluğu:</span>
                  <div className="font-medium">{smsMessage.length} karakter</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowPreview(false)}
              >
                Geri Dön
              </Button>
              <Button
                onClick={handleConfirmSend}
                className="bg-green-600 hover:bg-green-700"
              >
                <Send className="w-4 h-4 mr-2" />
                SMS Göndermeyi Onayla
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* SMS Gönderim Onay Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-orange-600">
              <CheckCircle className="w-5 h-5 mr-2" />
              SMS Gönderim Onayı
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <p className="text-orange-800 text-center">
                <strong>{getFilteredPersonnel().length} kişiye</strong> SMS göndermek üzeresiniz.
              </p>
              <p className="text-orange-700 text-sm text-center mt-2">
                Bu işlem geri alınamaz ve SMS ücretlendirilecektir.
              </p>
            </div>
            
            <div className="text-center text-sm text-gray-600">
              Mesaj: <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                "{smsMessage.substring(0, 50)}{smsMessage.length > 50 ? '...' : ''}"
              </span>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
              >
                İptal
              </Button>
              <Button
                onClick={handleSendBulkSMS}
                disabled={sendBulkSMSMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <Send className="w-4 h-4 mr-2" />
                {sendBulkSMSMutation.isPending ? "Gönderiliyor..." : "Evet, Gönder"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Tür:</span>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="info">Bilgi</SelectItem>
                  <SelectItem value="warning">Uyarı</SelectItem>
                  <SelectItem value="error">Hata</SelectItem>
                  <SelectItem value="success">Başarılı</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Bildirim Geçmişi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Başlık</TableHead>
                  <TableHead>Tür</TableHead>
                  <TableHead>Hedef</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotifications?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Henüz bildirim bulunmuyor
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNotifications?.map((notification: any) => {
                    const TargetIcon = getTargetTypeIcon(notification.targetType);
                    return (
                      <TableRow key={notification.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{notification.title}</p>
                            <p className="text-sm text-gray-600">{notification.message}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getTypeColor(notification.type)}>
                            {getTypeLabel(notification.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <TargetIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">
                              {getTargetTypeLabel(notification.targetType)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {new Date(notification.createdAt).toLocaleString('tr-TR')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={notification.isRead ? "outline" : "default"}>
                            {notification.isRead ? "Okundu" : "Okunmadı"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                              disabled={markAsReadMutation.isPending}
                            >
                              Okundu İşaretle
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}