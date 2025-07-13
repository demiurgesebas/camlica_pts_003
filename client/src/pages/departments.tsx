import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Building2, Users, ChevronRight, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Department {
  id: number;
  branchId: number;
  name: string;
  description?: string;
  managerId?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Branch {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
}

interface Personnel {
  id: number;
  firstName: string;
  lastName: string;
  position?: string;
  branchId: number;
  departmentId?: number;
}

export default function Departments() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAssignPersonnelDialogOpen, setIsAssignPersonnelDialogOpen] = useState(false);
  const [isPersonnelListDialogOpen, setIsPersonnelListDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [assigningDepartment, setAssigningDepartment] = useState<Department | null>(null);
  const [viewingDepartment, setViewingDepartment] = useState<Department | null>(null);
  const [selectedPersonnelIds, setSelectedPersonnelIds] = useState<number[]>([]);
  const [newDepartment, setNewDepartment] = useState({
    name: "",
    description: "",
    branchId: "",
    managerId: "",
  });
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: departments, isLoading: departmentsLoading } = useQuery({
    queryKey: ['/api/departments'],
  });

  const { data: branches } = useQuery({
    queryKey: ['/api/branches'],
  });

  const { data: personnel } = useQuery({
    queryKey: ['/api/personnel'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest('/api/departments', { method: 'POST', body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
      setIsCreateDialogOpen(false);
      setNewDepartment({ name: "", description: "", branchId: "", managerId: "" });
      toast({ title: "Başarılı", description: "Birim başarıyla oluşturuldu." });
    },
    onError: (error) => {
      toast({ title: "Hata", description: "Birim oluşturulurken bir hata oluştu.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest(`/api/departments/${editingDepartment?.id}`, { method: 'PUT', body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
      setIsEditDialogOpen(false);
      setEditingDepartment(null);
      toast({ title: "Başarılı", description: "Birim başarıyla güncellendi." });
    },
    onError: (error) => {
      toast({ title: "Hata", description: "Birim güncellenirken bir hata oluştu.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/departments/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
      toast({ title: "Başarılı", description: "Birim başarıyla silindi." });
    },
    onError: (error) => {
      toast({ title: "Hata", description: "Birim silinirken bir hata oluştu.", variant: "destructive" });
    },
  });

  const assignPersonnelMutation = useMutation({
    mutationFn: async ({ personnelIds, departmentId }: { personnelIds: number[], departmentId: number }) => {
      const promises = personnelIds.map(personnelId => 
        apiRequest('PUT', `/api/personnel/${personnelId}`, { departmentId })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/personnel'] });
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
      setIsAssignPersonnelDialogOpen(false);
      setSelectedPersonnelIds([]);
      setAssigningDepartment(null);
      toast({ title: "Başarılı", description: "Personeller başarıyla birime atandı." });
    },
    onError: (error) => {
      toast({ title: "Hata", description: "Personel atama sırasında bir hata oluştu.", variant: "destructive" });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: newDepartment.name,
      description: newDepartment.description || null,
      branchId: parseInt(newDepartment.branchId),
      managerId: newDepartment.managerId && newDepartment.managerId !== "none" ? parseInt(newDepartment.managerId) : null,
    };
    createMutation.mutate(data);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDepartment) return;
    const data = {
      name: editingDepartment.name,
      description: editingDepartment.description || null,
      branchId: editingDepartment.branchId,
      managerId: editingDepartment.managerId && editingDepartment.managerId !== "none" ? editingDepartment.managerId : null,
    };
    updateMutation.mutate(data);
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleAssignPersonnel = (department: Department) => {
    setAssigningDepartment(department);
    setSelectedPersonnelIds([]);
    setIsAssignPersonnelDialogOpen(true);
  };

  const handlePersonnelSelection = (personnelId: number, isSelected: boolean) => {
    if (isSelected) {
      setSelectedPersonnelIds(prev => [...prev, personnelId]);
    } else {
      setSelectedPersonnelIds(prev => prev.filter(id => id !== personnelId));
    }
  };

  const submitPersonnelAssignment = () => {
    if (assigningDepartment && selectedPersonnelIds.length > 0) {
      assignPersonnelMutation.mutate({
        personnelIds: selectedPersonnelIds,
        departmentId: assigningDepartment.id
      });
    }
  };

  const handleViewPersonnel = (department: Department) => {
    setViewingDepartment(department);
    setIsPersonnelListDialogOpen(true);
  };

  const getBranchName = (branchId: number) => {
    const branch = branches?.find((b: Branch) => b.id === branchId);
    return branch?.name || "Bilinmeyen Şube";
  };

  const getManagerName = (managerId: number) => {
    const manager = personnel?.find((p: Personnel) => p.id === managerId);
    return manager ? `${manager.firstName} ${manager.lastName}` : "Bilinmeyen Yönetici";
  };

  const filteredDepartments = departments?.filter((dept: Department) => {
    if (!selectedBranch || selectedBranch === "all") return true;
    return dept.branchId === parseInt(selectedBranch);
  });

  const getDepartmentPersonnelCount = (departmentId: number) => {
    return personnel?.filter((p: Personnel) => p.departmentId === departmentId).length || 0;
  };

  const getAvailablePersonnelForBranch = (branchId: number) => {
    return personnel?.filter((p: Personnel) => p.branchId === branchId) || [];
  };

  if (departmentsLoading) {
    return <div className="flex justify-center items-center h-64">Yükleniyor...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Birim Yönetimi</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Birim
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Birim Ekle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Birim Adı</Label>
                <Input
                  id="name"
                  value={newDepartment.name}
                  onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  value={newDepartment.description}
                  onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
                  placeholder="Birim hakkında açıklama..."
                />
              </div>
              <div>
                <Label htmlFor="branchId">Şube</Label>
                <Select 
                  value={newDepartment.branchId} 
                  onValueChange={(value) => setNewDepartment({ ...newDepartment, branchId: value, managerId: "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Şube seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches?.map((branch: Branch) => (
                      <SelectItem key={branch.id} value={branch.id.toString()}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="managerId">Birim Amiri</Label>
                <Select 
                  value={newDepartment.managerId} 
                  onValueChange={(value) => setNewDepartment({ ...newDepartment, managerId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Birim amiri seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Birim amiri yok</SelectItem>
                    {newDepartment.branchId && 
                      getAvailablePersonnelForBranch(parseInt(newDepartment.branchId))?.map((person: Personnel) => (
                        <SelectItem key={person.id} value={person.id.toString()}>
                          {person.firstName} {person.lastName} - {person.position}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  İptal
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Oluşturuluyor..." : "Oluştur"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex space-x-4">
        <div className="flex-1">
          <Label htmlFor="branch-filter">Şube Filtresi</Label>
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger>
              <SelectValue placeholder="Tüm şubeler" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm şubeler</SelectItem>
              {branches?.map((branch: Branch) => (
                <SelectItem key={branch.id} value={branch.id.toString()}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredDepartments?.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Henüz birim bulunmuyor</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredDepartments?.map((department: Department) => (
            <Card 
              key={department.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleViewPersonnel(department)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-3">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <div>
                    <CardTitle className="text-lg">{department.name}</CardTitle>
                    <p className="text-sm text-gray-600">
                      {getBranchName(department.branchId)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={department.isActive ? "default" : "secondary"}>
                    {department.isActive ? "Aktif" : "Pasif"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAssignPersonnel(department);
                    }}
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(department);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Birimi Sil</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bu birimi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(department.id)}>
                          Sil
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {department.description && (
                    <p className="text-sm text-gray-600">{department.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {getDepartmentPersonnelCount(department.id)} personel
                        </span>
                      </div>
                      {department.managerId && (
                        <div className="flex items-center space-x-1">
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            Amiri: {getManagerName(department.managerId)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Birim Düzenle</DialogTitle>
          </DialogHeader>
          {editingDepartment && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Birim Adı</Label>
                <Input
                  id="edit-name"
                  value={editingDepartment.name}
                  onChange={(e) => setEditingDepartment({ ...editingDepartment, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Açıklama</Label>
                <Textarea
                  id="edit-description"
                  value={editingDepartment.description || ""}
                  onChange={(e) => setEditingDepartment({ ...editingDepartment, description: e.target.value })}
                  placeholder="Birim hakkında açıklama..."
                />
              </div>
              <div>
                <Label htmlFor="edit-managerId">Birim Amiri</Label>
                <Select 
                  value={editingDepartment.managerId?.toString() || "none"} 
                  onValueChange={(value) => setEditingDepartment({ ...editingDepartment, managerId: value && value !== "none" ? parseInt(value) : undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Birim amiri seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Birim amiri yok</SelectItem>
                    {getAvailablePersonnelForBranch(editingDepartment.branchId)?.map((person: Personnel) => (
                      <SelectItem key={person.id} value={person.id.toString()}>
                        {person.firstName} {person.lastName} - {person.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  İptal
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Güncelleniyor..." : "Güncelle"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Personel Atama Dialog */}
      <Dialog open={isAssignPersonnelDialogOpen} onOpenChange={setIsAssignPersonnelDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {assigningDepartment?.name} Birimine Personel Ata
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Aşağıdaki listeden {assigningDepartment?.name} birimine atamak istediğiniz personelleri seçin:
            </p>
            <div className="max-h-64 overflow-y-auto border rounded-lg p-4 space-y-2">
              {personnel
                ?.filter((person: Personnel) => 
                  // Aynı şubede çalışan ve henüz bu birime atanmamış personeller
                  person.branchId === assigningDepartment?.branchId && 
                  person.departmentId !== assigningDepartment?.id
                )
                .map((person: Personnel) => (
                <div key={person.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                  <Checkbox
                    id={`person-${person.id}`}
                    checked={selectedPersonnelIds.includes(person.id)}
                    onCheckedChange={(checked) => 
                      handlePersonnelSelection(person.id, checked as boolean)
                    }
                  />
                  <label 
                    htmlFor={`person-${person.id}`}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {person.firstName} {person.lastName}
                      </span>
                      <span className="text-sm text-gray-500">
                        {person.position || "Pozisyon belirtilmemiş"}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {person.departmentId 
                        ? `Mevcut birim: ${departments?.find((d: any) => d.id === person.departmentId)?.name || "Bilinmeyen"}`
                        : "Henüz birime atanmamış"
                      }
                    </div>
                  </label>
                </div>
              ))}
              {personnel?.filter((person: Personnel) => 
                person.branchId === assigningDepartment?.branchId && 
                person.departmentId !== assigningDepartment?.id
              ).length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  Bu şubede birime atanabilecek personel bulunmuyor
                </div>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                {selectedPersonnelIds.length} personel seçildi
              </span>
              <div className="space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsAssignPersonnelDialogOpen(false)}
                >
                  İptal
                </Button>
                <Button 
                  onClick={submitPersonnelAssignment}
                  disabled={selectedPersonnelIds.length === 0 || assignPersonnelMutation.isPending}
                >
                  {assignPersonnelMutation.isPending ? "Atanıyor..." : "Personelleri Ata"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Personel Listesi Dialog */}
      <Dialog open={isPersonnelListDialogOpen} onOpenChange={setIsPersonnelListDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {viewingDepartment?.name} Birimi Personelleri
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {getBranchName(viewingDepartment?.branchId || 0)} şubesi - {viewingDepartment?.name} birimi
              </p>
              <Badge variant="outline">
                {personnel?.filter((p: Personnel) => p.departmentId === viewingDepartment?.id).length || 0} personel
              </Badge>
            </div>
            
            {viewingDepartment?.description && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">{viewingDepartment.description}</p>
              </div>
            )}

            <div className="border rounded-lg">
              {personnel?.filter((person: Personnel) => person.departmentId === viewingDepartment?.id).length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Bu birimde henüz personel bulunmuyor</p>
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => {
                      setIsPersonnelListDialogOpen(false);
                      handleAssignPersonnel(viewingDepartment!);
                    }}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Personel Ata
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {personnel
                    ?.filter((person: Personnel) => person.departmentId === viewingDepartment?.id)
                    .map((person: Personnel) => (
                    <div key={person.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {person.firstName.charAt(0)}{person.lastName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{person.firstName} {person.lastName}</p>
                            <p className="text-sm text-gray-600">{person.position || "Pozisyon belirtilmemiş"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {person.id === viewingDepartment?.managerId && (
                              <Badge variant="outline" className="mb-1">Birim Amiri</Badge>
                            )}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Personeli bu birimden çıkar
                              assignPersonnelMutation.mutate({
                                personnelIds: [person.id],
                                departmentId: null as any
                              });
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            Birimden Çıkar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-4">
              <Button 
                variant="outline"
                onClick={() => {
                  setIsPersonnelListDialogOpen(false);
                  handleAssignPersonnel(viewingDepartment!);
                }}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Personel Ekle
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsPersonnelListDialogOpen(false)}
              >
                Kapat
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}