import { useState, useEffect } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword as firebaseUpdatePassword,
  PhoneAuthProvider,
  signInWithCredential,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

interface AuthState {
  user: FirebaseUser | null;
  loading: boolean;
  error: string | null;
}

export const useFirebaseAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Check if we're in the middle of logout process
      const isLoggingOut = sessionStorage.getItem('isLoggingOut') === 'true';
      
      if (user && !isLoggingOut) {
        setAuthState({
          user: {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            emailVerified: user.emailVerified,
          },
          loading: false,
          error: null,
        });
      } else {
        setAuthState({
          user: null,
          loading: false,
          error: null,
        });
      }
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      toast({
        title: "Giriş Başarılı",
        description: "Hoş geldiniz!",
      });
      
      return userCredential.user;
    } catch (error: any) {
      let errorMessage = "Giriş yapılırken bir hata oluştu";
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = "Bu email adresi ile kayıtlı kullanıcı bulunamadı";
          break;
        case 'auth/wrong-password':
          errorMessage = "Şifre yanlış";
          break;
        case 'auth/invalid-email':
          errorMessage = "Geçersiz email adresi";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Çok fazla başarısız giriş denemesi. Lütfen daha sonra tekrar deneyin";
          break;
        case 'auth/network-request-failed':
          errorMessage = "Ağ bağlantısı hatası. İnternet bağlantınızı kontrol edin";
          break;
      }
      
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
      
      toast({
        title: "Giriş Hatası",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update user profile with display name if provided
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }
      
      toast({
        title: "Kayıt Başarılı",
        description: "Hesabınız başarıyla oluşturuldu",
      });
      
      return userCredential.user;
    } catch (error: any) {
      let errorMessage = "Kayıt olurken bir hata oluştu";
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = "Bu email adresi zaten kullanımda";
          break;
        case 'auth/invalid-email':
          errorMessage = "Geçersiz email adresi";
          break;
        case 'auth/operation-not-allowed':
          errorMessage = "Email/şifre girişi devre dışı";
          break;
        case 'auth/weak-password':
          errorMessage = "Şifre çok zayıf. En az 6 karakter olmalıdır";
          break;
      }
      
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
      
      toast({
        title: "Kayıt Hatası",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      
      toast({
        title: "Google ile Giriş Başarılı",
        description: "Hoş geldiniz!",
      });
      
      return result.user;
    } catch (error: any) {
      let errorMessage = "Google ile giriş yapılırken bir hata oluştu";
      
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = "Giriş penceresi kapatıldı";
          break;
        case 'auth/popup-blocked':
          errorMessage = "Popup engellenmiş. Lütfen popup engelleyicisini devre dışı bırakın";
          break;
        case 'auth/cancelled-popup-request':
          errorMessage = "Giriş işlemi iptal edildi";
          break;
      }
      
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
      
      toast({
        title: "Google Giriş Hatası",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('Firebase logout starting...');
      
      // Mark that we're logging out to prevent re-authentication
      sessionStorage.setItem('isLoggingOut', 'true');
      
      // Clear state before logout
      setAuthState({
        user: null,
        loading: false,
        error: null
      });
      
      // Clear all storage
      localStorage.clear();
      
      // Firebase logout
      await signOut(auth);
      console.log('Firebase logout completed');
      
      toast({
        title: "Çıkış Başarılı",
        description: "Güvenli bir şekilde çıkış yaptınız",
      });
    } catch (error) {
      console.error('Logout error:', error);
      
      // Clear state even on error
      setAuthState({
        user: null,
        loading: false,
        error: null
      });
      
      toast({
        title: "Çıkış Hatası",
        description: "Çıkış yapılırken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      
      toast({
        title: "Şifre Sıfırlama",
        description: "Şifre sıfırlama linki email adresinize gönderildi",
      });
    } catch (error: any) {
      let errorMessage = "Şifre sıfırlama emaili gönderilemedi";
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = "Bu email adresi ile kayıtlı kullanıcı bulunamadı";
          break;
        case 'auth/invalid-email':
          errorMessage = "Geçersiz email adresi";
          break;
      }
      
      toast({
        title: "Şifre Sıfırlama Hatası",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    try {
      if (!auth.currentUser) {
        throw new Error('No authenticated user');
      }

      // Re-authenticate user before password change
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email!,
        currentPassword
      );
      
      await reauthenticateWithCredential(auth.currentUser, credential);
      await firebaseUpdatePassword(auth.currentUser, newPassword);
      
      toast({
        title: "Şifre Güncellendi",
        description: "Şifreniz başarıyla güncellendi",
      });
    } catch (error: any) {
      let errorMessage = "Şifre güncellenirken bir hata oluştu";
      
      switch (error.code) {
        case 'auth/wrong-password':
          errorMessage = "Mevcut şifre yanlış";
          break;
        case 'auth/weak-password':
          errorMessage = "Yeni şifre çok zayıf. En az 6 karakter olmalıdır";
          break;
        case 'auth/requires-recent-login':
          errorMessage = "Güvenlik nedeniyle yeniden giriş yapmanız gerekiyor";
          break;
      }
      
      toast({
        title: "Şifre Güncelleme Hatası",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    }
  };

  const updateDisplayName = async (displayName: string) => {
    try {
      if (!auth.currentUser) {
        throw new Error('No authenticated user');
      }

      await updateProfile(auth.currentUser, { displayName });
      
      toast({
        title: "Profil Güncellendi",
        description: "Adınız başarıyla güncellendi",
      });
    } catch (error) {
      toast({
        title: "Profil Güncelleme Hatası",
        description: "Profil güncellenirken bir hata oluştu",
        variant: "destructive",
      });
      
      throw error;
    }
  };

  const getIdToken = async () => {
    if (!auth.currentUser) {
      throw new Error('No authenticated user');
    }
    
    return await auth.currentUser.getIdToken();
  };

  const sendPhoneVerification = async (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier): Promise<ConfirmationResult> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      
      setAuthState(prev => ({ ...prev, loading: false }));
      return confirmationResult;
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  const verifyPhoneCode = async (confirmationResult: ConfirmationResult, code: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await confirmationResult.confirm(code);
      
      setAuthState(prev => ({ ...prev, loading: false }));
      return result;
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  const setupRecaptcha = (elementId: string): RecaptchaVerifier => {
    return new RecaptchaVerifier(auth, elementId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved, allow signInWithPhoneNumber
      },
      'expired-callback': () => {
        // Response expired
      }
    });
  };

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    resetPassword,
    updatePassword,
    updateDisplayName,
    getIdToken,
    sendPhoneVerification,
    verifyPhoneCode,
    setupRecaptcha,
  };
};