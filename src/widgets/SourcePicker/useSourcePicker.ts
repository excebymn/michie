// useSourcePicker.ts
import { useState, useCallback } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { useAppStore } from '../../stores';
import { settingsService } from '../../services';

export const useSourcePicker = () => {
  const directories = useAppStore((s) => s.directories);
  const isScanning = useAppStore((s) => s.isScanning);
  const scanCurrent = useAppStore((s) => s.scanCurrent);
  const scanLength = useAppStore((s) => s.scanLength);
  const refreshDirectories = useAppStore((s) => s.refreshDirectories);
  const refreshLibrary = useAppStore((s) => s.refreshLibrary);

  const [isBusy, setIsBusy] = useState(false);

  const handleAddFolder = useCallback(async () => {
    const selected = await open({ directory: true, multiple: false });
    if (!selected || Array.isArray(selected)) return;

    setIsBusy(true);
    try {
      await settingsService.addDirectory(selected);
      await refreshDirectories();
      await refreshLibrary(); // trigger scan ke folder baru
    } finally {
      setIsBusy(false);
    }
  }, [refreshDirectories, refreshLibrary]);

  const handleRemoveFolder = useCallback(
    async (path: string) => {
      setIsBusy(true);
      try {
        await settingsService.removeDirectory(path);
        await refreshDirectories();
      } finally {
        setIsBusy(false);
      }
    },
    [refreshDirectories]
  );

  const handleRescan = useCallback(async () => {
    setIsBusy(true);
    try {
      await refreshLibrary();
    } finally {
      setIsBusy(false);
    }
  }, [refreshLibrary]);

  return {
    directories,
    isScanning,
    scanCurrent,
    scanLength,
    isBusy,
    handleAddFolder,
    handleRemoveFolder,
    handleRescan,
  };
};