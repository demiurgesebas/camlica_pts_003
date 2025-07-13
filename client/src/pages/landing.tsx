import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, Calendar, QrCode, Bell, BarChart3, LogIn } from "lucide-react";
import { Link } from "wouter";

export default function Landing() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Users className="h-12 w-12 text-primary mr-4" />
            <h1 className="text-4xl font-bold text-gray-900">Çamlıca Personel Takip Sistemi</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Modern ve kullanıcı dostu arayüzü ile personel yönetimi, vardiya planlama ve devam takibi için kapsamlı çözüm
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle>Vardiya Yönetimi</CardTitle>
              <CardDescription>
                Esnek vardiya planlama ve gerçek zamanlı takip
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Calendar className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle>İzin Yönetimi</CardTitle>
              <CardDescription>
                Kolay izin talep sistemi ve onay süreçleri
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <QrCode className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle>QR Kod Takibi</CardTitle>
              <CardDescription>
                Güvenli ve hızlı giriş-çıkış kayıt sistemi
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Bildirim Sistemi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-600">
                <li>• Anlık bildirimler ve uyarılar</li>
                <li>• SMS ve e-posta entegrasyonu</li>
                <li>• Özelleştirilebilir bildirim türleri</li>
                <li>• Acil durum bildirimleri</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Raporlama ve Analiz
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-600">
                <li>• Detaylı devam raporları</li>
                <li>• Grafik ve istatistikler</li>
                <li>• Excel/PDF çıktıları</li>
                <li>• Özelleştirilebilir filtreler</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-primary text-white">
          <CardContent className="text-center py-12">
            <h2 className="text-3xl font-bold mb-4">Hemen Başlayın</h2>
            <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
              Personel takip sisteminizi modernize edin ve yönetim süreçlerinizi kolaylaştırın
            </p>
            <Link href="/login">
              <Button 
                size="lg" 
                variant="secondary"
                className="bg-white text-primary hover:bg-gray-100"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Giriş Yap
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
