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
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTeamSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Edit, Trash2, Crown, User, UserPlus, UserMinus, Search, X } from "lucide-react";
import { z } from "zod";

const teamFormSchema = insertTeamSchema.extend({
  branchId: z.union([z.string(), z.number()]).optional(),
  leaderId: z.union([z.string(), z.number()]).optional(),
});

export default function Teams() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<any>(null);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [teamPersonnelDialogOpen, setTeamPersonnelDialogOpen] = useState(false);
  const [personnelSearchTerm, setPersonnelSearchTerm] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof teamFormSchema>>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: "",
      description: undefined,
      branchId: undefined,
      leaderId: undefined,
      isActive: true,
    },
  });

  const { data: teams, isLoading } = useQuery({
    queryKey: ["/api/teams"],
  });

  const { data: branches } = useQuery({
    queryKey: ["/api/branches"],
  });

  const { data: personnel } = useQuery({
    queryKey: ["/api/personnel"],
  });

  const createTeamMutation = useMutation({
    mutationFn: async (data: z.infer<typeof teamFormSchema>) => {
      await apiRequest("/api/teams", { method: 'POST', body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({
        title: "Başarılı",
        description: "Ekip başarıyla oluşturuldu",
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

  const updateTeamMutation = useMutation({
    mutationFn: async (data: z.infer<typeof teamFormSchema>) => {
      await apiRequest("PUT", `/api/teams/${editingTeam.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({
        title: "Başarılı",
        description: "Ekip başarıyla güncellendi",
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

  const deleteTeamMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/teams/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({
        title: "Başarılı",
        description: "Ekip silindi",
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

  const updatePersonnelTeamMutation = useMutation({
    mutationFn: async ({ personnelId, teamId }: { personnelId: number; teamId: number | null }) => {
      await apiRequest("PUT", `/api/personnel/${personnelId}`, { teamId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personnel"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({
        title: "Başarılı",
        description: "Personel ekip ataması güncellendi",
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

  const handleSubmit = (data: z.infer<typeof teamFormSchema>) => {
    const submitData = {
      ...data,
      branchId: data.branchId && data.branchId !== "none" ? parseInt(data.branchId, 10) : undefined,
      leaderId: data.leaderId && data.leaderId !== "none" ? parseInt(data.leaderId, 10) : undefined,
    };
    
    if (editingTeam) {
      updateTeamMutation.mutate(submitData);
    } else {
      createTeamMutation.mutate(submitData);
    }
  };

  const handleEdit = (team: any) => {
    setEditingTeam(team);
    form.reset({
      name: team.name,
      description: team.description || undefined,
      branchId: team.branchId || undefined,
      leaderId: team.leaderId || undefined,
      isActive: team.isActive,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Bu ekibi silmek istediğinizden emin misiniz?")) {
      deleteTeamMutation.mutate(id);
    }
  };

  const handleNewTeam = () => {
    setEditingTeam(null);
    form.reset();
    setDialogOpen(true);
  };

  const handleTeamClick = (team: any) => {
    setSelectedTeam(team);
    setPersonnelSearchTerm('');
    setTeamPersonnelDialogOpen(true);
  };

  const handleAddPersonnelToTeam = (personnelId: number) => {
    updatePersonnelTeamMutation.mutate({ personnelId, teamId: selectedTeam?.id });
  };

  const handleRemovePersonnelFromTeam = (personnelId: number) => {
    updatePersonnelTeamMutation.mutate({ personnelId, teamId: null });
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Ekip Yönetimi</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewTeam} className="bg-primary hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Ekip
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Ekipler ({teams?.length || 0} adet)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!teams || teams.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Henüz ekip tanımlanmamış
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ekip Adı</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead>Şube</TableHead>
                    <TableHead>Ekip Lideri</TableHead>
                    <TableHead>Üye Sayısı</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.map((team: any) => {
                    const teamPersonnel = personnel?.filter((p: any) => p.teamId === team.id) || [];
                    const leader = personnel?.find((p: any) => p.id === team.leaderId);
                    return (
                      <TableRow 
                        key={team.id} 
                        className="cursor-pointer hover:bg-gray-50" 
                        onClick={() => handleTeamClick(team)}
                      >
                        <TableCell className="font-medium">{team.name}</TableCell>
                        <TableCell>{team.description || "-"}</TableCell>
                        <TableCell>
                          {branches?.find((b: any) => b.id === team.branchId)?.name || 'Tüm Şubeler'}
                        </TableCell>
                        <TableCell>
                          {leader ? (
                            <div className="flex items-center">
                              <Crown className="w-4 h-4 mr-1 text-yellow-500" />
                              {leader.firstName} {leader.lastName}
                            </div>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {teamPersonnel.length} üye
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={team.isActive ? "default" : "secondary"}>
                            {team.isActive ? "Aktif" : "Pasif"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(team);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(team.id);
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

      {/* Ekip Oluşturma/Düzenleme Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTeam ? "Ekip Düzenle" : "Yeni Ekip Ekle"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ekip Adı</FormLabel>
                    <FormControl>
                      <Input placeholder="Örn: Geliştirme Ekibi" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Açıklama</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Ekip açıklaması..."
                        {...field}
                        value={field.value || ""}
                      />
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
                      value={field.value?.toString() || "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Şube seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Tüm Şubeler</SelectItem>
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
              <FormField
                control={form.control}
                name="leaderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ekip Lideri</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value?.toString() || "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Lider seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Lider atanmadı</SelectItem>
                        {personnel
                          ?.filter((p: any) => !form.watch("branchId") || p.branchId === parseInt(form.watch("branchId")))
                          .map((person: any) => (
                          <SelectItem key={person.id} value={person.id.toString()}>
                            {person.firstName} {person.lastName} - {person.position || 'Pozisyon yok'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  disabled={createTeamMutation.isPending || updateTeamMutation.isPending}
                >
                  {editingTeam ? "Güncelle" : "Oluştur"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Ekip Personel Yönetimi Dialog */}
      <Dialog open={teamPersonnelDialogOpen} onOpenChange={setTeamPersonnelDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              {selectedTeam?.name} - Personel Yönetimi
            </DialogTitle>
          </DialogHeader>
          
          {selectedTeam && (
            <div className="space-y-6">
              {/* Ekip bilgileri */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Ekip:</strong> {selectedTeam.name}
                  </div>
                  <div>
                    <strong>Açıklama:</strong> {selectedTeam.description || '-'}
                  </div>
                  <div>
                    <strong>Şube:</strong> {branches?.find((b: any) => b.id === selectedTeam.branchId)?.name || 'Tüm Şubeler'}
                  </div>
                  <div>
                    <strong>Lider:</strong> {(() => {
                      const leader = personnel?.find((p: any) => p.id === selectedTeam.leaderId);
                      return leader ? `${leader.firstName} ${leader.lastName}` : 'Atanmamış';
                    })()}
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
                {/* Ekipteki Personel */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Ekipteki Personel ({filterPersonnel(personnel?.filter((p: any) => p.teamId === selectedTeam.id) || []).length})
                  </h3>
                  <div className="max-h-80 overflow-y-auto space-y-2">
                    {filterPersonnel(personnel?.filter((p: any) => p.teamId === selectedTeam.id) || []).map((person: any) => (
                      <div key={person.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div>
                          <div className="font-medium flex items-center">
                            {person.firstName} {person.lastName}
                            {person.id === selectedTeam.leaderId && (
                              <Crown className="w-4 h-4 ml-2 text-yellow-500" />
                            )}
                          </div>
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
                          onClick={() => handleRemovePersonnelFromTeam(person.id)}
                          className="text-red-600 hover:text-red-700"
                          disabled={updatePersonnelTeamMutation.isPending}
                        >
                          <UserMinus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {filterPersonnel(personnel?.filter((p: any) => p.teamId === selectedTeam.id) || []).length === 0 && (
                      <div className="text-center text-gray-500 py-8">
                        {personnelSearchTerm ? 'Arama kriterine uygun personel bulunamadı' : 'Bu ekipte henüz personel yok'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Atanabilir Personel */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <UserMinus className="w-4 h-4 mr-2" />
                    Atanabilir Personel ({filterPersonnel(personnel?.filter((p: any) => !p.teamId || p.teamId !== selectedTeam.id) || []).length})
                  </h3>
                  <div className="max-h-80 overflow-y-auto space-y-2">
                    {filterPersonnel(personnel?.filter((p: any) => !p.teamId || p.teamId !== selectedTeam.id) || []).map((person: any) => (
                      <div key={person.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div>
                          <div className="font-medium">{person.firstName} {person.lastName}</div>
                          <div className="text-sm text-gray-600">
                            {person.position || '-'}
                            {person.employeeNumber && (
                              <span className="ml-2 text-gray-500">#{person.employeeNumber}</span>
                            )}
                            {person.teamId && person.teamId !== selectedTeam.id && (
                              <span className="ml-2 text-orange-600">
                                (Başka ekipte: {teams?.find((t: any) => t.id === person.teamId)?.name})
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddPersonnelToTeam(person.id)}
                          className="text-green-600 hover:text-green-700"
                          disabled={updatePersonnelTeamMutation.isPending}
                        >
                          <UserPlus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {filterPersonnel(personnel?.filter((p: any) => !p.teamId || p.teamId !== selectedTeam.id) || []).length === 0 && (
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
                  onClick={() => setTeamPersonnelDialogOpen(false)}
                >
                  Kapat
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}