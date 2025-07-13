import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  Key, 
  Shield, 
  Users, 
  UserCheck, 
  UserX,
  MoreVertical,
  Settings
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  MENU_CATEGORIES, 
  DEFAULT_ROLE_PERMISSIONS, 
  PERMISSION_LABELS,
  type MenuPermission 
} from "@shared/menuPermissions";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string;
  username: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
}

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [showUserDetailsDialog, setShowUserDetailsDialog] = useState(false);
  const [showPersonnelSearchDialog, setShowPersonnelSearchDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [personnelSearchTerm, setPersonnelSearchTerm] = useState("");
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    email: "",
    role: "personnel",
    permissions: [] as string[]
  });
  const [newPassword, setNewPassword] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    retry: false,
  });

  const { data: personnel, isLoading: isPersonnelLoading } = useQuery({
    queryKey: ["/api/personnel"],
    retry: false,
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      return apiRequest("/api/users", {
        method: "POST",
        body: JSON.stringify(userData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setShowCreateDialog(false);
      setNewUser({
        username: "",
        password: "",
        firstName: "",
        lastName: "",
        email: "",
        role: "personnel",
        permissions: []
      });
      toast({
        title: "Başarılı",
        description: "Kullanıcı başarıyla oluşturuldu",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: error.message || "Kullanıcı oluşturulamadı",
        variant: "destructive",
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      return apiRequest(`/api/users/${id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Başarılı",
        description: "Kullanıcı rolü güncellendi",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: error.message || "Rol güncellenemedi",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return apiRequest(`/api/users/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Başarılı",
        description: "Kullanıcı durumu güncellendi",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: error.message || "Durum güncellenemedi",
        variant: "destructive",
      });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) => {
      return apiRequest(`/api/users/${id}/password`, {
        method: "PATCH",
        body: JSON.stringify({ password }),
      });
    },
    onSuccess: () => {
      setShowPasswordDialog(false);
      setNewPassword("");
      setSelectedUser(null);
      toast({
        title: "Başarılı",
        description: "Şifre güncellendi",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: error.message || "Şifre güncellenemedi",
        variant: "destructive",
      });
    },
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ id, permissions }: { id: string; permissions: string[] }) => {
      return apiRequest(`/api/users/${id}/permissions`, {
        method: "PATCH",
        body: JSON.stringify({ permissions }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setShowPermissionsDialog(false);
      setSelectedUser(null);
      toast({
        title: "Başarılı",
        description: "Kullanıcı izinleri güncellendi",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: error.message || "İzinler güncellenemedi",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/users/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Başarılı",
        description: "Kullanıcı silindi",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: error.message || "Kullanıcı silinemedi",
        variant: "destructive",
      });
    },
  });

  const handleCreateUser = () => {
    if (!newUser.username || !newUser.password) {
      toast({
        title: "Hata",
        description: "Kullanıcı adı ve şifre gerekli",
        variant: "destructive",
      });
      return;
    }
    createUserMutation.mutate(newUser);
  };

  const handleEditRole = (user: User) => {
    setSelectedUser(user);
    setShowEditDialog(true);
  };

  const handleUpdateRole = (role: string) => {
    if (selectedUser) {
      updateRoleMutation.mutate({ id: selectedUser.id, role });
      setShowEditDialog(false);
      setSelectedUser(null);
    }
  };

  const handleToggleStatus = (user: User) => {
    updateStatusMutation.mutate({ id: user.id, isActive: !user.isActive });
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setShowPasswordDialog(true);
  };

  const handleUpdatePassword = () => {
    if (selectedUser && newPassword) {
      updatePasswordMutation.mutate({ id: selectedUser.id, password: newPassword });
    }
  };

  const handleDeleteUser = (user: User) => {
    if (window.confirm(`${user.username} kullanıcısını silmek istediğinizden emin misiniz?`)) {
      deleteUserMutation.mutate(user.id);
    }
  };

  const handleEditPermissions = (user: User) => {
    setSelectedUser(user);
    setShowPermissionsDialog(true);
  };

  const handleUpdatePermissions = (permissions: string[]) => {
    if (selectedUser) {
      updatePermissionsMutation.mutate({ id: selectedUser.id, permissions });
    }
  };

  const handleUserRowClick = (user: User) => {
    setSelectedUser(user);
    setShowUserDetailsDialog(true);
  };

  const handlePersonnelSelect = (selectedPersonnel: any) => {
    setNewUser({
      ...newUser,
      firstName: selectedPersonnel.firstName || "",
      lastName: selectedPersonnel.lastName || "",
      email: selectedPersonnel.email || "",
      username: selectedPersonnel.phone || selectedPersonnel.tcNo || selectedPersonnel.id.toString(),
    });
    setShowPersonnelSearchDialog(false);
  };

  const handleRoleChange = (role: string) => {
    // Rol değiştiğinde varsayılan izinleri uygula
    const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[role] || [];
    setNewUser({ ...newUser, role, permissions: defaultPermissions });
  };

  const handlePermissionToggle = (permission: string, checked: boolean) => {
    if (selectedUser) {
      const currentPermissions = selectedUser.permissions || [];
      const newPermissions = checked 
        ? [...currentPermissions, permission]
        : currentPermissions.filter(p => p !== permission);
      
      setSelectedUser({ ...selectedUser, permissions: newPermissions });
    } else {
      // Yeni kullanıcı için
      const newPermissions = checked 
        ? [...newUser.permissions, permission]
        : newUser.permissions.filter(p => p !== permission);
      
      setNewUser({ ...newUser, permissions: newPermissions });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Badge className="bg-red-500 text-white">Süper Admin</Badge>;
      case "admin":
        return <Badge className="bg-blue-500 text-white">Admin</Badge>;
      case "personnel":
        return <Badge className="bg-green-500 text-white">Personel</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-500 text-white">Aktif</Badge>
    ) : (
      <Badge className="bg-red-500 text-white">Pasif</Badge>
    );
  };

  const filteredUsers = users?.filter((user: User) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
                         (user.username && user.username.toLowerCase().includes(searchLower)) ||
                         (user.firstName && user.firstName.toLowerCase().includes(searchLower)) ||
                         (user.lastName && user.lastName.toLowerCase().includes(searchLower)) ||
                         (user.email && user.email.toLowerCase().includes(searchLower));
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && user.isActive) ||
                         (statusFilter === "inactive" && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Kullanıcılar yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  // User statistics
  const totalUsers = users?.length || 0;
  const activeUsers = users?.filter((u: User) => u.isActive).length || 0;
  const adminUsers = users?.filter((u: User) => u.role === 'admin' || u.role === 'super_admin').length || 0;
  const personnelUsers = users?.filter((u: User) => u.role === 'personnel').length || 0;

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Kullanıcı Yönetimi</h1>
          <p className="text-gray-600 mt-2">Sistem kullanıcılarını yönetin</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-500 hover:bg-blue-600">
              <UserPlus className="h-4 w-4 mr-2" />
              Yeni Kullanıcı
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Kullanıcı Oluştur</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="username">Kullanıcı Adı *</Label>
                <div className="flex gap-2">
                  <Input
                    id="username"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    placeholder="Kullanıcı adı"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPersonnelSearchDialog(true)}
                    className="shrink-0"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Personel Ara
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="password">Şifre *</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Şifre"
                />
              </div>
              <div>
                <Label htmlFor="firstName">Ad</Label>
                <Input
                  id="firstName"
                  value={newUser.firstName}
                  onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                  placeholder="Ad"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Soyad</Label>
                <Input
                  id="lastName"
                  value={newUser.lastName}
                  onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                  placeholder="Soyad"
                />
              </div>
              <div>
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="E-posta"
                />
              </div>
              <div>
                <Label htmlFor="role">Rol</Label>
                <Select value={newUser.role} onValueChange={handleRoleChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Rol seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personnel">Personel</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Süper Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* İzinler Önizlemesi */}
              <div>
                <Label>Menü İzinleri ({newUser.permissions.length} izin)</Label>
                <div className="mt-2 p-3 bg-gray-50 rounded-md max-h-32 overflow-y-auto">
                  {newUser.permissions.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {newUser.permissions.map((permission) => (
                        <Badge key={permission} variant="outline" className="text-xs">
                          {PERMISSION_LABELS[permission as MenuPermission] || permission}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Henüz izin seçilmedi</p>
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  İptal
                </Button>
                <Button
                  onClick={handleCreateUser}
                  disabled={createUserMutation.isPending}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  {createUserMutation.isPending ? "Oluşturuluyor..." : "Oluştur"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-blue-600">{totalUsers}</p>
                <p className="text-sm text-gray-600">Toplam Kullanıcı</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-green-600">{activeUsers}</p>
                <p className="text-sm text-gray-600">Aktif Kullanıcı</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-purple-600">{adminUsers}</p>
                <p className="text-sm text-gray-600">Admin</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <UserX className="h-8 w-8 text-gray-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-600">{personnelUsers}</p>
                <p className="text-sm text-gray-600">Personel</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtreler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Ara</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Kullanıcı adı, ad, soyad veya e-posta"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="roleFilter">Rol</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Rol seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Roller</SelectItem>
                  <SelectItem value="super_admin">Süper Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="personnel">Personel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="statusFilter">Durum</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Durum seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Pasif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Kullanıcılar ({filteredUsers?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Kullanıcı Adı</th>
                  <th className="text-left p-3">Ad Soyad</th>
                  <th className="text-left p-3">E-posta</th>
                  <th className="text-left p-3">Rol</th>
                  <th className="text-left p-3">İzinler</th>
                  <th className="text-left p-3">Durum</th>
                  <th className="text-left p-3">Son Giriş</th>
                  <th className="text-left p-3">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers?.map((user: User) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => handleUserRowClick(user)}>
                    <td className="p-3 font-medium">{user.username}</td>
                    <td className="p-3">
                      {user.firstName || user.lastName ? 
                        `${user.firstName || ''} ${user.lastName || ''}`.trim() : 
                        '-'
                      }
                    </td>
                    <td className="p-3">{user.email || '-'}</td>
                    <td className="p-3">{getRoleBadge(user.role)}</td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-xs">
                        {user.permissions?.length || 0} izin
                      </Badge>
                    </td>
                    <td className="p-3">{getStatusBadge(user.isActive)}</td>
                    <td className="p-3">
                      {user.lastLogin ? 
                        new Date(user.lastLogin).toLocaleDateString('tr-TR') : 
                        '-'
                      }
                    </td>
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditRole(user)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Rol Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                            {user.isActive ? <UserX className="h-4 w-4 mr-2" /> : <UserCheck className="h-4 w-4 mr-2" />}
                            {user.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditPermissions(user)}>
                            <Settings className="h-4 w-4 mr-2" />
                            İzinleri Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                            <Key className="h-4 w-4 mr-2" />
                            Şifre Sıfırla
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteUser(user)} className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers?.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">Kullanıcı bulunamadı</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Personnel Search Dialog */}
      <Dialog open={showPersonnelSearchDialog} onOpenChange={setShowPersonnelSearchDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Personel Ara</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="personnelSearch">Personel Arama</Label>
              <Input
                id="personnelSearch"
                value={personnelSearchTerm}
                onChange={(e) => setPersonnelSearchTerm(e.target.value)}
                placeholder="Ad, soyad, telefon, TC No ile arama yapın..."
              />
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Ad Soyad</th>
                    <th className="text-left p-2">Telefon</th>
                    <th className="text-left p-2">TC No</th>
                    <th className="text-left p-2">E-posta</th>
                    <th className="text-left p-2">Şube</th>
                    <th className="text-left p-2">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {personnel?.filter((person: any) => {
                    const searchLower = personnelSearchTerm.toLowerCase();
                    return !personnelSearchTerm || 
                           (person.firstName && person.firstName.toLowerCase().includes(searchLower)) ||
                           (person.lastName && person.lastName.toLowerCase().includes(searchLower)) ||
                           (person.phone && person.phone.includes(searchLower)) ||
                           (person.tcNo && person.tcNo.includes(searchLower)) ||
                           (person.email && person.email.toLowerCase().includes(searchLower));
                  }).map((person: any) => (
                    <tr key={person.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{`${person.firstName || ''} ${person.lastName || ''}`.trim()}</td>
                      <td className="p-2">{person.phone || '-'}</td>
                      <td className="p-2">{person.tcNo || '-'}</td>
                      <td className="p-2">{person.email || '-'}</td>
                      <td className="p-2">{person.branch?.name || '-'}</td>
                      <td className="p-2">
                        <Button
                          size="sm"
                          onClick={() => handlePersonnelSelect(person)}
                          className="bg-blue-500 hover:bg-blue-600"
                        >
                          Seç
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {personnel?.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Personel bulunamadı</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={showUserDetailsDialog} onOpenChange={setShowUserDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Kullanıcı Detayları</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Kullanıcı Adı</Label>
                  <p className="text-sm mt-1">{selectedUser.username || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Ad Soyad</Label>
                  <p className="text-sm mt-1">
                    {selectedUser.firstName || selectedUser.lastName ? 
                      `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() : 
                      '-'
                    }
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">E-posta</Label>
                  <p className="text-sm mt-1">{selectedUser.email || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Rol</Label>
                  <p className="text-sm mt-1">{getRoleBadge(selectedUser.role)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Durum</Label>
                  <p className="text-sm mt-1">{getStatusBadge(selectedUser.isActive)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Son Giriş</Label>
                  <p className="text-sm mt-1">
                    {selectedUser.lastLogin ? 
                      new Date(selectedUser.lastLogin).toLocaleDateString('tr-TR') : 
                      '-'
                    }
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Oluşturma Tarihi</Label>
                  <p className="text-sm mt-1">
                    {new Date(selectedUser.createdAt).toLocaleDateString('tr-TR')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Güncelleme Tarihi</Label>
                  <p className="text-sm mt-1">
                    {new Date(selectedUser.updatedAt).toLocaleDateString('tr-TR')}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600">Menü İzinleri ({selectedUser.permissions?.length || 0} izin)</Label>
                <div className="mt-2 p-3 bg-gray-50 rounded-md max-h-32 overflow-y-auto">
                  {selectedUser.permissions && selectedUser.permissions.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {selectedUser.permissions.map((permission) => (
                        <Badge key={permission} variant="outline" className="text-xs">
                          {PERMISSION_LABELS[permission as MenuPermission] || permission}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">İzin bulunmuyor</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowUserDetailsDialog(false)}
                >
                  Kapat
                </Button>
                <Button
                  onClick={() => {
                    setShowUserDetailsDialog(false);
                    handleEditPermissions(selectedUser);
                  }}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  İzinleri Düzenle
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rol Düzenle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              <strong>{selectedUser?.username}</strong> kullanıcısının rolünü değiştirin:
            </p>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleUpdateRole('personnel')}
              >
                Personel
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleUpdateRole('admin')}
              >
                Admin
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleUpdateRole('super_admin')}
              >
                Süper Admin
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Şifre Sıfırla</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              <strong>{selectedUser?.username}</strong> kullanıcısının şifresini sıfırlayın:
            </p>
            <div>
              <Label htmlFor="newPassword">Yeni Şifre</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Yeni şifre"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPasswordDialog(false);
                  setNewPassword("");
                  setSelectedUser(null);
                }}
              >
                İptal
              </Button>
              <Button
                onClick={handleUpdatePassword}
                disabled={updatePasswordMutation.isPending || !newPassword}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {updatePasswordMutation.isPending ? "Güncelleniyor..." : "Güncelle"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Permissions Management Dialog */}
      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Menü İzinleri - {selectedUser?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(MENU_CATEGORIES).map(([categoryKey, category]) => (
                <Card key={categoryKey}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">{category.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {category.permissions.map((permission) => (
                      <div key={permission} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission}
                          checked={selectedUser?.permissions?.includes(permission) || false}
                          onCheckedChange={(checked) => handlePermissionToggle(permission, checked as boolean)}
                        />
                        <Label 
                          htmlFor={permission}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {PERMISSION_LABELS[permission as MenuPermission] || permission}
                        </Label>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-gray-600">
                <strong>{selectedUser?.permissions?.length || 0}</strong> izin seçildi
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPermissionsDialog(false);
                    setSelectedUser(null);
                  }}
                >
                  İptal
                </Button>
                <Button
                  onClick={() => handleUpdatePermissions(selectedUser?.permissions || [])}
                  disabled={updatePermissionsMutation.isPending}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  {updatePermissionsMutation.isPending ? "Güncelleniyor..." : "İzinleri Güncelle"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}