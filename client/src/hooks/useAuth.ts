import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import type { MenuPermission } from "@shared/menuPermissions";

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  const { user, loading, error, logout, refreshUser } = context;

  const hasRole = (role: string) => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: string[]) => {
    return user?.role && roles.includes(user.role);
  };

  const hasPermission = (permission: MenuPermission | string) => {
    if (!user?.permissions) return false;
    return user.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: (MenuPermission | string)[]) => {
    if (!user?.permissions) return false;
    return permissions.some(permission => user.permissions.includes(permission));
  };

  const isPersonnel = () => hasRole('personnel');
  const isAdmin = () => hasRole('admin');
  const isSuperAdmin = () => hasRole('super_admin');
  const canAccessAdmin = () => hasAnyRole(['admin', 'super_admin']);

  return {
    user,
    isLoading: loading,
    isAuthenticated: !!user,
    error,
    logout,
    refreshUser,
    hasRole,
    hasAnyRole,
    hasPermission,
    hasAnyPermission,
    isPersonnel,
    isAdmin,
    isSuperAdmin,
    canAccessAdmin,
  };
}
