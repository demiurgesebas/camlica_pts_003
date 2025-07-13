import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Check, X, List } from "lucide-react";

interface PendingLeavesProps {
  leaves?: any[];
  isLoading: boolean;
}

export default function PendingLeaves({ leaves, isLoading }: PendingLeavesProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const approveLeaveRequestMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PUT", `/api/leave-requests/${id}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
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
      await apiRequest("PUT", `/api/leave-requests/${id}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Başarılı",
        description: "İzin talebi reddedildi",
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

  const handleApprove = (id: number) => {
    if (confirm("Bu izin talebini onaylamak istediğinizden emin misiniz?")) {
      approveLeaveRequestMutation.mutate(id);
    }
  };

  const handleReject = (id: number) => {
    const reason = prompt("Ret nedeni girin:");
    if (reason && reason.trim()) {
      rejectLeaveRequestMutation.mutate({ id, reason });
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

  return (
    <Card className="card-hover">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800">
            Bekleyen İzin Talepleri
          </CardTitle>
          <Badge variant="destructive" className="text-xs px-2 py-1 font-medium">
            {leaves?.length || 0}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : leaves && leaves.length > 0 ? (
          <div className="space-y-3">
            {leaves.slice(0, 3).map((leave: any) => (
              <div key={leave.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-800">
                    Personel #{leave.personnelId}
                  </p>
                  <span className="text-xs text-gray-500">
                    {new Date(leave.createdAt).toLocaleDateString('tr-TR')}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-2">
                  {getLeaveTypeLabel(leave.leaveType)}
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  {new Date(leave.startDate).toLocaleDateString('tr-TR')} - {new Date(leave.endDate).toLocaleDateString('tr-TR')}
                </p>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleApprove(leave.id)}
                    disabled={approveLeaveRequestMutation.isPending}
                    size="sm"
                    className="flex-1 bg-green-100 text-green-800 hover:bg-green-200 text-xs h-7"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Onayla
                  </Button>
                  <Button
                    onClick={() => handleReject(leave.id)}
                    disabled={rejectLeaveRequestMutation.isPending}
                    size="sm" 
                    variant="outline"
                    className="flex-1 bg-red-100 text-red-800 hover:bg-red-200 text-xs h-7"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Reddet
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">Bekleyen izin talebi yok</p>
          </div>
        )}
        
        <Button variant="outline" className="w-full mt-4">
          <List className="w-4 h-4 mr-2" />
          Tüm İzin Talepleri
        </Button>
      </CardContent>
    </Card>
  );
}
