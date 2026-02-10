import type { ExternalToast } from 'sonner';

type ToastPreset = Pick<ExternalToast, 'className' | 'descriptionClassName' | 'duration'>;

export const toastPresets: Record<
  'revenue' | 'success' | 'error' | 'loading' | 'neutral',
  ToastPreset
> = {
  revenue: {
    className: 'app-toast app-toast--revenue',
    descriptionClassName: 'app-toast__description app-toast__description--revenue',
    duration: 5500,
  },
  success: {
    className: 'app-toast app-toast--success',
    descriptionClassName: 'app-toast__description',
    duration: 3200,
  },
  error: {
    className: 'app-toast app-toast--error',
    descriptionClassName: 'app-toast__description app-toast__description--error',
    duration: 5200,
  },
  loading: {
    className: 'app-toast app-toast--loading',
    descriptionClassName: 'app-toast__description',
    duration: 8000,
  },
  neutral: {
    className: 'app-toast',
    descriptionClassName: 'app-toast__description',
    duration: 3800,
  },
};
