import { adminDb } from './firebase';
import { Timestamp } from 'firebase-admin/firestore';

// Firebase collection names
const COLLECTIONS = {
  USERS: 'users',
  BRANCHES: 'branches',
  PERSONNEL: 'personnel',
  DEPARTMENTS: 'departments',
  TEAMS: 'teams',
  SHIFTS: 'shifts',
  SHIFT_ASSIGNMENTS: 'shiftAssignments',
  LEAVE_REQUESTS: 'leaveRequests',
  QR_CODES: 'qrCodes',
  QR_SCREENS: 'qrScreens',
  ATTENDANCE_RECORDS: 'attendanceRecords',
  NOTIFICATIONS: 'notifications',
  PERSONNEL_DOCUMENTS: 'personnelDocuments',
  SYSTEM_SETTINGS: 'systemSettings',
};

// Firebase Storage Implementation
export class FirebaseStorage {
  private db = adminDb;

  // Helper function to convert Firestore timestamp to date
  private convertTimestamp(timestamp: any): Date {
    if (!timestamp) return new Date();
    return timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  }

  // Helper function to convert date to Firestore timestamp
  private toFirestoreTimestamp(date: Date | string) {
    if (typeof date === 'string') {
      return new Date(date);
    }
    return date;
  }

  // User operations
  async getUser(id: string) {
    try {
      const userDoc = await this.db.collection(COLLECTIONS.USERS).doc(id).get();
      if (!userDoc.exists) return undefined;
      
      const data = userDoc.data();
      return {
        id: userDoc.id,
        ...data,
        createdAt: this.convertTimestamp(data?.createdAt),
        updatedAt: this.convertTimestamp(data?.updatedAt),
        lastLogin: this.convertTimestamp(data?.lastLogin),
      };
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  async upsertUser(userData: any) {
    try {
      const userRef = this.db.collection(COLLECTIONS.USERS).doc(userData.id);
      const userDoc = await userRef.get();
      
      const now = new Date();
      
      // Remove undefined values to avoid Firestore errors
      const cleanedUserData = Object.fromEntries(
        Object.entries(userData).filter(([_, value]) => value !== undefined)
      );
      
      const userDataWithTimestamp = {
        ...cleanedUserData,
        updatedAt: now,
        ...(userDoc.exists ? {} : { createdAt: now }),
      };

      await userRef.set(userDataWithTimestamp, { merge: true });
      
      // Return the updated user
      return {
        id: userData.id,
        ...userDataWithTimestamp,
        createdAt: this.convertTimestamp(userDataWithTimestamp.createdAt),
        updatedAt: this.convertTimestamp(userDataWithTimestamp.updatedAt),
      };
    } catch (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
  }

  async getAllUsers() {
    try {
      const usersSnapshot = await this.db.collection(COLLECTIONS.USERS).get();
      return usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: this.convertTimestamp(doc.data().createdAt),
        updatedAt: this.convertTimestamp(doc.data().updatedAt),
        lastLogin: this.convertTimestamp(doc.data().lastLogin),
      }));
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  async updateUserRole(id: string, role: string) {
    try {
      const userRef = this.db.collection(COLLECTIONS.USERS).doc(id);
      await userRef.update({
        role,
        updatedAt: new Date(),
      });
      
      return await this.getUser(id);
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  async updateUserPermissions(id: string, permissions: string[]) {
    try {
      const userRef = this.db.collection(COLLECTIONS.USERS).doc(id);
      await userRef.update({
        permissions,
        updatedAt: new Date(),
      });
      
      return await this.getUser(id);
    } catch (error) {
      console.error('Error updating user permissions:', error);
      throw error;
    }
  }

  async updateUserStatus(id: string, isActive: boolean) {
    try {
      const userRef = this.db.collection(COLLECTIONS.USERS).doc(id);
      await userRef.update({
        isActive,
        updatedAt: new Date(),
      });
      
      return await this.getUser(id);
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  async updateUserPassword(id: string, password: string) {
    try {
      const userRef = this.db.collection(COLLECTIONS.USERS).doc(id);
      await userRef.update({
        password,
        updatedAt: new Date(),
      });
      
      return await this.getUser(id);
    } catch (error) {
      console.error('Error updating user password:', error);
      throw error;
    }
  }

  async deleteUser(id: string) {
    try {
      await this.db.collection(COLLECTIONS.USERS).doc(id).delete();
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  async createUserByAdmin(userData: any) {
    try {
      const userRef = this.db.collection(COLLECTIONS.USERS).doc();
      const now = new Date();
      
      const userDataWithTimestamp = {
        ...userData,
        createdAt: now,
        updatedAt: now,
        isActive: true,
      };

      await userRef.set(userDataWithTimestamp);
      
      return {
        id: userRef.id,
        ...userDataWithTimestamp,
        createdAt: this.convertTimestamp(userDataWithTimestamp.createdAt),
        updatedAt: this.convertTimestamp(userDataWithTimestamp.updatedAt),
      };
    } catch (error) {
      console.error('Error creating user by admin:', error);
      throw error;
    }
  }

  async getUserByCredentials(username: string, password: string) {
    try {
      const usersQuery = query(
        this.db.collection(COLLECTIONS.USERS),
        where('username', '==', username),
        where('password', '==', password),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await usersQuery.get();
      
      if (querySnapshot.empty) {
        return undefined;
      }
      
      const userDoc = querySnapshot.docs[0];
      return {
        id: userDoc.id,
        ...userDoc.data(),
        createdAt: this.convertTimestamp(userDoc.data().createdAt),
        updatedAt: this.convertTimestamp(userDoc.data().updatedAt),
        lastLogin: this.convertTimestamp(userDoc.data().lastLogin),
      };
    } catch (error) {
      console.error('Error getting user by credentials:', error);
      throw error;
    }
  }

  // Branch operations
  async getBranches() {
    try {
      const branchesSnapshot = await this.db.collection(COLLECTIONS.BRANCHES).get();
      return branchesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: this.convertTimestamp(doc.data().createdAt),
        updatedAt: this.convertTimestamp(doc.data().updatedAt),
      }));
    } catch (error) {
      console.error('Error getting branches:', error);
      throw error;
    }
  }

  async getBranchById(id: string) {
    try {
      const branchDoc = await this.db.collection(COLLECTIONS.BRANCHES).doc(id).get();
      if (!branchDoc.exists) return undefined;
      
      const data = branchDoc.data();
      return {
        id: branchDoc.id,
        ...data,
        createdAt: this.convertTimestamp(data?.createdAt),
        updatedAt: this.convertTimestamp(data?.updatedAt),
      };
    } catch (error) {
      console.error('Error getting branch by ID:', error);
      throw error;
    }
  }

  async getBranchesByManagerId(managerId: string) {
    try {
      const branchesQuery = query(
        this.db.collection(COLLECTIONS.BRANCHES),
        where('managerId', '==', managerId)
      );
      
      const querySnapshot = await branchesQuery.get();
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: this.convertTimestamp(doc.data().createdAt),
        updatedAt: this.convertTimestamp(doc.data().updatedAt),
      }));
    } catch (error) {
      console.error('Error getting branches by manager ID:', error);
      throw error;
    }
  }

  async createBranch(branchData: any) {
    try {
      const branchRef = this.db.collection(COLLECTIONS.BRANCHES).doc();
      const now = new Date();
      
      const branchDataWithTimestamp = {
        ...branchData,
        createdAt: now,
        updatedAt: now,
        isActive: true,
      };

      await branchRef.set(branchDataWithTimestamp);
      
      return {
        id: branchRef.id,
        ...branchDataWithTimestamp,
        createdAt: this.convertTimestamp(branchDataWithTimestamp.createdAt),
        updatedAt: this.convertTimestamp(branchDataWithTimestamp.updatedAt),
      };
    } catch (error) {
      console.error('Error creating branch:', error);
      throw error;
    }
  }

  async updateBranch(id: string, branchData: any) {
    try {
      const branchRef = this.db.collection(COLLECTIONS.BRANCHES).doc(id);
      await branchRef.update({
        ...branchData,
        updatedAt: new Date(),
      });
      
      return await this.getBranchById(id);
    } catch (error) {
      console.error('Error updating branch:', error);
      throw error;
    }
  }

  async deleteBranch(id: string) {
    try {
      await this.db.collection(COLLECTIONS.BRANCHES).doc(id).delete();
    } catch (error) {
      console.error('Error deleting branch:', error);
      throw error;
    }
  }

  // System settings operations
  async getSystemSettings() {
    try {
      const settingsSnapshot = await this.db.collection(COLLECTIONS.SYSTEM_SETTINGS).get();
      return settingsSnapshot.docs.map(doc => ({
        key: doc.id,
        ...doc.data(),
        updatedAt: this.convertTimestamp(doc.data().updatedAt),
      }));
    } catch (error) {
      console.error('Error getting system settings:', error);
      throw error;
    }
  }

  async getSystemSetting(key: string) {
    try {
      const settingDoc = await this.db.collection(COLLECTIONS.SYSTEM_SETTINGS).doc(key).get();
      if (!settingDoc.exists) return undefined;
      
      const data = settingDoc.data();
      return {
        key: settingDoc.id,
        ...data,
        updatedAt: this.convertTimestamp(data?.updatedAt),
      };
    } catch (error) {
      console.error('Error getting system setting:', error);
      throw error;
    }
  }

  async upsertSystemSetting(settingData: any) {
    try {
      const settingRef = this.db.collection(COLLECTIONS.SYSTEM_SETTINGS).doc(settingData.key);
      const settingDoc = await settingRef.get();
      
      const now = new Date();
      const settingDataWithTimestamp = {
        ...settingData,
        updatedAt: now,
        ...(settingDoc.exists ? {} : { createdAt: now }),
      };

      await settingRef.set(settingDataWithTimestamp, { merge: true });
      
      return {
        key: settingData.key,
        ...settingDataWithTimestamp,
        updatedAt: this.convertTimestamp(settingDataWithTimestamp.updatedAt),
      };
    } catch (error) {
      console.error('Error upserting system setting:', error);
      throw error;
    }
  }

  async deleteSystemSetting(key: string) {
    try {
      await this.db.collection(COLLECTIONS.SYSTEM_SETTINGS).doc(key).delete();
    } catch (error) {
      console.error('Error deleting system setting:', error);
      throw error;
    }
  }

  // Shift Assignment operations
  async getShiftAssignments() {
    try {
      const assignmentsSnapshot = await this.db.collection(COLLECTIONS.SHIFT_ASSIGNMENTS).get();
      return assignmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: this.convertTimestamp(doc.data().createdAt),
        updatedAt: this.convertTimestamp(doc.data().updatedAt),
        assignedDate: doc.data().assignedDate,
        date: doc.data().date,
      }));
    } catch (error) {
      console.error('Error getting shift assignments:', error);
      throw error;
    }
  }

  async createShiftAssignment(assignmentData: any) {
    try {
      const now = new Date();
      const cleanedData = Object.fromEntries(
        Object.entries(assignmentData).filter(([_, value]) => value !== undefined)
      );
      
      const assignmentWithTimestamp = {
        ...cleanedData,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await this.db.collection(COLLECTIONS.SHIFT_ASSIGNMENTS).add(assignmentWithTimestamp);
      
      return {
        id: docRef.id,
        ...assignmentWithTimestamp,
        createdAt: this.convertTimestamp(assignmentWithTimestamp.createdAt),
        updatedAt: this.convertTimestamp(assignmentWithTimestamp.updatedAt),
      };
    } catch (error) {
      console.error('Error creating shift assignment:', error);
      throw error;
    }
  }

  async deleteShiftAssignment(id: string) {
    try {
      await this.db.collection(COLLECTIONS.SHIFT_ASSIGNMENTS).doc(id).delete();
    } catch (error) {
      console.error('Error deleting shift assignment:', error);
      throw error;
    }
  }

  async getShiftAssignmentsByDate(date: string) {
    try {
      const assignmentsSnapshot = await this.db.collection(COLLECTIONS.SHIFT_ASSIGNMENTS)
        .where('date', '==', date)
        .get();
      return assignmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: this.convertTimestamp(doc.data().createdAt),
        updatedAt: this.convertTimestamp(doc.data().updatedAt),
      }));
    } catch (error) {
      console.error('Error getting shift assignments by date:', error);
      throw error;
    }
  }

  async getShiftAssignmentsByPersonnelId(personnelId: string | number) {
    try {
      // Convert personnel ID to string for Firebase query
      const personnelIdStr = personnelId.toString();
      const assignmentsSnapshot = await this.db.collection(COLLECTIONS.SHIFT_ASSIGNMENTS)
        .where('personnelId', '==', personnelIdStr)
        .get();
      return assignmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: this.convertTimestamp(doc.data().createdAt),
        updatedAt: this.convertTimestamp(doc.data().updatedAt),
      }));
    } catch (error) {
      console.error('Error getting shift assignments by personnel ID:', error);
      throw error;
    }
  }

  // Dashboard statistics
  async getDashboardStats() {
    try {
      // Get all personnel count
      const personnelSnapshot = await this.db.collection(COLLECTIONS.PERSONNEL).get();
      const totalPersonnel = personnelSnapshot.docs.filter(doc => doc.data().isActive).length;

      // Get today's attendance
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      const attendanceSnapshot = await this.db.collection(COLLECTIONS.ATTENDANCE_RECORDS)
        .where('date', '>=', Timestamp.fromDate(today))
        .where('date', '<=', Timestamp.fromDate(todayEnd))
        .get();
      const workingToday = attendanceSnapshot.docs.filter(doc => doc.data().status === 'present').length;
      const lateArrivals = attendanceSnapshot.docs.filter(doc => doc.data().status === 'late').length;
      const todayQrScans = attendanceSnapshot.docs.length;

      // Get pending leave requests
      const pendingLeaveSnapshot = await this.db.collection(COLLECTIONS.LEAVE_REQUESTS)
        .where('status', '==', 'pending')
        .get();
      const pendingLeaveRequests = pendingLeaveSnapshot.docs.length;

      // Calculate on leave today
      const onLeaveSnapshot = await this.db.collection(COLLECTIONS.LEAVE_REQUESTS)
        .where('status', '==', 'approved')
        .where('startDate', '<=', Timestamp.fromDate(today))
        .where('endDate', '>=', Timestamp.fromDate(today))
        .get();
      const onLeave = onLeaveSnapshot.docs.length;

      return {
        totalPersonnel,
        workingToday,
        onLeave,
        lateArrivals,
        todayQrScans,
        pendingLeaveRequests,
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  }

  // QR Screen operations
  async getQrScreens() {
    try {
      const screensSnapshot = await this.db.collection(COLLECTIONS.QR_SCREENS).get();
      return screensSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: this.convertTimestamp(doc.data().createdAt),
        updatedAt: this.convertTimestamp(doc.data().updatedAt),
        lastActivity: this.convertTimestamp(doc.data().lastActivity),
      }));
    } catch (error) {
      console.error('Error getting QR screens:', error);
      throw error;
    }
  }

  async getQrScreenByScreenId(screenId: string) {
    try {
      const screensSnapshot = await this.db.collection(COLLECTIONS.QR_SCREENS)
        .where('screenId', '==', screenId)
        .get();
      
      if (screensSnapshot.empty) return undefined;
      
      const doc = screensSnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: this.convertTimestamp(doc.data().createdAt),
        updatedAt: this.convertTimestamp(doc.data().updatedAt),
        lastActivity: this.convertTimestamp(doc.data().lastActivity),
      };
    } catch (error) {
      console.error('Error getting QR screen by screenId:', error);
      throw error;
    }
  }

  async createQrScreen(screenData: any) {
    try {
      const now = new Date();
      const cleanedData = Object.fromEntries(
        Object.entries(screenData).filter(([_, value]) => value !== undefined)
      );
      
      const screenWithTimestamp = {
        ...cleanedData,
        createdAt: now,
        updatedAt: now,
        lastActivity: now,
      };

      const docRef = await this.db.collection(COLLECTIONS.QR_SCREENS).add(screenWithTimestamp);
      
      return {
        id: docRef.id,
        ...screenWithTimestamp,
        createdAt: this.convertTimestamp(screenWithTimestamp.createdAt),
        updatedAt: this.convertTimestamp(screenWithTimestamp.updatedAt),
        lastActivity: this.convertTimestamp(screenWithTimestamp.lastActivity),
      };
    } catch (error) {
      console.error('Error creating QR screen:', error);
      throw error;
    }
  }

  async updateQrScreen(screenId: string, screenData: any) {
    try {
      const screensSnapshot = await this.db.collection(COLLECTIONS.QR_SCREENS)
        .where('screenId', '==', screenId)
        .get();
      
      if (screensSnapshot.empty) {
        throw new Error('QR screen not found');
      }
      
      const docRef = screensSnapshot.docs[0].ref;
      const updateData = {
        ...screenData,
        updatedAt: new Date(),
      };
      
      await docRef.update(updateData);
      
      const updatedDoc = await docRef.get();
      return {
        id: updatedDoc.id,
        ...updatedDoc.data(),
        createdAt: this.convertTimestamp(updatedDoc.data()?.createdAt),
        updatedAt: this.convertTimestamp(updatedDoc.data()?.updatedAt),
        lastActivity: this.convertTimestamp(updatedDoc.data()?.lastActivity),
      };
    } catch (error) {
      console.error('Error updating QR screen:', error);
      throw error;
    }
  }

  async deleteQrScreen(screenId: string) {
    try {
      const screensSnapshot = await this.db.collection(COLLECTIONS.QR_SCREENS)
        .where('screenId', '==', screenId)
        .get();
      
      if (!screensSnapshot.empty) {
        await screensSnapshot.docs[0].ref.delete();
      }
    } catch (error) {
      console.error('Error deleting QR screen:', error);
      throw error;
    }
  }

  async updateQrScreenActivity(screenId: string) {
    try {
      const screensSnapshot = await this.db.collection(COLLECTIONS.QR_SCREENS)
        .where('screenId', '==', screenId)
        .get();
      
      if (!screensSnapshot.empty) {
        await screensSnapshot.docs[0].ref.update({
          lastActivity: new Date(),
        });
      }
    } catch (error) {
      console.error('Error updating QR screen activity:', error);
      throw error;
    }
  }

  // Attendance Record operations
  async getAttendanceRecords() {
    try {
      const recordsSnapshot = await this.db.collection(COLLECTIONS.ATTENDANCE_RECORDS).get();
      return recordsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: this.convertTimestamp(doc.data().createdAt),
        updatedAt: this.convertTimestamp(doc.data().updatedAt),
        checkInTime: this.convertTimestamp(doc.data().checkInTime),
        checkOutTime: this.convertTimestamp(doc.data().checkOutTime),
      }));
    } catch (error) {
      console.error('Error getting attendance records:', error);
      throw error;
    }
  }

  async createAttendanceRecord(recordData: any) {
    try {
      const now = new Date();
      const cleanedData = Object.fromEntries(
        Object.entries(recordData).filter(([_, value]) => value !== undefined)
      );
      
      const recordWithTimestamp = {
        ...cleanedData,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await this.db.collection(COLLECTIONS.ATTENDANCE_RECORDS).add(recordWithTimestamp);
      
      return {
        id: docRef.id,
        ...recordWithTimestamp,
        createdAt: this.convertTimestamp(recordWithTimestamp.createdAt),
        updatedAt: this.convertTimestamp(recordWithTimestamp.updatedAt),
        checkInTime: this.convertTimestamp(recordWithTimestamp.checkInTime),
        checkOutTime: this.convertTimestamp(recordWithTimestamp.checkOutTime),
      };
    } catch (error) {
      console.error('Error creating attendance record:', error);
      throw error;
    }
  }

  async getAttendanceRecordsByDate(date: string) {
    try {
      const recordsSnapshot = await this.db.collection(COLLECTIONS.ATTENDANCE_RECORDS)
        .where('date', '==', date)
        .get();
      return recordsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: this.convertTimestamp(doc.data().createdAt),
        updatedAt: this.convertTimestamp(doc.data().updatedAt),
        checkInTime: this.convertTimestamp(doc.data().checkInTime),
        checkOutTime: this.convertTimestamp(doc.data().checkOutTime),
      }));
    } catch (error) {
      console.error('Error getting attendance records by date:', error);
      throw error;
    }
  }

  async getAttendanceRecordsByDateRange(startDate: string, endDate: string) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const recordsSnapshot = await this.db.collection(COLLECTIONS.ATTENDANCE_RECORDS)
        .where('date', '>=', start.toISOString().split('T')[0])
        .where('date', '<=', end.toISOString().split('T')[0])
        .get();
      
      return recordsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: this.convertTimestamp(doc.data().createdAt),
        updatedAt: this.convertTimestamp(doc.data().updatedAt),
        checkInTime: this.convertTimestamp(doc.data().checkInTime),
        checkOutTime: this.convertTimestamp(doc.data().checkOutTime),
      }));
    } catch (error) {
      console.error('Error getting attendance records by date range:', error);
      throw error;
    }
  }

  async getAttendanceRecordsByPersonnelId(personnelId: string | number) {
    try {
      const personnelIdStr = personnelId.toString();
      const recordsSnapshot = await this.db.collection(COLLECTIONS.ATTENDANCE_RECORDS)
        .where('personnelId', '==', personnelIdStr)
        .get();
      
      return recordsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: this.convertTimestamp(doc.data().createdAt),
        updatedAt: this.convertTimestamp(doc.data().updatedAt),
        checkInTime: this.convertTimestamp(doc.data().checkInTime),
        checkOutTime: this.convertTimestamp(doc.data().checkOutTime),
      }));
    } catch (error) {
      console.error('Error getting attendance records by personnel ID:', error);
      throw error;
    }
  }
}

export const firebaseStorage = new FirebaseStorage();