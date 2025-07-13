import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { ListTodo, Plus, Edit, Trash2, Clock, Users } from "lucide-react";
import { z } from "zod";

const taskFormSchema = z.object({
  title: z.string().min(1, "Görev başlığı gereklidir"),
  description: z.string().min(1, "Görev açıklaması gereklidir"),
  priority: z.string().min(1, "Öncelik seviyesi gereklidir"),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.string().default("todo"),
});

export default function Tasks() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof taskFormSchema>>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      status: "todo",
    },
  });

  // Mock data for now - replace with actual API calls
  const mockTasks = [
    {
      id: 1,
      title: "Yeni personel eğitimi hazırla",
      description: "Yeni işe başlayan personel için oryantasyon programı hazırlanması",
      priority: "high",
      status: "in_progress",
      assignedTo: "Mehmet Yılmaz",
      dueDate: "2025-01-15",
      createdAt: "2025-01-05",
    },
    {
      id: 2,
      title: "Vardiya değişiklik sürecini güncelle",
      description: "Vardiya değişim taleplerinin işlenmesi için yeni prosedür oluştur",
      priority: "medium",
      status: "todo",
      assignedTo: "Ayşe Kaya",
      dueDate: "2025-01-20",
      createdAt: "2025-01-04",
    },
    {
      id: 3,
      title: "QR kod sistemi bakımı",
      description: "QR kod okuyucularının düzenli bakım ve kontrol işlemleri",
      priority: "low",
      status: "completed",
      assignedTo: "Emre Özkan",
      dueDate: "2025-01-08",
      createdAt: "2025-01-03",
    },
  ];

  const filteredTasks = mockTasks.filter(task => 
    filterStatus === "all" || task.status === filterStatus
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return "secondary";
      case "in_progress":
        return "default";
      case "completed":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "todo":
        return "Yapılacak";
      case "in_progress":
        return "Devam Ediyor";
      case "completed":
        return "Tamamlandı";
      default:
        return status;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "Yüksek";
      case "medium":
        return "Orta";
      case "low":
        return "Düşük";
      default:
        return priority;
    }
  };

  const handleSubmit = (data: z.infer<typeof taskFormSchema>) => {
    // TODO: Implement task creation/update API call
    toast({
      title: "Başarılı",
      description: editingTask ? "Görev güncellendi" : "Yeni görev oluşturuldu",
    });
    setDialogOpen(false);
    form.reset();
  };

  const handleEdit = (task: any) => {
    setEditingTask(task);
    form.reset({
      title: task.title,
      description: task.description,
      priority: task.priority,
      assignedTo: task.assignedTo,
      dueDate: task.dueDate,
      status: task.status,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Bu görevi silmek istediğinizden emin misiniz?")) {
      toast({
        title: "Başarılı",
        description: "Görev silindi",
      });
    }
  };

  const handleNewTask = () => {
    setEditingTask(null);
    form.reset();
    setDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">İş Takip Sistemi</h1>
          <p className="text-gray-600">Görevleri yönet ve takip et</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewTask} className="bg-primary hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Görev
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTask ? "Görev Düzenle" : "Yeni Görev Oluştur"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Görev Başlığı</FormLabel>
                      <FormControl>
                        <Input placeholder="Görev başlığını girin" {...field} />
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
                        <Textarea placeholder="Görev detaylarını açıklayın" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Öncelik</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="high">Yüksek</SelectItem>
                            <SelectItem value="medium">Orta</SelectItem>
                            <SelectItem value="low">Düşük</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bitiş Tarihi</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Atanan Kişi</FormLabel>
                      <FormControl>
                        <Input placeholder="Görevi yapacak kişi" {...field} />
                      </FormControl>
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
                  <Button type="submit">
                    {editingTask ? "Güncelle" : "Oluştur"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Durum:</span>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="todo">Yapılacak</SelectItem>
                  <SelectItem value="in_progress">Devam Ediyor</SelectItem>
                  <SelectItem value="completed">Tamamlandı</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <span>Yüksek Öncelik</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <span>Orta Öncelik</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span>Düşük Öncelik</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ListTodo className="w-5 h-5 mr-2" />
            Görev Listesi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Görev</TableHead>
                <TableHead>Öncelik</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Atanan</TableHead>
                <TableHead>Bitiş Tarihi</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-gray-600">{task.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {getPriorityLabel(task.priority)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(task.status)}>
                      {getStatusLabel(task.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{task.assignedTo}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">
                        {new Date(task.dueDate).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(task)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(task.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}