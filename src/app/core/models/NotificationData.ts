export class NotificationData {
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
  // Opcionales para confirmación
  confirmable?: boolean;
  confirmText?: string;
  cancelText?: string;
}
