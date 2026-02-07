import { useAuth } from '@/context/auth-context-provider';
import { useEffect } from 'react';

export const RightClickProtector = () => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      const handleContextMenu = (e: MouseEvent) => e.preventDefault();
      document.addEventListener('contextmenu', handleContextMenu);

      return () => {
        document.removeEventListener('contextmenu', handleContextMenu);
      };
    }
  }, [isAuthenticated]);

  return null;
};
