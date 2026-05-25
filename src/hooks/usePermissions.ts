import { useAuth } from './useAuth';
import { ROLE_PERMISSIONS } from '../constants';
import { UserRole } from '../types';

export function usePermissions() {
  const { member, isAdminAccount, committee, user } = useAuth();

  const role: UserRole = isAdminAccount ? 'ADMIN' : (member?.role || 'MEMBER');
  const permissions = ROLE_PERMISSIONS[role];

  return {
    role,
    isAdmin: isAdminAccount,
    canView: permissions.canView && !!committee && !!user,
    canEdit: permissions.canEditModules.length > 0,
    canDelete: permissions.canDelete,
    canApprove: permissions.canApprove,
    canBroadcast: permissions.canBroadcast,
    allowedModules: permissions.canEditModules,
    committeeId: committee?.committeeId,
    committeeName: committee?.name,
    hasModuleAccess: (module: string) => {
      if (isAdminAccount || role === 'SECRETARY' || role === 'JOINT_SECRETARY') return true;
      return permissions.canEditModules.includes(module);
    }
  };
}
