import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBranchSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Building, Plus, Edit, Trash2, MapPin, Phone, Mail, Users, ChevronUp, ChevronDown } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";

const branchFormSchema = insertBranchSchema.extend({
  name: z.string().min(1, "Şube adı gereklidir"),
});

export default function Branches() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return <div className="p-6">Kullanıcı bilgileri yükleniyor...</div>;
  }
  if (!isAuthenticated) {
    return <div className="p-6 text-red-600 font-semibold">Bu sayfayı görüntülemek için giriş yapmalısınız.</div>;
  }

  const form = useForm<z.infer<typeof branchFormSchema>>({
    resolver: zodResolver(branchFormSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      email: "",
      isActive: true,
    },
  });

  const { data: branches = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/branches"],
  });

  const { data: users } = useQuery({
    queryKey: ["/api/auth/user"],
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
  const filteredBranches = branches.filter((branch: any) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      branch.name?.toLowerCase().includes(searchLower) ||
      branch.address?.toLowerCase().includes(searchLower) ||
      branch.phone?.toLowerCase().includes(searchLower) ||
      branch.email?.toLowerCase().includes(searchLower) ||
      branch.manager?.firstName?.toLowerCase().includes(searchLower) ||
      branch.manager?.lastName?.toLowerCase().includes(searchLower)
    );
  });

  // Sıralama uygulama
  const sortedBranches = [...filteredBranches].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue = '';
    let bValue = '';
    
    switch (sortField) {
      case 'name':
        aValue = a.name || '';
        bValue = b.name || '';
        break;
      case 'address':
        aValue = a.address || '';
        bValue = b.address || '';
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
  const totalPages = Math.ceil(sortedBranches.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBranches = sortedBranches.slice(startIndex, startIndex + itemsPerPage);

  const createBranchMutation = useMutation({
    mutationFn: async (data: z.infer<typeof branchFormSchema>) => {
      await apiRequest("/api/branches", { method: "POST", body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
      toast({
        title: "Başarılı",
        description: "Şube başarıyla oluşturuldu",
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

  const updateBranchMutation = useMutation({
    mutationFn: async (data: z.infer<typeof branchFormSchema>) => {
      await apiRequest(`/api/branches/${editingBranch.id}`, { method: "PUT", body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
      toast({
        title: "Başarılı",
        description: "Şube bilgileri güncellendi",
      });
      setDialogOpen(false);
      setEditingBranch(null);
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

  const deleteBranchMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/branches/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
      toast({
        title: "Başarılı",
        description: "Şube silindi",
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



  const handleSubmit = (data: z.infer<typeof branchFormSchema>) => {
    // Don't send managerId if "none" is selected or empty
    const submitData: any = {
      name: data.name,
      address: data.address || null,
      phone: data.phone || null,
      email: data.email || null,
      isActive: data.isActive
    };
    
    // Only include managerId if a real manager is selected
    if (data.managerId && data.managerId !== "none") {
      submitData.managerId = data.managerId;
    }
    
    if (editingBranch) {
      updateBranchMutation.mutate(submitData);
    } else {
      createBranchMutation.mutate(submitData);
    }
  };

  const handleEdit = (branch: any) => {
    setEditingBranch(branch);
    form.reset({
      name: branch.name,
      address: branch.address || "",
      phone: branch.phone || "",
      email: branch.email || "",
      managerId: branch.managerId,
      isActive: branch.isActive,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Bu şubeyi silmek istediğinizden emin misiniz?")) {
      deleteBranchMutation.mutate(id);
    }
  };

  const handleNewBranch = () => {
    setEditingBranch(null);
    form.reset();
    setDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Şube Yönetimi</h1>
          <p className="text-gray-600">Şube bilgilerini görüntüle ve yönet</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewBranch} className="bg-primary hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Şube
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingBranch ? "Şube Düzenle" : "Yeni Şube Ekle"}
              </DialogTitle>
              <DialogDescription>
                {editingBranch ? "Şube bilgilerini düzenleyin" : "Yeni şube bilgilerini girin"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Şube Adı</FormLabel>
                      <FormControl>
                        <Input placeholder="Şube adını girin" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adres</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Şube adresini girin" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefon</FormLabel>
                        <FormControl>
                          <Input placeholder="Telefon numarası" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-posta</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="E-posta adresi" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="managerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Şube Müdürü (İsteğe Bağlı)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "none"}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Şube müdürü seçin (sonra da atayabilirsiniz)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Şimdilik atanmasın</SelectItem>
                          {/* Mock users - replace with actual user data */}
                          <SelectItem value="user1">Ahmet Yılmaz</SelectItem>
                          <SelectItem value="user2">Mehmet Demir</SelectItem>
                          <SelectItem value="user3">Ayşe Kaya</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                      <p className="text-xs text-gray-500">
                        Şube müdürünü daha sonra personel eklendikten sonra atayabilirsiniz.
                      </p>
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
                    disabled={createBranchMutation.isPending || updateBranchMutation.isPending}
                  >
                    {editingBranch ? "Güncelle" : "Oluştur"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam Şube</p>
                <p className="text-2xl font-bold text-primary">{(branches as any[]).length}</p>
              </div>
              <Building className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aktif Şube</p>
                <p className="text-2xl font-bold text-green-600">
                  {(branches as any[]).filter((b: any) => b.isActive).length}
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
                <p className="text-sm text-gray-600">Toplam Personel</p>
                <p className="text-2xl font-bold text-blue-600">156</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ortalama Personel/Şube</p>
                <p className="text-2xl font-bold text-purple-600">
                  {(branches as any[]).length ? Math.round(156 / (branches as any[]).length) : 0}
                </p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Branches Table */}
      <Card>
        <CardHeader>
          <CardTitle>Şube Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Arama ve Filtreleme */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4 mb-4">
            <h4 className="font-medium text-gray-900">Arama ve Filtreleme</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Building className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Şube adı, adres, telefon..."
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
              {filteredBranches.length} şube bulundu
              {searchTerm && ` (${branches?.length || 0} toplam şube içinde)`}
            </div>
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
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Şube Adı</span>
                      {sortField === 'name' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort('address')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Adres</span>
                      {sortField === 'address' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>İletişim</TableHead>
                  <TableHead>Personel</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBranches?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Şube bulunamadı
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedBranches?.map((branch: any) => (
                    <TableRow key={branch.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{branch.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{branch.address || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {branch.phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <span className="text-xs">{branch.phone}</span>
                            </div>
                          )}
                          {branch.email && (
                            <div className="flex items-center space-x-2">
                              <Mail className="w-3 h-3 text-gray-400" />
                              <span className="text-xs">{branch.email}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            {Math.floor(Math.random() * 50) + 10} kişi
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={branch.isActive ? "default" : "secondary"}>
                          {branch.isActive ? "Aktif" : "Pasif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(branch)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(branch.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          
          {/* Sayfalama */}
          {filteredBranches.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredBranches.length)} 
                arası, toplam {filteredBranches.length} sonuç
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
    </div>
  );
}