import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { QrCode, RefreshCw, History, Clock, Monitor, Plus, ExternalLink, Edit2, Trash2, Settings, Power, Key, Smartphone, Unlink } from "lucide-react";

export default function QRManagement() {
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [expiryMinutes, setExpiryMinutes] = useState<number>(1);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [screens, setScreens] = useState<{id: string, active: boolean, accessCode?: string, deviceId?: string}[]>([]);

  // Backend'den QR ekranlarını yükle
  const { data: backendScreens, isLoading: screensLoading, refetch: refetchScreens } = useQuery({
    queryKey: ['/api/qr-screens'],
    refetchInterval: 5000, // Her 5 saniyede güncelle
  });

  // Backend verilerini local state ile senkronize et
  useEffect(() => {
    if (backendScreens && Array.isArray(backendScreens)) {
      const formattedScreens = backendScreens.map((screen: any) => ({
        id: screen.screenId,
        active: screen.active,
        accessCode: screen.accessCode,
        deviceId: screen.deviceId,
        lastActivity: screen.lastActivity
      }));
      setScreens(formattedScreens);
      console.log('Backend screens updated:', formattedScreens);
    }
  }, [backendScreens]);
  const [newScreenId, setNewScreenId] = useState<string>('');
  const [editingScreen, setEditingScreen] = useState<string | null>(null);
  const [editScreenName, setEditScreenName] = useState<string>('');
  const [editingAccessCode, setEditingAccessCode] = useState<string | null>(null);
  const [newAccessCode, setNewAccessCode] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Cihaz durumunu kontrol et
  const isDeviceConnected = (screenId: string) => {
    const screen = screens.find(s => s.id === screenId);
    console.log(`Device connection check for ${screenId}:`, screen?.deviceId);
    return !!screen?.deviceId;
  };

  const { data: branches } = useQuery({
    queryKey: ["/api/branches"],
  });

  const { data: activeQrCodes, isLoading } = useQuery({
    queryKey: ["/api/qr-codes/active"],
    refetchInterval: 1000, // Refetch every second to update time remaining
  });

  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const createQrCodeMutation = useMutation({
    mutationFn: async (data: { branchId: number; expiryMinutes: number }) => {
      await apiRequest("/api/qr-codes", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qr-codes/active"] });
      toast({
        title: "Başarılı",
        description: "Yeni QR kod oluşturuldu",
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

  const deleteAllQrCodesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/qr-codes/all", {
        method: "DELETE",
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/qr-codes/active"] });
      toast({
        title: "Başarılı",
        description: `Tüm QR kodlar silindi (${data.deletedCount} adet)`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata", 
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const clearAllScreens = async () => {
    try {
      // Tüm ekranları backend'den sil
      for (const screen of screens) {
        await apiRequest(`/api/qr-screens/${screen.id}`, {
          method: 'DELETE',
        });
      }
      
      // Query'yi yeniden fetch et
      refetchScreens();
      
      toast({
        title: "Başarılı",
        description: "Tüm QR ekranları temizlendi",
      });
    } catch (error) {
      console.error('Error clearing screens:', error);
      toast({
        title: "Hata",
        description: "QR ekranları temizlenirken hata oluştu",
        variant: "destructive",
      });
    }
  };

  const handleCreateQrCode = () => {
    if (!selectedBranch) {
      toast({
        title: "Hata",
        description: "Lütfen bir şube seçin",
        variant: "destructive",
      });
      return;
    }

    createQrCodeMutation.mutate({
      branchId: parseInt(selectedBranch),
      expiryMinutes,
    });
  };

  // Calculate time remaining for active QR codes
  useEffect(() => {
    if (activeQrCodes && activeQrCodes.length > 0) {
      const activeCode = activeQrCodes[0];
      const now = new Date();
      const expires = new Date(activeCode.expiresAt);
      const remaining = Math.max(0, Math.floor((expires.getTime() - now.getTime()) / 1000));
      setTimeRemaining(remaining);
    }
  }, [activeQrCodes]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getActiveQrCode = () => {
    if (!activeQrCodes || activeQrCodes.length === 0) return null;
    
    const now = new Date();
    return activeQrCodes.find((code: any) => 
      code.isActive && new Date(code.expiresAt) > now
    );
  };

  const activeCode = getActiveQrCode();

  const handleEditScreen = (screenId: string) => {
    setEditingScreen(screenId);
    setEditScreenName(screenId);
  };

  const handleSaveScreenEdit = async () => {
    if (editingScreen && editScreenName && !screens.some(s => s.id === editScreenName)) {
      try {
        await apiRequest(`/api/qr-screens/${editingScreen}`, {
          method: 'PUT',
          body: JSON.stringify({
            screenId: editScreenName,
            name: `Ekran ${editScreenName}`
          }),
        });
        
        // Query'yi yeniden fetch et
        refetchScreens();
        
        setEditingScreen(null);
        setEditScreenName('');
        toast({
          title: "Başarılı",
          description: `Ekran ID ${editingScreen} → ${editScreenName} olarak güncellendi`,
        });
      } catch (error) {
        console.error('Error updating screen:', error);
        toast({
          title: "Hata",
          description: "Ekran güncellenirken hata oluştu",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteScreen = async (screenId: string) => {
    if (screens.length > 1) {
      try {
        await apiRequest(`/api/qr-screens/${screenId}`, {
          method: 'DELETE',
        });
        
        // Query'yi yeniden fetch et
        refetchScreens();
        
        toast({
          title: "Başarılı",
          description: `Ekran ${screenId} silindi`,
        });
      } catch (error) {
        console.error('Error deleting screen:', error);
        toast({
          title: "Hata",
          description: "Ekran silinirken hata oluştu",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Hata",
        description: "En az bir ekran bulunması gereklidir",
        variant: "destructive",
      });
    }
  };

  const toggleScreenActive = async (screenId: string) => {
    try {
      const currentScreen = screens.find(s => s.id === screenId);
      if (!currentScreen) return;
      
      await apiRequest(`/api/qr-screens/${screenId}`, {
        method: 'PUT',
        body: {
          active: !currentScreen.active
        },
      });
      
      // Query'yi yeniden fetch et
      refetchScreens();
      
      toast({
        title: "Başarılı",
        description: `Ekran "${screenId}" ${!currentScreen.active ? 'aktif' : 'pasif'} edildi`,
      });
    } catch (error) {
      console.error('Error toggling screen:', error);
      toast({
        title: "Hata",
        description: "Ekran durumu güncellenirken hata oluştu",
        variant: "destructive",
      });
    }
  };

  const handleEditAccessCode = (screenId: string) => {
    const screen = screens.find(s => s.id === screenId);
    setEditingAccessCode(screenId);
    setNewAccessCode(screen?.accessCode || '');
  };

  const handleSaveAccessCode = async () => {
    if (editingAccessCode && newAccessCode.trim()) {
      try {
        await apiRequest(`/api/qr-screens/${editingAccessCode}`, {
          method: 'PUT',
          body: {
            accessCode: newAccessCode.trim().toUpperCase()
          },
        });
        
        // Query'yi yeniden fetch et
        refetchScreens();
        
        setEditingAccessCode(null);
        setNewAccessCode('');
        toast({
          title: "Başarılı",
          description: `Ekran "${editingAccessCode}" erişim kodu güncellendi`,
        });
      } catch (error) {
        console.error('Error updating access code:', error);
        toast({
          title: "Hata",
          description: "Erişim kodu güncellenirken hata oluştu",
          variant: "destructive",
        });
      }
    }
  };

  const handleCancelAccessCodeEdit = () => {
    setEditingAccessCode(null);
    setNewAccessCode('');
  };

  const generateNewAccessCode = async (screenId: string) => {
    try {
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      await apiRequest(`/api/qr-screens/${screenId}`, {
        method: 'PUT',
        body: {
          accessCode: newCode
        },
      });
      
      // Query'yi yeniden fetch et
      refetchScreens();
      
      toast({
        title: "Başarılı",
        description: `Ekran "${screenId}" için yeni erişim kodu oluşturuldu: ${newCode}`,
      });
    } catch (error) {
      console.error('Error generating new access code:', error);
      toast({
        title: "Hata",
        description: "Yeni erişim kodu oluşturulurken hata oluştu",
        variant: "destructive",
      });
    }
  };

  const unbindDevice = async (screenId: string) => {
    try {
      // Backend'de cihaz bağlantısını kaldır
      await apiRequest(`/api/qr-screens/${screenId}`, {
        method: 'PUT',
        body: {
          deviceId: null
        },
      });
      
      // Bu ekran için tüm cihazlarda auth bilgilerini temizle
      const deviceAuthKey = `qr-screen-auth-${screenId}`;
      localStorage.removeItem(deviceAuthKey);
      
      // Tüm localStorage'deki auth kayıtlarını temizle (güvenlik için)
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (key.startsWith(`qr-screen-auth-${screenId}`)) {
          localStorage.removeItem(key);
        }
      });
      
      // Query'yi yeniden fetch et
      refetchScreens();
      
      toast({
        title: "Başarılı",
        description: `Ekran "${screenId}" cihaz bağlantısı kaldırıldı. Tüm cihazlarda erişim sıfırlandı.`,
      });
    } catch (error) {
      console.error('Error unbinding device:', error);
      toast({
        title: "Hata",
        description: "Cihaz bağlantısı kaldırılırken hata oluştu",
        variant: "destructive",
      });
    }
  };

  // Erişim kodunu kopyala
  const copyAccessCode = async (accessCode: string) => {
    try {
      await navigator.clipboard.writeText(accessCode);
      toast({
        title: "Kopyalandı",
        description: `Erişim kodu "${accessCode}" panoya kopyalandı`,
      });
    } catch (error) {
      // Fallback için input element kullan
      const textArea = document.createElement('textarea');
      textArea.value = accessCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast({
        title: "Kopyalandı",
        description: `Erişim kodu "${accessCode}" panoya kopyalandı`,
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingScreen(null);
    setEditScreenName('');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">QR Kod Yönetimi</h1>
          <p className="text-gray-600">Güvenli giriş-çıkış için QR kodları yönet</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* QR Code Generator */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <QrCode className="w-5 h-5 mr-2" />
              QR Kod Oluşturucu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Şube</label>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Şube seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches?.map((branch: any) => (
                      <SelectItem key={branch.id} value={branch.id.toString()}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Süre (Dakika)</label>
                <Select value={expiryMinutes.toString()} onValueChange={(value) => setExpiryMinutes(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Dakika</SelectItem>
                    <SelectItem value="2">2 Dakika</SelectItem>
                    <SelectItem value="5">5 Dakika</SelectItem>
                    <SelectItem value="10">10 Dakika</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={handleCreateQrCode}
                disabled={createQrCodeMutation.isPending}
                className="w-full bg-primary hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Yeni QR Kod Oluştur
              </Button>
              
              <Button 
                onClick={() => deleteAllQrCodesMutation.mutate()}
                disabled={deleteAllQrCodesMutation.isPending}
                variant="destructive"
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Tüm QR Kodları Sil
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Active QR Code */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <QrCode className="w-5 h-5 mr-2" />
              Aktif QR Kod
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : activeCode ? (
              <div className="text-center space-y-4">
                <div className="w-32 h-32 bg-white border-2 border-gray-200 rounded-lg mx-auto flex items-center justify-center">
                  <div className="text-xs font-mono break-all p-2">
                    {activeCode.code}
                  </div>
                </div>
                <div className="space-y-2">
                  <Badge variant="default" className="text-xs">
                    Aktif
                  </Badge>
                  <div className="flex items-center justify-center space-x-2 text-sm">
                    <Clock className="w-4 h-4" />
                    <span className={`font-medium ${timeRemaining < 30 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatTime(timeRemaining)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <QrCode className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">Aktif QR kod bulunmuyor</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Bugünkü Taramalar</p>
                <p className="text-2xl font-bold text-primary">
                  {dashboardStats?.todayQrScans || 0}
                </p>
              </div>
              <QrCode className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aktif QR Kodlar</p>
                <p className="text-2xl font-bold text-green-600">
                  {activeQrCodes?.length || 0}
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ortalama Süre</p>
                <p className="text-2xl font-bold text-amber-600">
                  {expiryMinutes}dk
                </p>
              </div>
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manuel QR Kod Geçmişi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="w-5 h-5 mr-2" />
            Manuel QR Kod Geçmişi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeQrCodes && activeQrCodes.length > 0 ? (
            <div className="space-y-4">
              {activeQrCodes.map((code: any) => (
                <div key={code.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <QrCode className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">{code.code}</p>
                      <p className="text-sm text-gray-600">
                        Oluşturulma: {new Date(code.createdAt).toLocaleString('tr-TR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={code.isActive && new Date(code.expiresAt) > new Date() ? "default" : "secondary"}>
                      {code.isActive && new Date(code.expiresAt) > new Date() ? "Aktif" : "Süresi Dolmuş"}
                    </Badge>
                    <p className="text-sm text-gray-600 mt-1">
                      Bitiş: {new Date(code.expiresAt).toLocaleString('tr-TR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <History className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Henüz manuel QR kod oluşturulmamış</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Display Screens Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Monitor className="w-5 h-5 mr-2" />
            QR Görüntüleme Ekranları
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {screens.map((screen) => (
              <div key={screen.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Monitor className="w-4 h-4 text-blue-600" />
                    {editingScreen === screen.id ? (
                      <input
                        type="text"
                        value={editScreenName}
                        onChange={(e) => setEditScreenName(e.target.value)}
                        className="border rounded px-2 py-1 text-sm font-medium"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveScreenEdit();
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                      />
                    ) : (
                      <span className="font-medium">{screen.id}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={screen.active ? "default" : "secondary"} className="text-xs">
                      {screen.active ? "Aktif" : "Pasif"}
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => toggleScreenActive(screen.id)}
                      className={screen.active ? "text-orange-600" : "text-green-600"}
                    >
                      {screen.active ? "Pasif Yap" : "Aktif Yap"}
                    </Button>
                    {editingScreen === screen.id ? (
                      <div className="flex space-x-1">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleSaveScreenEdit}
                          disabled={!editScreenName || screens.some(s => s.id === editScreenName)}
                        >
                          ✓
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleCancelEdit}
                        >
                          ✗
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditScreen(screen.id)}
                      >
                        <Settings className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    30 saniyede bir otomatik yenilenen QR kod
                  </p>
                  <p className="text-xs text-gray-500">
                    Son güncelleme: {new Date().toLocaleTimeString('tr-TR')}
                  </p>
                  <div className="text-xs text-green-600 font-medium">
                    ✓ Ekran bağımsız QR kodları aktif
                  </div>
                </div>
                
                {/* Access Code Management */}
                <div className="border-t pt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Key className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-medium">Erişim Kodu:</span>
                    </div>
                    {editingAccessCode === screen.id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={newAccessCode}
                          onChange={(e) => setNewAccessCode(e.target.value)}
                          className="border rounded px-2 py-1 text-xs font-mono w-20"
                          maxLength={8}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveAccessCode();
                            if (e.key === 'Escape') handleCancelAccessCodeEdit();
                          }}
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleSaveAccessCode}
                          className="text-green-600 text-xs px-2"
                        >
                          ✓
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleCancelAccessCodeEdit}
                          className="text-gray-600 text-xs px-2"
                        >
                          ✗
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <code 
                          className="bg-gray-100 px-2 py-1 rounded text-xs font-mono cursor-pointer hover:bg-gray-200 transition-colors"
                          onClick={() => copyAccessCode(screen.accessCode || '')}
                          title="Kopyalamak için tıklayın"
                        >
                          {screen.accessCode || 'N/A'}
                        </code>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditAccessCode(screen.id)}
                          className="text-blue-600 text-xs px-2"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => generateNewAccessCode(screen.id)}
                          className="text-amber-600 text-xs px-2"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Device Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">Bağlı Cihaz:</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isDeviceConnected(screen.id) ? (
                        <>
                          <Badge variant="outline" className="text-xs text-green-600">
                            Bağlı
                          </Badge>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => unbindDevice(screen.id)}
                            className="text-red-600 text-xs px-2"
                          >
                            <Unlink className="w-3 h-3" />
                          </Button>
                        </>
                      ) : (
                        <Badge variant="outline" className="text-xs text-gray-600">
                          Bağlı Değil
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => window.open(`/qr-display/${screen.id}`, '_blank')}
                    disabled={editingScreen === screen.id}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Aç
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/qr-display/${screen.id}`);
                      toast({
                        title: "Başarılı",
                        description: "Ekran URL'si kopyalandı",
                      });
                    }}
                    disabled={editingScreen === screen.id}
                  >
                    URL
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteScreen(screen.id)}
                    disabled={editingScreen === screen.id || screens.length <= 1}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
            
            {/* Add New Screen */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center space-y-3 min-h-[140px]">
              <Plus className="w-8 h-8 text-gray-400" />
              <div className="space-y-2 text-center">
                <input
                  type="text"
                  placeholder="Ekran ID"
                  value={newScreenId}
                  onChange={(e) => setNewScreenId(e.target.value)}
                  className="border rounded px-2 py-1 text-sm w-20 text-center"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={!newScreenId || screens.some(s => s.id === newScreenId)}
                  onClick={async () => {
                    if (newScreenId && !screens.some(s => s.id === newScreenId)) {
                      try {
                        const generateAccessCode = () => {
                          return Math.random().toString(36).substring(2, 8).toUpperCase();
                        };
                        
                        await apiRequest('/api/qr-screens', {
                          method: 'POST',
                          body: JSON.stringify({
                            screenId: newScreenId,
                            branchId: 2, // Varsayılan şube
                            name: `Ekran ${newScreenId}`,
                            accessCode: generateAccessCode(),
                            active: true
                          }),
                        });
                        
                        // Query'yi yeniden fetch et
                        refetchScreens();
                        
                        toast({
                          title: "Başarılı",
                          description: `Ekran ${newScreenId} eklendi`,
                        });
                        setNewScreenId('');
                      } catch (error) {
                        console.error('Error creating screen:', error);
                        toast({
                          title: "Hata",
                          description: "Ekran oluşturulurken hata oluştu",
                          variant: "destructive",
                        });
                      }
                    }
                  }}
                >
                  Ekle
                </Button>
              </div>
            </div>
          </div>
          
          {/* Temizleme Butonları */}
          <div className="flex space-x-2">
            <Button 
              onClick={clearAllScreens}
              variant="destructive"
              size="sm"
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Tüm QR Ekranlarını Temizle
            </Button>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">QR Ekran Yönetimi</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium text-blue-800 mb-1">Ekran Özellikleri</h5>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• QR kodlar 30 saniyede bir otomatik değişir</li>
                  <li>• QR kod tarandığında anında yeni kod oluşturulur</li>
                  <li>• Her ekran için ayrı URL ve dinamik içerik</li>
                  <li>• Gerçek zamanlı saat ve son güncelleme bilgisi</li>
                  <li>• Tam ekran modunda çalışır (F tuşu)</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-blue-800 mb-1">Düzenleme İşlemleri</h5>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• <Settings className="w-3 h-3 inline mr-1" /> Ekran ID'sini düzenle</li>
                  <li>• <Trash2 className="w-3 h-3 inline mr-1" /> Ekranı sil (en az 1 ekran kalmalı)</li>
                  <li>• <Plus className="w-3 h-3 inline mr-1" /> Yeni ekran ekle</li>
                  <li>• <ExternalLink className="w-3 h-3 inline mr-1" /> Ekranı yeni sekmede aç</li>
                  <li>• URL'yi kopyala ve paylaş</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
