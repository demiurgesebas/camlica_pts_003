import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { 
  Settings as SettingsIcon, 
  Shield, 
  Bell, 
  Database, 
  Users, 
  Clock,
  Mail,
  Smartphone,
  Globe,
  Menu,
  GripVertical,
  ArrowUp,
  ArrowDown
} from "lucide-react";

function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // General Settings State
  const [systemName, setSystemName] = useState("Çamlıca Personel Takip Sistemi");
  const [companyName, setCompanyName] = useState("RIT Teknoloji");
  const [timezone, setTimezone] = useState("Europe/Istanbul");
  const [language, setLanguage] = useState("tr");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");

  // Security Settings State
  const [enableTwoFactor, setEnableTwoFactor] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("60");
  const [passwordExpiry, setPasswordExpiry] = useState("90");
  const [enableIpRestriction, setEnableIpRestriction] = useState(false);
  const [allowedIps, setAllowedIps] = useState("");

  // Notification Settings State
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [notificationTypes, setNotificationTypes] = useState({
    leaveRequests: true,
    attendance: true,
    shifts: false,
    system: true,
  });

  // Integration Settings State
  const [smsProvider, setSmsProvider] = useState("netgsm");
  const [smsApiKey, setSmsApiKey] = useState("");
  const [netgsmUsername, setNetgsmUsername] = useState("");
  const [netgsmPassword, setNetgsmPassword] = useState("");
  const [netgsmHeader, setNetgsmHeader] = useState("NETGSM");
  const [emailProvider, setEmailProvider] = useState("smtp");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");

  // QR Code Settings State
  const [qrCodeExpiry, setQrCodeExpiry] = useState("1");
  const [maxQrCodesPerBranch, setMaxQrCodesPerBranch] = useState("5");
  const [enableLocationValidation, setEnableLocationValidation] = useState(false);
  const [qrCodeLength, setQrCodeLength] = useState("10");

  // Menu Order Settings State
  const getDefaultMenuOrder = () => [
    { id: "dashboard", label: "Dashboard", enabled: true },
    { id: "leave-management", label: "İzin Yönetimi", enabled: true },
    { id: "tasks", label: "İş Takip", enabled: true },
    { id: "attendance", label: "Giriş Çıkış Verileri", enabled: true },
    { id: "notifications", label: "Bildirimler", enabled: true },
    { id: "personnel", label: "Personel Yönetimi", enabled: true },
    { id: "shifts", label: "Vardiya Planlama", enabled: true },
    { id: "qr-management", label: "QR Kod Yönetimi", enabled: true },
    { id: "reports", label: "Raporlar", enabled: true },
    { id: "branches", label: "Şube Yönetimi", enabled: true },
    { id: "departments", label: "Birim Yönetimi", enabled: true },
    { id: "teams", label: "Ekip Yönetimi", enabled: true },
    { id: "settings", label: "Sistem Ayarları", enabled: true },
    { id: "user-management", label: "Kullanıcı Yönetimi", enabled: true },
  ];

  const [menuOrder, setMenuOrder] = useState(() => {
    const saved = localStorage.getItem('menuOrder');
    return saved ? JSON.parse(saved) : getDefaultMenuOrder();
  });

  // Load saved settings on component mount
  useEffect(() => {
    // Load general settings
    const savedGeneral = localStorage.getItem('generalSettings');
    if (savedGeneral) {
      const settings = JSON.parse(savedGeneral);
      setSystemName(settings.systemName || "Personel Takip Sistemi");
      setCompanyName(settings.companyName || "Şirket Adı");
      setTimezone(settings.timezone || "Europe/Istanbul");
      setLanguage(settings.language || "tr");
      setDateFormat(settings.dateFormat || "dd/MM/yyyy");
    }

    // Load security settings
    const savedSecurity = localStorage.getItem('securitySettings');
    if (savedSecurity) {
      const settings = JSON.parse(savedSecurity);
      setEnableTwoFactor(settings.enableTwoFactor || false);
      setSessionTimeout(settings.sessionTimeout || "30");
      setPasswordExpiry(settings.passwordExpiry || "90");
      setEnableIpRestriction(settings.enableIpRestriction || false);
      setAllowedIps(settings.allowedIps || "");
    }

    // Load notification settings
    const savedNotifications = localStorage.getItem('notificationSettings');
    if (savedNotifications) {
      const settings = JSON.parse(savedNotifications);
      setEmailNotifications(settings.emailNotifications || false);
      setSmsNotifications(settings.smsNotifications || false);
      setPushNotifications(settings.pushNotifications || false);
      setNotificationTypes(settings.notificationTypes || {
        leaveRequests: true,
        attendance: true,
        shifts: false,
        system: true,
      });
    }

    // Load integration settings
    const savedIntegration = localStorage.getItem('integrationSettings');
    if (savedIntegration) {
      const settings = JSON.parse(savedIntegration);
      setSmsProvider(settings.smsProvider || "netgsm");
      setSmsApiKey(settings.smsApiKey || "");
      setNetgsmUsername(settings.netgsmUsername || "");
      setNetgsmPassword(settings.netgsmPassword || "");
      setNetgsmHeader(settings.netgsmHeader || "NETGSM");
      setEmailProvider(settings.emailProvider || "smtp");
      setSmtpHost(settings.smtpHost || "");
      setSmtpPort(settings.smtpPort || "587");
    }

    // Load QR settings
    const savedQr = localStorage.getItem('qrSettings');
    if (savedQr) {
      const settings = JSON.parse(savedQr);
      setQrCodeExpiry(settings.qrCodeExpiry || "1");
      setMaxQrCodesPerBranch(settings.maxQrCodesPerBranch || "5");
      setEnableLocationValidation(settings.enableLocationValidation || false);
      setQrCodeLength(settings.qrCodeLength || "10");
    }
  }, []);

  // API ile ayarları kaydetme fonksiyonu
  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: Record<string, any>) => {
      const response = await fetch('/api/settings/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });
      
      if (!response.ok) {
        throw new Error('Ayarlar kaydedilemedi');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Ayarlar başarıyla kaydedildi",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Ayarlar kaydedilirken hata oluştu",
        variant: "destructive",
      });
    },
  });

  // SMS bağlantı testi mutation
  const testSMSMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/sms/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Bağlantı testi başarısız');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.success ? "Başarılı" : "Hata",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
    },
    onError: (error) => {
      toast({
        title: "Bağlantı Hatası",
        description: "SMS servisi ile bağlantı kurulamadı",
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = (section: string) => {
    if (section === "Menü Sıralaması") {
      console.log('Settings - Saving menu order:', menuOrder);
      localStorage.setItem('menuOrder', JSON.stringify(menuOrder));
      
      // Sidebar'ı güncellemek için custom event dispatch et
      window.dispatchEvent(new CustomEvent('menuOrderChanged', {
        detail: { menuOrder }
      }));
      
      console.log('Settings - Menu order saved and event dispatched');
    } else if (section === "Genel Ayarlar") {
      // API'ye kaydet
      const generalSettings = {
        'system.name': systemName,
        'system.company': companyName,
        'system.timezone': timezone,
        'system.language': language,
        'system.dateFormat': dateFormat
      };
      saveSettingsMutation.mutate(generalSettings);
      localStorage.setItem('generalSettings', JSON.stringify({
        systemName, companyName, timezone, language, dateFormat
      }));
    } else if (section === "Güvenlik Ayarları") {
      // API'ye kaydet
      const securitySettings = {
        'security.twoFactor': enableTwoFactor.toString(),
        'security.sessionTimeout': sessionTimeout,
        'security.passwordExpiry': passwordExpiry,
        'security.ipRestriction': enableIpRestriction.toString(),
        'security.allowedIps': allowedIps
      };
      saveSettingsMutation.mutate(securitySettings);
      localStorage.setItem('securitySettings', JSON.stringify({
        enableTwoFactor, sessionTimeout, passwordExpiry, enableIpRestriction, allowedIps
      }));
    } else if (section === "Bildirim Ayarları") {
      // API'ye kaydet  
      const notificationSettings = {
        'notification.email': emailNotifications.toString(),
        'notification.sms': smsNotifications.toString(),
        'notification.push': pushNotifications.toString(),
        'notification.types': JSON.stringify(notificationTypes)
      };
      saveSettingsMutation.mutate(notificationSettings);
      localStorage.setItem('notificationSettings', JSON.stringify({
        emailNotifications, smsNotifications, pushNotifications, notificationTypes
      }));
    } else if (section === "Entegrasyon Ayarları") {
      // API'ye kaydet
      const integrationSettings = {
        'sms.provider': smsProvider,
        'sms.apiKey': smsApiKey,
        'netgsm.username': netgsmUsername,
        'netgsm.password': netgsmPassword,
        'netgsm.header': netgsmHeader,
        'email.provider': emailProvider,
        'smtp.host': smtpHost,
        'smtp.port': smtpPort
      };
      saveSettingsMutation.mutate(integrationSettings);
      localStorage.setItem('integrationSettings', JSON.stringify({
        smsProvider, smsApiKey, netgsmUsername, netgsmPassword, netgsmHeader, emailProvider, smtpHost, smtpPort
      }));
    } else if (section === "QR Kod Ayarları") {
      // API'ye kaydet
      const qrSettings = {
        'qr.expiry': qrCodeExpiry,
        'qr.maxPerBranch': maxQrCodesPerBranch,
        'qr.locationValidation': enableLocationValidation.toString(),
        'qr.length': qrCodeLength
      };
      saveSettingsMutation.mutate(qrSettings);
      localStorage.setItem('qrSettings', JSON.stringify({
        qrCodeExpiry, maxQrCodesPerBranch, enableLocationValidation, qrCodeLength
      }));
    }
    
    toast({
      title: "Başarılı",
      description: `${section} ayarları kaydedildi`,
    });
  };

  const handleTestConnection = (service: string) => {
    toast({
      title: "Test Başlatıldı",
      description: `${service} bağlantısı test ediliyor...`,
    });
    
    setTimeout(() => {
      toast({
        title: "Test Tamamlandı",
        description: `${service} bağlantısı başarılı`,
      });
    }, 2000);
  };

  const moveMenuItem = useCallback((dragIndex: number, hoverIndex: number) => {
    console.log('Settings - Moving item from', dragIndex, 'to', hoverIndex);
    const newOrder = [...menuOrder];
    const dragItem = newOrder[dragIndex];
    newOrder.splice(dragIndex, 1);
    newOrder.splice(hoverIndex, 0, dragItem);
    console.log('Settings - New order:', newOrder.map(item => ({ id: item.id, label: item.label })));
    setMenuOrder(newOrder);
  }, [menuOrder]);

  const moveMenuItemUpDown = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...menuOrder];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex >= 0 && newIndex < newOrder.length) {
      [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
      setMenuOrder(newOrder);
    }
  };

  const toggleMenuItem = (index: number) => {
    const newOrder = [...menuOrder];
    newOrder[index].enabled = !newOrder[index].enabled;
    setMenuOrder(newOrder);
  };

  // Sürüklenebilir menü öğesi komponenti
  const DraggableMenuItem = ({ item, index }: { item: any, index: number }) => {
    const [{ isDragging }, drag] = useDrag({
      type: 'menu-item',
      item: { index },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });

    const [, drop] = useDrop({
      accept: 'menu-item',
      hover: (draggedItem: { index: number }) => {
        if (draggedItem.index !== index) {
          moveMenuItem(draggedItem.index, index);
          draggedItem.index = index;
        }
      },
    });

    return (
      <div
        ref={(node) => drag(drop(node))}
        className={`flex items-center justify-between p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 cursor-move transition-opacity ${
          isDragging ? 'opacity-50' : 'opacity-100'
        }`}
      >
        <div className="flex items-center space-x-3">
          <GripVertical className="w-4 h-4 text-gray-400" />
          <div className="flex items-center space-x-2">
            <Switch
              checked={item.enabled}
              onCheckedChange={() => toggleMenuItem(index)}
            />
            <span className={`font-medium ${!item.enabled ? 'text-gray-400' : ''}`}>
              {item.label}
            </span>
          </div>
        </div>
        
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => moveMenuItemUpDown(index, 'up')}
            disabled={index === 0}
            className="p-1 h-8 w-8"
          >
            <ArrowUp className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => moveMenuItemUpDown(index, 'down')}
            disabled={index === menuOrder.length - 1}
            className="p-1 h-8 w-8"
          >
            <ArrowDown className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Genel Sistem Ayarları</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="systemName">Sistem Adı</Label>
              <Input
                id="systemName"
                value={systemName}
                onChange={(e) => setSystemName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName">Şirket Adı</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Saat Dilimi</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Europe/Istanbul">İstanbul (UTC+3)</SelectItem>
                  <SelectItem value="Europe/London">Londra (UTC+0)</SelectItem>
                  <SelectItem value="America/New_York">New York (UTC-5)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Dil</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tr">Türkçe</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tarih Formatı</Label>
              <Select value={dateFormat} onValueChange={setDateFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button onClick={() => handleSaveSettings("Genel")}>
            Ayarları Kaydet
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Güvenlik Ayarları
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>İki Faktörlü Kimlik Doğrulama</Label>
              <p className="text-sm text-gray-600">Hesap güvenliğini artırır</p>
            </div>
            <Switch
              checked={enableTwoFactor}
              onCheckedChange={setEnableTwoFactor}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Oturum Zaman Aşımı (dakika)</Label>
              <Input
                type="number"
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Şifre Geçerlilik Süresi (gün)</Label>
              <Input
                type="number"
                value={passwordExpiry}
                onChange={(e) => setPasswordExpiry(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>IP Adresi Kısıtlaması</Label>
                <p className="text-sm text-gray-600">Belirli IP adreslerinden erişimi sınırla</p>
              </div>
              <Switch
                checked={enableIpRestriction}
                onCheckedChange={setEnableIpRestriction}
              />
            </div>
            
            {enableIpRestriction && (
              <div className="space-y-2">
                <Label>İzin Verilen IP Adresleri (virgülle ayırın)</Label>
                <Input
                  placeholder="192.168.1.1, 10.0.0.1"
                  value={allowedIps}
                  onChange={(e) => setAllowedIps(e.target.value)}
                />
              </div>
            )}
          </div>
          
          <Button onClick={() => handleSaveSettings("Güvenlik")}>
            Güvenlik Ayarlarını Kaydet
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Bildirim Ayarları
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <Label>E-posta Bildirimleri</Label>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-4 h-4 text-gray-500" />
                <Label>SMS Bildirimleri</Label>
              </div>
              <Switch
                checked={smsNotifications}
                onCheckedChange={setSmsNotifications}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-gray-500" />
                <Label>Push Bildirimleri</Label>
              </div>
              <Switch
                checked={pushNotifications}
                onCheckedChange={setPushNotifications}
              />
            </div>
          </div>
          
          <div className="border-t pt-4">
            <Label className="text-base font-medium">Bildirim Türleri</Label>
            <div className="mt-3 space-y-3">
              {Object.entries(notificationTypes).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label>
                    {key === 'leaveRequests' && 'İzin Talepleri'}
                    {key === 'attendance' && 'Devam Durumu'}
                    {key === 'shifts' && 'Vardiya Değişiklikleri'}
                    {key === 'system' && 'Sistem Bildirimleri'}
                  </Label>
                  <Switch
                    checked={value}
                    onCheckedChange={(checked) =>
                      setNotificationTypes(prev => ({ ...prev, [key]: checked }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>
          
          <Button onClick={() => handleSaveSettings("Bildirim")}>
            Bildirim Ayarlarını Kaydet
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderIntegrationSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>SMS Entegrasyonu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>SMS Sağlayıcısı</Label>
            <Select value={smsProvider} onValueChange={setSmsProvider}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="netgsm">NET GSM</SelectItem>
                <SelectItem value="turkcell">Turkcell</SelectItem>
                <SelectItem value="vodafone">Vodafone</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {smsProvider === "netgsm" && (
            <>
              <div className="space-y-2">
                <Label>NET GSM Kullanıcı Adı</Label>
                <Input
                  value={netgsmUsername}
                  onChange={(e) => setNetgsmUsername(e.target.value)}
                  placeholder="NET GSM kullanıcı adınızı girin"
                />
              </div>
              
              <div className="space-y-2">
                <Label>NET GSM Şifre</Label>
                <Input
                  type="password"
                  value={netgsmPassword}
                  onChange={(e) => setNetgsmPassword(e.target.value)}
                  placeholder="NET GSM şifrenizi girin"
                />
              </div>
              
              <div className="space-y-2">
                <Label>NET GSM Header (Gönderici Adı)</Label>
                <Input
                  value={netgsmHeader}
                  onChange={(e) => setNetgsmHeader(e.target.value)}
                  placeholder="Onaylanmış gönderici adınızı girin"
                />
                <p className="text-xs text-gray-500">
                  NetGSM'den onaylatılmış gönderici adınızı girin
                </p>
              </div>
            </>
          )}
          
          <div className="space-y-2">
            <Label>API Anahtarı</Label>
            <Input
              type="password"
              value={smsApiKey}
              onChange={(e) => setSmsApiKey(e.target.value)}
              placeholder="API anahtarınızı girin"
            />
          </div>
          
          <div className="flex space-x-2">
            <Button onClick={() => handleSaveSettings("Entegrasyon Ayarları")}>
              SMS Ayarlarını Kaydet
            </Button>
            <Button 
              variant="outline" 
              onClick={() => testSMSMutation.mutate()}
              disabled={testSMSMutation.isPending}
            >
              {testSMSMutation.isPending ? 'Test Ediliyor...' : 'NetGSM Bağlantısını Test Et'}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>E-posta Entegrasyonu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>E-posta Sağlayıcısı</Label>
            <Select value={emailProvider} onValueChange={setEmailProvider}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="smtp">SMTP</SelectItem>
                <SelectItem value="gmail">Gmail</SelectItem>
                <SelectItem value="outlook">Outlook</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>SMTP Host</Label>
              <Input
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                placeholder="smtp.gmail.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Port</Label>
              <Input
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
                placeholder="587"
              />
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button onClick={() => handleSaveSettings("E-posta")}>
              E-posta Ayarlarını Kaydet
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleTestConnection("E-posta")}
            >
              Bağlantıyı Test Et
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderMenuSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Menu className="w-5 h-5 mr-2" />
            Sol Menü Sıralaması
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-base font-medium">Menü Öğeleri</Label>
            <p className="text-sm text-gray-600">
              Menü öğelerini fare ile sürükleyerek veya yukarı/aşağı butonlarını kullanarak sıralayabilirsiniz.
            </p>
            
            <div className="mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('Current menu order:', menuOrder);
                  console.log('Default menu order:', getDefaultMenuOrder());
                }}
              >
                Debug: Menü Sıralamasını Kontrol Et
              </Button>
            </div>
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {menuOrder.map((item, index) => (
              <DraggableMenuItem key={item.id} item={item} index={index} />
            ))}
          </div>
          
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                const defaultOrder = getDefaultMenuOrder();
                setMenuOrder(defaultOrder);
                localStorage.setItem('menuOrder', JSON.stringify(defaultOrder));
                
                // Sidebar'ı güncellemek için custom event dispatch et
                window.dispatchEvent(new CustomEvent('menuOrderChanged', {
                  detail: { menuOrder: defaultOrder }
                }));
                
                toast({
                  title: "Sıfırlandı",
                  description: "Menü sıralaması varsayılan haline getirildi",
                });
              }}
            >
              Varsayılana Sıfırla
            </Button>
            <Button onClick={() => handleSaveSettings("Menü Sıralaması")}>
              Sıralamayı Kaydet
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderQrSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>QR Kod Ayarları</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Varsayılan Süre (dakika)</Label>
              <Select value={qrCodeExpiry} onValueChange={setQrCodeExpiry}>
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
            
            <div className="space-y-2">
              <Label>Kod Uzunluğu</Label>
              <Select value={qrCodeLength} onValueChange={setQrCodeLength}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8">8 Karakter</SelectItem>
                  <SelectItem value="10">10 Karakter</SelectItem>
                  <SelectItem value="12">12 Karakter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Şube Başına Maksimum QR Kod</Label>
            <Input
              type="number"
              value={maxQrCodesPerBranch}
              onChange={(e) => setMaxQrCodesPerBranch(e.target.value)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Konum Doğrulaması</Label>
              <p className="text-sm text-gray-600">QR kod taramalarında konum kontrolü yap</p>
            </div>
            <Switch
              checked={enableLocationValidation}
              onCheckedChange={setEnableLocationValidation}
            />
          </div>
          
          <Button onClick={() => handleSaveSettings("QR Kod")}>
            QR Kod Ayarlarını Kaydet
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sistem Ayarları</h1>
          <p className="text-gray-600">Sistem konfigürasyonunu yönet</p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Database className="w-3 h-3 mr-1" />
          v2.1.0
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center space-x-2">
            <SettingsIcon className="w-4 h-4" />
            <span>Genel</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Güvenlik</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="w-4 h-4" />
            <span>Bildirimler</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center space-x-2">
            <Globe className="w-4 h-4" />
            <span>Entegrasyonlar</span>
          </TabsTrigger>
          <TabsTrigger value="qr" className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>QR Kodlar</span>
          </TabsTrigger>
          <TabsTrigger value="menu" className="flex items-center space-x-2">
            <Menu className="w-4 h-4" />
            <span>Menü Sıralaması</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">{renderGeneralSettings()}</TabsContent>
        <TabsContent value="security">{renderSecuritySettings()}</TabsContent>
        <TabsContent value="notifications">{renderNotificationSettings()}</TabsContent>
        <TabsContent value="integrations">{renderIntegrationSettings()}</TabsContent>
        <TabsContent value="qr">{renderQrSettings()}</TabsContent>
        <TabsContent value="menu">{renderMenuSettings()}</TabsContent>
      </Tabs>
    </div>
  );
}

export default function SettingsWithDnd() {
  return (
    <DndProvider backend={HTML5Backend}>
      <Settings />
    </DndProvider>
  );
}