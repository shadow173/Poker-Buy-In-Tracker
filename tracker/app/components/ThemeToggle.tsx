// components/ThemeToggle.tsx
'use client';

import { ActionIcon, Tooltip, useMantineColorScheme, useComputedColorScheme } from '@mantine/core';
import { IconSun, IconMoonStars } from '@tabler/icons-react';

export function ThemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });

  const toggleColorScheme = () => {
    setColorScheme(computedColorScheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Tooltip label="Toggle theme" withArrow position="bottom">
      <ActionIcon
        variant="outline"
        color={computedColorScheme === 'light' ? 'dark' : 'yellow'}
        onClick={toggleColorScheme}
        size="lg"
      >
        {computedColorScheme === 'light' ? (
          <IconSun size="1.1rem" />
        ) : (
          <IconMoonStars size="1.1rem" />
        )}
      </ActionIcon>
    </Tooltip>
  );
}