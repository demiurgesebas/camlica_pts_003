import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { QrCode, RefreshCw, History } from "lucide-react";

export default function QRManagementWidget() {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: activeQrCodes } = useQuery({
    queryKey: ["/api/qr-codes/active"],
    refetchInterval: 1000,
  });

  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const createQrCodeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/qr-codes", { method: 'POST', body: JSON.stringify({ branchId: 1, expiryMinutes: 1 }) });
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

  const getActiveQrCode = () => {
    if (!activeQrCodes || activeQrCodes.length === 0) return null;
    
    const now = new Date();
    return activeQrCodes.find((code: any) => 
      code.isActive && new Date(code.expiresAt) > now
    );
  };

  const activeCode = getActiveQrCode();

  useEffect(() => {
    if (activeCode) {
      const now = new Date();
      const expires = new Date(activeCode.expiresAt);
      const remaining = Math.max(0, Math.floor((expires.getTime() - now.getTime()) / 1000));
      setTimeRemaining(remaining);
    }
  }, [activeCode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="card-hover">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800">
            QR Kod Yönetimi
          </CardTitle>
          <QrCode className="text-primary text-xl" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <div className="w-24 h-24 bg-white border-2 border-gray-200 rounded-lg mx-auto mb-3 flex items-center justify-center">
            {activeCode ? (
              <div className="text-xs font-mono break-all p-2">
                {activeCode.code}
              </div>
            ) : (
              <QrCode className="text-3xl text-gray-400" />
            )}
          </div>
          <p className="text-sm text-gray-600 mb-3">
            {activeCode ? "Aktif QR Kod" : "QR Kod Yok"}
          </p>
          {activeCode && (
            <p className="text-xs text-gray-500">
              Süre: <span className={`font-medium ${timeRemaining < 30 ? 'text-red-600' : 'text-green-600'}`}>
                {formatTime(timeRemaining)}
              </span>
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Button
            onClick={() => createQrCodeMutation.mutate()}
            disabled={createQrCodeMutation.isPending}
            className="w-full bg-primary text-white hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Yeni QR Kod Oluştur
          </Button>
          <Button variant="outline" className="w-full">
            <History className="w-4 h-4 mr-2" />
            QR Kod Geçmişi
          </Button>
        </div>
        
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs font-medium text-blue-800 mb-1">Bugün</p>
          <p className="text-sm text-blue-700">
            <span className="font-semibold">{dashboardStats?.todayQrScans || 0}</span> QR kod taraması
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
