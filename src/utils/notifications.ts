import { getMessaging, onMessage, getToken } from 'firebase/messaging';
import { db } from '../firebase';
import { doc, setDoc, updateDoc, collection } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';

interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  click_action?: string;
}

interface PushNotification {
  id: string;
  committeeId: string;
  targetRole?: string;
  targetMember?: string;
  title: string;
  body: string;
  data?: any;
  createdAt: any;
  scheduledFor?: any;
  sentAt?: any;
  isRead: boolean;
}

// Request notification permission and get FCM token
export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const messagingInstance = getMessaging();
      const token = await getToken(messagingInstance, {
        vapidKey: 'YOUR_VAPID_KEY' // Add your VAPID key here
      });
      
      if (token) {
        console.log('FCM Token:', token);
        // Save token to user's document in Firestore
        await saveFCMToken(token);
        return token;
      }
    } else {
      console.log('Notification permission denied');
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
  }
  
  return null;
};

// Save FCM token to user's document
const saveFCMToken = async (token: string) => {
  try {
    const { committee, member, isAdminAccount, user } = useAuth();
    if (!committee || !user) return;

    const id = committee.id || committee.committeeId;
    
    if (isAdminAccount) {
      // Save to admin document
      await updateDoc(doc(db, 'committees', id), {
        fcmToken: token,
        lastTokenUpdate: new Date().toISOString()
      });
    } else if (member) {
      // Save to member document
      await updateDoc(doc(db, 'committees', id, 'members', member.memberId), {
        fcmToken: token,
        lastTokenUpdate: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error saving FCM token:', error);
  }
};

// Listen for incoming messages
export const initializeMessageListener = () => {
  const messagingInstance = getMessaging();
  onMessage(messagingInstance, (payload) => {
    console.log('Message received:', payload);
    
    const notification = payload.notification;
    const data = payload.data;

    if (notification) {
      // Show browser notification
      showBrowserNotification({
        title: notification.title || 'SamitiBook',
        body: notification.body || 'New update',
        icon: notification.icon || '/favicon.ico',
        click_action: data?.click_action
      });
    }

    // Handle custom notification logic
    if (data?.type === 'BROADCAST') {
      handleBroadcastNotification(data);
    } else if (data?.type === 'CHANDA_APPROVAL') {
      handleChandaApprovalNotification(data);
    } else if (data?.type === 'EXPENSE_ALERT') {
      handleExpenseAlert(data);
    }
  });
};

// Show browser notification
const showBrowserNotification = (notification: NotificationData) => {
  if (Notification.permission === 'granted') {
    const browserNotification = new Notification(notification.title, {
      body: notification.body,
      icon: notification.icon,
      tag: 'puja-committee',
      requireInteraction: true
    });

    browserNotification.onclick = () => {
      if (notification.click_action) {
        window.open(notification.click_action, '_blank');
      }
      browserNotification.close();
    };

    // Auto-close after 5 seconds
    setTimeout(() => {
      browserNotification.close();
    }, 5000);
  }
};

// Handle different notification types
const handleBroadcastNotification = (data: any) => {
  console.log('Broadcast notification received:', data);
  // Could trigger a refresh of broadcasts, show toast, etc.
};

const handleChandaApprovalNotification = (data: any) => {
  console.log('Chanda approval notification:', data);
  // Could trigger a refresh of chanda entries, show toast, etc.
};

const handleExpenseAlert = (data: any) => {
  console.log('Expense alert notification:', data);
  // Could trigger a refresh of expenses, show toast, etc.
};

// Send push notification to specific users
export const sendPushNotification = async (
  committeeId: string,
  notification: Omit<PushNotification, 'id' | 'createdAt' | 'isRead'>
): Promise<void> => {
  try {
    const notificationRef = doc(collection(db, 'committees', committeeId, 'notifications'));
    await setDoc(notificationRef, {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      isRead: false
    });

    // In a real implementation, you'd call a Cloud Function to send the FCM message
    // This would involve:
    // 1. Query for target users' FCM tokens
    // 2. Call Firebase Cloud Functions to send the message
    console.log('Push notification queued:', notification);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

// Send broadcast to all committee members
export const sendBroadcastNotification = async (
  committeeId: string,
  title: string,
  body: string,
  targetRoles?: string[]
): Promise<void> => {
  await sendPushNotification(committeeId, {
    committeeId,
    title,
    body,
    data: { type: 'BROADCAST', targetRoles },
    targetRole: targetRoles?.join(',') || 'all'
  });
};

// Send chanda approval notification
export const sendChandaApprovalNotification = async (
  committeeId: string,
  memberId: string,
  chandaId: string,
  status: 'approved' | 'rejected'
): Promise<void> => {
  const title = status === 'approved' ? 'Chanda Entry Approved' : 'Chanda Entry Rejected';
  const body = status === 'approved' 
    ? 'Your chanda entry has been approved and the receipt is now available.'
    : 'Your chanda entry requires revision. Please contact the incharge.';

  await sendPushNotification(committeeId, {
    committeeId,
    targetMember: memberId,
    title,
    body,
    data: { 
      type: 'CHANDA_APPROVAL', 
      chandaId, 
      status 
    }
  });
};

// Send expense alert notification
export const sendExpenseAlert = async (
  committeeId: string,
  category: string,
  amount: number,
  budgetLimit: number
): Promise<void> => {
  const isOverBudget = amount > budgetLimit;
  const title = isOverBudget ? 'Budget Exceeded!' : 'Budget Alert';
  const body = isOverBudget
    ? `${category} expenses (₹${amount.toLocaleString()}) have exceeded the budget limit of ₹${budgetLimit.toLocaleString()}.`
    : `${category} expenses are at 80% of the budget limit. Current: ₹${amount.toLocaleString()}`;

  await sendPushNotification(committeeId, {
    committeeId,
    title,
    body,
    data: { 
      type: 'EXPENSE_ALERT', 
      category, 
      amount, 
      budgetLimit 
    }
  });
};

// Initialize notifications on app load
export const initializeNotifications = async () => {
  await requestNotificationPermission();
  initializeMessageListener();
};
