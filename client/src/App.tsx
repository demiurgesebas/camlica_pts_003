import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { AuthProvider } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Personnel from "@/pages/personnel";
import Shifts from "@/pages/shifts";
import LeaveManagement from "@/pages/leave-management";
import QRManagement from "@/pages/qr-management";
import Tasks from "@/pages/tasks";
import Notifications from "@/pages/notifications";
import Reports from "@/pages/reports";
import Branches from "@/pages/branches";
import Departments from "@/pages/departments";
import Teams from "@/pages/teams";
import Settings from "@/pages/settings";
import Attendance from "@/pages/attendance";
import UserManagement from "@/pages/user-management";
import { QRDisplayPage } from "@/pages/qr-display";
import Layout from "@/components/layout/layout";
import { useEffect } from "react";
import { auth } from "@/lib/firebase";

function LogIdToken() {
  useEffect(() => {
    if (auth.currentUser) {
      auth.currentUser.getIdToken().then(token => {
        console.log("FIREBASE_ID_TOKEN:", token);
      });
    } else {
      console.log("Kullanıcı giriş yapmamış.");
    }
  }, []);
  return null;
}

function AppRouter() {
  const { isAuthenticated, isLoading, canAccessAdmin, isSuperAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      {/* QR Display pages - no authentication required */}
      <Route path="/qr-display" component={QRDisplayPage} />
      <Route path="/qr-display/:screenId" component={QRDisplayPage} />
      
      {!isAuthenticated ? (
        <>
          <Route path="/login" component={Login} />
          <Route path="/" component={Login} />
        </>
      ) : (
        <Layout>
          <Route path="/" component={Dashboard} />
          <Route path="/leave-management" component={LeaveManagement} />
          <Route path="/tasks" component={Tasks} />
          <Route path="/attendance" component={Attendance} />
          <Route path="/notifications" component={Notifications} />
          
          {/* Admin only routes */}
          {canAccessAdmin() && (
            <>
              <Route path="/personnel" component={Personnel} />
              <Route path="/shifts" component={Shifts} />
              <Route path="/qr-management" component={QRManagement} />
              <Route path="/reports" component={Reports} />
              <Route path="/branches" component={Branches} />
              <Route path="/departments" component={Departments} />
              <Route path="/teams" component={Teams} />
              <Route path="/settings" component={Settings} />
            </>
          )}

          {/* Super Admin only routes */}
          {isSuperAdmin() && (
            <>
              <Route path="/user-management" component={UserManagement} />
            </>
          )}
        </Layout>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <>
      <LogIdToken />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <AppRouter />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </>
  );
}

export default App;
