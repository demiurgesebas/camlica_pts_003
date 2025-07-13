import { createContext, useContext, useEffect, useState } from "react";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";

interface AuthContextType {
  user: any;
  firebaseUser: any;
  loading: boolean;
  error: string | null;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const { 
    user: firebaseUser, 
    loading: firebaseLoading, 
    logout: firebaseLogout 
  } = useFirebaseAuth();

  // Debug: Log Firebase user state
  useEffect(() => {
    console.log('Firebase user state:', firebaseUser ? 'authenticated' : 'not authenticated');
    if (firebaseUser) {
      console.log('Firebase user details:', {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        hasGetIdToken: typeof firebaseUser.getIdToken === 'function'
      });
    }
  }, [firebaseUser]);

  // Fetch user profile from our backend when Firebase user changes
  useEffect(() => {
    const fetchUserProfile = async () => {
      // Check if we're in logout process
      const isLoggingOut = sessionStorage.getItem('isLoggingOut') === 'true';
      
      if (!firebaseUser || isLoggingOut) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Wait for Firebase user to be fully loaded
        if (!firebaseUser.uid) {
          console.log('Firebase user has no uid, skipping...');
          setLoading(false);
          return;
        }
        
        console.log('Starting user profile fetch for uid:', firebaseUser.uid);
        
        // Get Firebase ID token from auth current user
        const currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error('No current user');
        }
        
        const idToken = await currentUser.getIdToken();
        console.log('Fetching user profile with token... Token length:', idToken.length);
        
        const response = await fetch("/api/auth/user", {
          headers: {
            "Authorization": `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.log('Error response:', errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('User profile received:', data);
        setUser(data.user);
        setError(null);
      } catch (error: any) {
        console.error("Error fetching user profile:", error);
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        setError(error.message);
        // Don't toast here to avoid spam
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [firebaseUser]);

  const refreshUser = async () => {
    if (!firebaseUser) return;
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No current user');
      }
      
      // Force refresh Firebase token to get latest claims
      const idToken = await currentUser.getIdToken(true);
      
      const response = await fetch("/api/auth/user", {
        headers: {
          "Authorization": `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setUser(data.user);
      setError(null);
      
      console.log('User profile refreshed:', data.user);
    } catch (error: any) {
      console.error("Error refreshing user profile:", error);
      setError(error.message);
    }
  };

  const logout = async () => {
    try {
      console.log('AuthContext logout starting...');
      
      // Mark as logging out to prevent re-authentication
      sessionStorage.setItem('isLoggingOut', 'true');
      
      // Clear user state immediately
      setUser(null);
      setError(null);
      setLoading(false);
      
      // Clear localStorage (but keep sessionStorage flag)
      localStorage.clear();
      
      // Call Firebase logout
      await firebaseLogout();
      
      console.log('AuthContext logout completed');
      
      // Force immediate redirect to prevent re-authentication
      setTimeout(() => {
        sessionStorage.removeItem('isLoggingOut');
        window.location.href = "/login";
      }, 500);
    } catch (error: any) {
      console.error("Error during logout:", error);
      
      // Clear everything even on error
      setUser(null);
      setError(null);
      setLoading(false);
      localStorage.clear();
      
      // Force redirect even on error
      setTimeout(() => {
        sessionStorage.removeItem('isLoggingOut');
        window.location.href = "/login";
      }, 500);
    }
  };

  const contextValue: AuthContextType = {
    user,
    firebaseUser,
    loading: loading || firebaseLoading,
    error,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};