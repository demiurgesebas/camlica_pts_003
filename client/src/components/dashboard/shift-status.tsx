import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Edit } from "lucide-react";

interface ShiftStatusProps {
  assignments?: any[];
  isLoading: boolean;
}

export default function ShiftStatus({ assignments, isLoading }: ShiftStatusProps) {
  // Mock shift data for display since we need to join with shifts table
  const mockShifts = [
    {
      id: 1,
      name: "Sabah Vardiyası",
      time: "08:00 - 16:00",
      personnel: "15/18",
      status: "Aktif",
      color: "bg-primary"
    },
    {
      id: 2,
      name: "Akşam Vardiyası", 
      time: "16:00 - 24:00",
      personnel: "12/15",
      status: "Hazırlanıyor",
      color: "bg-accent"
    },
    {
      id: 3,
      name: "Gece Vardiyası",
      time: "00:00 - 08:00", 
      personnel: "8/10",
      status: "Bekleniyor",
      color: "bg-gray-400"
    }
  ];

  const getStatusVariant = (status: string) => {
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
    <Card className="card-hover">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800">
            Günlük Vardiya Durumu
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-primary hover:text-blue-700">
            <ExternalLink className="w-4 h-4 mr-1" />
            Detaylı Görünüm
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vardiya</TableHead>
                  <TableHead>Saat</TableHead>
                  <TableHead>Personel</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockShifts.map((shift) => (
                  <TableRow key={shift.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center">
                        <div className={`w-3 h-3 ${shift.color} rounded-full mr-3`}></div>
                        <span className="font-medium text-gray-800">{shift.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{shift.time}</TableCell>
                    <TableCell className="text-sm text-gray-600">{shift.personnel}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(shift.status)}>
                        {shift.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-primary hover:text-blue-700">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
