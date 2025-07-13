import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Lock, Mail, LogIn, Chrome, Phone, MessageCircle } from "lucide-react";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [showVerificationCode, setShowVerificationCode] = useState(false);
  const { toast } = useToast();
  const { 
    signIn, 
    signUp, 
    signInWithGoogle, 
    loading, 
    sendPhoneVerification,
    verifyPhoneCode,
    setupRecaptcha 
  } = useFirebaseAuth();

  // Clear logout flag when login page loads
  useEffect(() => {
    sessionStorage.removeItem('isLoggingOut');
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("E-posta ve şifre gereklidir");
      return;
    }

    try {
      if (isSignUp) {
        await signUp(email, password, displayName);
      } else {
        await signIn(email, password);
      }
      setLocation("/");
    } catch (error: any) {
      setError(error.message || "İşlem başarısız");
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      setLocation("/");
    } catch (error: any) {
      setError(error.message || "Google ile giriş başarısız");
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!phoneNumber) {
      setError("Telefon numarası gereklidir");
      return;
    }

    try {
      const recaptchaVerifier = setupRecaptcha('recaptcha-container');
      const confirmationResult = await sendPhoneVerification(phoneNumber, recaptchaVerifier);
      setConfirmationResult(confirmationResult);
      setShowVerificationCode(true);
      toast({
        title: "Doğrulama Kodu Gönderildi",
        description: "Telefon numaranıza gönderilen kodu girin",
      });
    } catch (error: any) {
      setError(error.message || "Telefon doğrulama başarısız");
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!verificationCode) {
      setError("Doğrulama kodu gereklidir");
      return;
    }

    try {
      await verifyPhoneCode(confirmationResult, verificationCode);
      setLocation("/");
    } catch (error: any) {
      setError(error.message || "Doğrulama kodu hatalı");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Çamlıca Personel Takip Sistemi</CardTitle>
            <CardDescription>Hesabınıza giriş yapın</CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="email">
                <Mail className="w-4 h-4 mr-2" />
                E-posta
              </TabsTrigger>
              <TabsTrigger value="phone">
                <Phone className="w-4 h-4 mr-2" />
                Telefon
              </TabsTrigger>
              <TabsTrigger value="google">
                <Chrome className="w-4 h-4 mr-2" />
                Google
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="email" className="space-y-4">
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Ad Soyad</Label>
                    <Input
                      id="displayName"
                      type="text"
                      placeholder="Ad ve soyadınızı girin"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">E-posta</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="E-posta adresinizi girin"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Şifre</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Şifrenizi girin"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? (
                    isSignUp ? "Hesap oluşturuluyor..." : "Giriş yapılıyor..."
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      {isSignUp ? "Hesap Oluştur" : "Giriş Yap"}
                    </>
                  )}
                </Button>
              </form>
              
              <div className="mt-4 text-center">
                <Button 
                  variant="link" 
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm"
                >
                  {isSignUp ? "Zaten hesabınız var mı? Giriş yapın" : "Hesabınız yok mu? Kayıt olun"}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="phone" className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {!showVerificationCode ? (
                <form onSubmit={handlePhoneSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon Numarası</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+90 555 123 45 67"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="pl-10"
                        disabled={loading}
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      "Kod Gönderiliyor..."
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Doğrulama Kodu Gönder
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerificationSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Doğrulama Kodu</Label>
                    <div className="relative">
                      <MessageCircle className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="code"
                        type="text"
                        placeholder="6 haneli kod"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="pl-10"
                        maxLength={6}
                        disabled={loading}
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      "Doğrulanıyor..."
                    ) : (
                      <>
                        <LogIn className="w-4 h-4 mr-2" />
                        Doğrula ve Giriş Yap
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowVerificationCode(false)}
                    className="w-full"
                    disabled={loading}
                  >
                    Geri Dön
                  </Button>
                </form>
              )}
            </TabsContent>
            
            <TabsContent value="google" className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full"
                disabled={loading}
              >
                <Chrome className="w-4 h-4 mr-2" />
                Google ile Giriş Yap
              </Button>
            </TabsContent>
          </Tabs>
          
          <div id="recaptcha-container" className="mt-4"></div>
        </CardContent>
      </Card>
    </div>
  );
}