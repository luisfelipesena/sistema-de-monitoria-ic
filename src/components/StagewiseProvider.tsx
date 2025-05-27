'use client';

import { env } from '@/utils/env';
import React, { useEffect } from 'react';

const StagewiseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      env.NODE_ENV === 'development' &&
      env.VITE_ENABLE_STAGEWISE === 'true'
    ) {
      const initStagewise = async () => {
        try {
          const { StagewiseToolbar } = await import('@stagewise/toolbar-react');
          const { createRoot } = await import('react-dom/client');

          const stagewiseConfig = {
            plugins: [],
          };

          let toolbarContainer = document.getElementById('stagewise-toolbar');
          if (!toolbarContainer) {
            toolbarContainer = document.createElement('div');
            toolbarContainer.id = 'stagewise-toolbar';
            document.body.appendChild(toolbarContainer);
          }

          const root = createRoot(toolbarContainer);
          root.render(
            React.createElement(StagewiseToolbar, { config: stagewiseConfig }),
          );
        } catch (error) {
          console.warn('Failed to initialize Stagewise toolbar:', error);
        }
      };

      initStagewise();
    }
  }, []);

  return <>{children}</>;
};

export { StagewiseProvider };
