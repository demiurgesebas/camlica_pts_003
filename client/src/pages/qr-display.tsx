import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, QrCode, Lock, Shield } from "lucide-react";

interface QRDisplayProps {
  screenId?: string;
}

export default function QRDisplay({ screenId }: QRDisplayProps) {
  const params = useParams();
  const currentScreenId = screenId || params.screenId || '1';
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAccessCodeRequired, setIsAccessCodeRequired] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [isDeviceAuthorized, setIsDeviceAuthorized] = useState(false);
  
  // Ekran aktif durumunu kontrol et
  const isScreenActive = () => {
    const savedScreens = localStorage.getItem('qr-screens');
    if (savedScreens) {
      const screens = JSON.parse(savedScreens);
      // Eski format kontrolü (string[])
      if (Array.isArray(screens) && screens.length > 0) {
        if (typeof screens[0] === 'string') {
          return screens.includes(currentScreenId);
        }
        // Yeni format kontrolü ({id: string, active: boolean}[])
        const screen = screens.find((s: any) => s.id === currentScreenId);
        return screen ? screen.active : false;
      }
    }
    
    // Ekran yoksa varsayılan olarak aktif kabul et
    return true;
  };

  // Cihaz ID'si oluştur veya mevcut olanı al (localStorage ile kararlı)
  const generateDeviceId = () => {
    const storageKey = 'qr-device-id';
    let deviceId = localStorage.getItem(storageKey);
    
    if (!deviceId) {
      const userAgent = navigator.userAgent;
      const screenResolution = `${screen.width}x${screen.height}`;
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const deviceData = `${userAgent}-${screenResolution}-${timezone}`;
      deviceId = btoa(deviceData).substring(0, 12);
      localStorage.setItem(storageKey, deviceId);
    }
    
    return deviceId;
  };

  // Erişim kodu oluştur
  const generateAccessCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };



  // Erişim kodu doğrulama
  const validateAccessCode = async () => {
    try {
      console.log('=== ACCESS CODE VALIDATION START ===');
      console.log('Current screen ID:', currentScreenId);
      console.log('Access code entered:', accessCode);
      
      // Backend'den ekran bilgisini al
      const response = await fetch(`/api/qr-screens/${currentScreenId}`);
      if (!response.ok) {
        console.error('Screen not found - Response:', response.status);
        return false;
      }
      
      const screenData = await response.json();
      console.log('Screen data from backend:', screenData);
      console.log('Expected access code:', screenData.accessCode);
      console.log('Entered access code:', accessCode.trim().toUpperCase());
      
      if (screenData.accessCode === accessCode.trim().toUpperCase()) {
        console.log('✓ Access code validation SUCCESS');
        const deviceId = generateDeviceId();
        
        // Backend'e cihaz bağlantısını kaydet
        try {
          console.log('Sending PUT request to backend with deviceId:', deviceId);
          const response = await fetch(`/api/qr-screens/${currentScreenId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              deviceId: deviceId
            })
          });
          
          console.log('Backend response status:', response.status);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Backend error response:', errorText);
            throw new Error(`Failed to update device connection: ${response.status} ${errorText}`);
          }
          
          const result = await response.json();
          console.log('Device connection saved to backend successfully:', result);
        } catch (error) {
          console.error('Failed to update device ID in backend:', error);
        }
        
        // Bu cihazın bu ekran için yetkilendirildiğini kaydet
        const deviceAuthKey = `qr-screen-auth-${currentScreenId}`;
        localStorage.setItem(deviceAuthKey, JSON.stringify({
          screenId: currentScreenId,
          deviceId,
          authorizedAt: new Date().toISOString()
        }));
        
        setIsDeviceAuthorized(true);
        setIsAccessCodeRequired(false);
        setAccessCode('');
        
        console.log('Device authorized successfully');
        console.log('Device ID:', deviceId);
        
        return true;
      } else {
        console.error('✗ Access code validation FAILED');
        console.error('Expected:', screenData?.accessCode);
        console.error('Got:', accessCode.trim().toUpperCase());
        setAccessCode(''); // Hatalı kodu temizle
        return false;
      }
    } catch (error) {
      console.error('Error validating access code:', error);
      return false;
    }
  };

  


  // Sayfa yüklendiğinde cihaz doğrulamasını kontrol et
  useEffect(() => {
    console.log('QR Display loading for screen:', currentScreenId);
    
    const checkScreenAuth = async () => {
      // Bu cihazda daha önce bağlı ekran var mı kontrol et
      const deviceAuthKey = `qr-screen-auth-${currentScreenId}`;
      const savedDeviceAuth = localStorage.getItem(deviceAuthKey);
      
      if (savedDeviceAuth) {
        try {
          const authData = JSON.parse(savedDeviceAuth);
          console.log('Checking saved auth data:', authData);
          
          // Backend'den ekran durumunu kontrol et
          const response = await fetch(`/api/qr-screens/${currentScreenId}`);
          
          if (response.ok) {
            const screenData = await response.json();
            console.log('Screen data from backend:', screenData);
            
            // Ekran aktif ve önceki auth geçerliyse
            if (screenData.active) {
              setIsDeviceAuthorized(true);
              setIsAccessCodeRequired(false);
              console.log('Device previously authorized for this screen');
              return;
            } else {
              console.log('Screen not active, requesting new auth');
            }
          } else {
            console.error('Failed to fetch screen data:', response.status);
          }
        } catch (error) {
          console.error('Error checking screen auth:', error);
        }
      }
      
      // Auth yoksa veya geçersizse, erişim kodu iste
      setIsAccessCodeRequired(true);
      setIsDeviceAuthorized(false);
      console.log('Device not authorized, access code required');
    };
    
    checkScreenAuth();
  }, [currentScreenId]);

  // QR kod verilerini çek
  const { data: qrData, isLoading, error, refetch } = useQuery<{
    code: string;
    expiresAt: string;
    lastUpdated: string;
    branchName?: string;
    screenId?: string;
  }>({
    queryKey: [`/api/qr-codes/screen/${currentScreenId}`],
    refetchInterval: 2000, // Her 2 saniye kontrol et
    retry: 3,
    enabled: isDeviceAuthorized && isScreenActive(), // Cihaz yetkilendirilmişse ve ekran aktifse çalış
  });

  // QR kod verisini debug et
  useEffect(() => {
    if (qrData) {
      console.log('QR DATA RECEIVED:', qrData);
      console.log('QR CODE:', qrData.code);
    }
  }, [qrData]);

  // Auth durumu değişimlerini kontrol et
  useEffect(() => {
    const checkAuthStatus = async () => {
      // Local storage kontrolü
      const deviceAuthKey = `qr-screen-auth-${currentScreenId}`;
      const authStatus = localStorage.getItem(deviceAuthKey);
      
      if (!authStatus && isDeviceAuthorized) {
        // Auth silinmişse cihazı yeniden giriş yap
        setIsDeviceAuthorized(false);
        setIsAccessCodeRequired(true);
        console.log('Auth removed, requiring access code again');
        return;
      }
      
      // Backend'den cihaz bağlantısı kontrolü (5 saniye gecikme ile)
      if (isDeviceAuthorized) {
        try {
          const response = await fetch(`/api/qr-screens/${currentScreenId}`);
          if (response.ok) {
            const screenData = await response.json();
            const currentDeviceId = generateDeviceId();
            
            console.log('Device ID check - Current:', currentDeviceId, 'Backend:', screenData.deviceId);
            
            // Backend'de kayıtlı cihaz ID'si farklıysa (başka cihazdan bağlantı kesildi)
            if (screenData.deviceId && screenData.deviceId !== currentDeviceId) {
              console.log('Device ID mismatch detected, logging out');
              setIsDeviceAuthorized(false);
              setIsAccessCodeRequired(true);
              // Local storage'dan da temizle
              localStorage.removeItem(deviceAuthKey);
            }
          }
        } catch (error) {
          console.error('Error checking backend auth status:', error);
        }
      }
    };

    // İlk kontrol 5 saniye sonra, sonrasında her 5 saniyede bir
    const timeoutId = setTimeout(() => {
      checkAuthStatus();
      const interval = setInterval(checkAuthStatus, 5000);
      return () => clearInterval(interval);
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [currentScreenId, isDeviceAuthorized]);

  // Canlı saat güncellemesi
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // QR kod değiştiğinde yeni kodu çek
  useEffect(() => {
    if (qrData?.lastUpdated) {
      const checkInterval = setInterval(() => {
        refetch();
      }, 30000); // 30 saniye

      return () => clearInterval(checkInterval);
    }
  }, [qrData, refetch]);

  // Tam ekran modunu kontrol et
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'F11' || e.key === 'Escape') {
        e.preventDefault();
      }
      if (e.key === 'f' || e.key === 'F') {
        document.documentElement.requestFullscreen?.();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">QR Kod Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if ((error || !qrData) && !isAccessCodeRequired && isDeviceAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 to-red-700 flex items-center justify-center">
        <div className="text-center text-white">
          <WifiOff className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Bağlantı Hatası</h1>
          <p className="text-lg">QR kod sistemine bağlanılamıyor</p>
          <p className="text-sm mt-2">Ekran ID: {currentScreenId}</p>
          <div className="mt-4 text-xs bg-red-800/50 px-4 py-2 rounded">
            {error?.message || 'Bilinmeyen hata'}
          </div>
          <Button 
            onClick={() => refetch()}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white"
          >
            Yeniden Dene
          </Button>
        </div>
      </div>
    );
  }



  // Erişim kodu gerekiyorsa giriş ekranını göster
  if (isAccessCodeRequired && !isDeviceAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-20 h-20 mx-auto mb-6 text-blue-400" />
          <h1 className="text-3xl font-bold mb-4 text-blue-100">Cihaz Doğrulama</h1>
          <p className="text-lg text-blue-200 mb-6">Bu ekranı kullanmak için erişim kodu gerekli</p>
          
          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700 max-w-md mx-auto">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="text-sm text-blue-300 bg-blue-900/30 px-4 py-2 rounded-lg">
                  Ekran: {currentScreenId}
                </div>
                
                <input
                  type="text"
                  placeholder="Erişim kodu girin"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-400 focus:outline-none text-center font-mono uppercase"
                  maxLength={8}
                  autoFocus
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' && accessCode.trim()) {
                      console.log('Enter pressed - validating access code');
                      const isValid = await validateAccessCode();
                      console.log('Validation result:', isValid);
                      if (!isValid) {
                        setAccessCode('');
                        // Hatalı kod animasyonu için kırmızı efekt eklenebilir
                      }
                    }
                  }}
                />
                
                <Button 
                  onClick={async () => {
                    console.log('Button clicked - validating access code');
                    const isValid = await validateAccessCode();
                    console.log('Validation result:', isValid);
                    if (!isValid) {
                      setAccessCode('');
                    }
                  }}
                  disabled={!accessCode.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Doğrula
                </Button>
                
                <p className="text-xs text-slate-400 mt-4">
                  Erişim kodunu QR yönetim panelinden alabilirsiniz
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Ekran pasifse farklı içerik göster
  if (!isScreenActive()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <QrCode className="w-20 h-20 mx-auto mb-6 text-orange-400 opacity-50" />
          <h1 className="text-3xl font-bold mb-4 text-orange-100">Ekran Pasif</h1>
          <p className="text-lg text-orange-200 mb-2">Bu ekran şu anda pasif durumda</p>
          <p className="text-sm text-orange-300">QR kod sistemi devre dışı</p>
          <div className="mt-6 text-sm text-orange-400 bg-orange-900/30 px-4 py-2 rounded-lg inline-block">
            {currentScreenId}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 text-white">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-center p-3 sm:p-6 bg-slate-800/40 backdrop-blur-sm border-b border-slate-700/50 gap-3 sm:gap-0">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <Wifi className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-400" />
            <span className="text-sm sm:text-lg font-medium text-slate-100">{currentScreenId}</span>
          </div>
          <Badge variant="outline" className="text-indigo-200 border-indigo-400/50 bg-indigo-500/20 text-xs sm:text-sm">
            {qrData?.branchName || 'Ana Şube'}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-3 sm:space-x-6">
          <div className="flex items-center space-x-2">
            <QrCode className="w-4 h-4 sm:w-6 sm:h-6 text-indigo-400" />
            <span className="text-xs sm:text-sm text-slate-300">QR Sistemi</span>
          </div>
        </div>
      </div>

      {/* Main QR Display - Responsive */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <Card className="bg-slate-800/50 backdrop-blur-lg border-slate-600/30 shadow-2xl w-full max-w-sm sm:max-w-lg lg:max-w-xl">
          <CardContent className="p-6 sm:p-8 lg:p-12 text-center">
            {/* QR Code - Responsive Size */}
            <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-2xl shadow-2xl mb-6 sm:mb-8 inline-block ring-4 ring-indigo-400/20">
              <div 
                className="w-48 h-48 sm:w-60 sm:h-60 lg:w-80 lg:h-80 bg-white flex items-center justify-center text-black font-mono text-xs border-4 border-slate-200 rounded"
                style={{
                  backgroundImage: qrData?.code ? `url(https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(qrData.code)})` : undefined,
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center'
                }}
              >
                {!qrData?.code && (
                  <div className="text-center">
                    <div className="text-sm sm:text-lg mb-2">QR Kod</div>
                    <div className="text-xs sm:text-sm text-gray-600">{qrData?.code}</div>
                  </div>
                )}
              </div>
            </div>

            {/* QR Info - Responsive */}
            <div className="space-y-4 sm:space-y-6">
              <div className="text-center">
                <p className="text-xs sm:text-sm text-slate-300">
                  Kameranızı QR koda doğrultun ve yoklamanızı verin
                </p>
                <p className="text-xs sm:text-sm text-indigo-300 mt-2 font-medium">
                  {currentTime.toLocaleDateString('tr-TR')} {currentTime.toLocaleTimeString('tr-TR')}
                </p>
              </div>
              
              {/* QR Kod Bilgileri - Responsive */}
              <div className="space-y-3 sm:space-y-4 text-center">
                <div className="text-sm sm:text-base lg:text-lg text-slate-200">
                  Kod: <span className="font-mono font-bold text-emerald-300 text-xs sm:text-sm lg:text-base bg-slate-700/30 px-2 py-1 rounded">{qrData?.code || 'Yükleniyor...'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer - Responsive */}
      <div className="p-3 sm:p-4 bg-slate-800/40 backdrop-blur-sm border-t border-slate-700/50 flex flex-col sm:flex-row justify-between items-center text-xs sm:text-sm text-slate-400 gap-2 sm:gap-0">
        <div className="text-center sm:text-left">
          <p className="text-slate-300">Çamlıca Personel Takip Sistemi • {qrData?.branchName || 'Ana Şube'}</p>
        </div>
        <div className="text-center sm:text-right">
          <div className="text-sm sm:text-base lg:text-lg font-bold text-white bg-indigo-600 px-2 py-1 sm:px-3 sm:py-1 rounded shadow-lg">
{currentScreenId}
          </div>
        </div>
      </div>
    </div>
  );
}

// Standalone QR Display sayfası
export function QRDisplayPage() {
  return <QRDisplay />;
}