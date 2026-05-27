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

export const requestNotificationPermission = async (): Promise<string | null> => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return null;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted' ? 'browser-notifications-enabled' : null;
};

const showBrowserNotification = (notification: NotificationData) => {
  if (Notification.permission !== 'granted') return;

  const browserNotification = new Notification(notification.title, {
    body: notification.body,
    icon: notification.icon,
    tag: 'samitibook',
    requireInteraction: true,
  });

  browserNotification.onclick = () => {
    if (notification.click_action) {
      window.open(notification.click_action, '_blank');
    }
    browserNotification.close();
  };

  setTimeout(() => browserNotification.close(), 5000);
};

export const initializeMessageListener = () => {
  console.log('Browser notification listener initialized');
};

export const sendPushNotification = async (
  committeeId: string,
  notification: Omit<PushNotification, 'id' | 'createdAt' | 'isRead'>
): Promise<void> => {
  console.log('Notification queued locally:', committeeId, notification);
  showBrowserNotification({
    title: notification.title,
    body: notification.body,
    icon: '/favicon.ico',
  });
};

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
    targetRole: targetRoles?.join(',') || 'all',
  });
};

export const sendChandaApprovalNotification = async (
  committeeId: string,
  memberId: string,
  chandaId: string,
  status: 'approved' | 'rejected'
): Promise<void> => {
  await sendPushNotification(committeeId, {
    committeeId,
    targetMember: memberId,
    title: status === 'approved' ? 'Chanda Entry Approved' : 'Chanda Entry Rejected',
    body: status === 'approved'
      ? 'Your chanda entry has been approved and the receipt is now available.'
      : 'Your chanda entry requires revision. Please contact the incharge.',
    data: { type: 'CHANDA_APPROVAL', chandaId, status },
  });
};

export const sendExpenseAlert = async (
  committeeId: string,
  category: string,
  amount: number,
  budgetLimit: number
): Promise<void> => {
  const isOverBudget = amount > budgetLimit;
  await sendPushNotification(committeeId, {
    committeeId,
    title: isOverBudget ? 'Budget Exceeded!' : 'Budget Alert',
    body: isOverBudget
      ? `${category} expenses (Rs ${amount.toLocaleString()}) have exceeded the budget limit of Rs ${budgetLimit.toLocaleString()}.`
      : `${category} expenses are at 80% of the budget limit. Current: Rs ${amount.toLocaleString()}`,
    data: { type: 'EXPENSE_ALERT', category, amount, budgetLimit },
  });
};

export const initializeNotifications = async () => {
  await requestNotificationPermission();
  initializeMessageListener();
};
