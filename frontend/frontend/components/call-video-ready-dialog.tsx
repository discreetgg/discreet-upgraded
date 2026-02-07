'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useCall } from '@/context/call-context';
import { useCallback, useEffect, useState, useRef } from 'react';
import { Switch } from './ui/switch';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DialogClose, DialogTrigger } from '@radix-ui/react-dialog';
import { useMessage } from '@/context/message-context';

export const CallVideoReadyDialog = ({
  children,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) => {
  const { initiateCall } = useCall();
  const { receiver, conversationId } = useMessage();

  const [internalOpen, setInternalOpen] = useState(false);

  // Use external control if provided, otherwise use internal state
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = externalOnOpenChange || setInternalOpen;

  // State to track mirror toggle
  const [isMirrored, setIsMirrored] = useState(false);

  // State for camera management
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>(
    [],
  );
  const [selectedCameraId, setSelectedCameraId] = useState<string | undefined>(
    undefined,
  );
  const [permissionState, setPermissionState] = useState<
    'granted' | 'denied' | 'prompt' | 'checking'
  >('checking');
  const [permissionError, setPermissionError] = useState<string>('');

  // Use ref for current stream to avoid dependency issues
  const currentStreamRef = useRef<MediaStream | null>(null);

  // Request camera permission
  const requestCameraPermission = useCallback(async () => {
    try {
      setPermissionState('checking');
      setPermissionError('');

      // Request access to camera - this will trigger browser permission prompt
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      // Permission granted
      setPermissionState('granted');

      // Stop the temporary stream
      for (const track of stream.getTracks()) {
        track.stop();
      }

      // Now get the list of cameras
      await getCameras();

      return true;
    } catch (err) {
      console.error('Error requesting camera permission:', err);

      if (err instanceof Error) {
        if (
          err.name === 'NotAllowedError' ||
          err.name === 'PermissionDeniedError'
        ) {
          setPermissionState('denied');
          setPermissionError(
            'Camera access was denied. Please enable camera permissions in your browser settings.',
          );
        } else if (err.name === 'NotFoundError') {
          setPermissionState('denied');
          setPermissionError(
            'No camera found. Please connect a camera and try again.',
          );
        } else if (err.name === 'NotReadableError') {
          setPermissionState('denied');
          setPermissionError(
            'Camera is already in use by another application.',
          );
        } else {
          setPermissionState('denied');
          setPermissionError(
            'Unable to access camera. Please check your browser settings.',
          );
        }
      }

      return false;
    }
  }, []);

  // Get available cameras
  const getCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === 'videoinput' && device.deviceId,
      );
      setAvailableCameras(videoDevices);

      // Set default camera only if none is selected
      if (videoDevices.length > 0) {
        setSelectedCameraId((prev) => prev || videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error('Error enumerating cameras:', err);
    }
  }, []);

  // Start camera with specific device ID
  const startCamera = useCallback(async (deviceId?: string) => {
    try {
      // Stop current stream if it exists
      if (currentStreamRef.current) {
        for (const track of currentStreamRef.current.getTracks()) {
          track.stop();
        }
      }

      const constraints: MediaStreamConstraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      currentStreamRef.current = stream;

      // Attach the stream to a video element to show the preview
      const videoElement = document.getElementById(
        'video-preview',
      ) as HTMLVideoElement;
      if (videoElement) {
        videoElement.srcObject = stream;
        videoElement.play();
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
    }
  }, []);

  // Handle camera selection change
  const handleCameraChange = useCallback(
    (deviceId: string) => {
      setSelectedCameraId(deviceId);
      startCamera(deviceId);
    },
    [startCamera],
  );

  // Toggle mirror function
  const toggleMirror = useCallback((checked: boolean) => {
    const videoElement = document.getElementById(
      'video-preview',
    ) as HTMLVideoElement;

    if (videoElement) {
      if (checked) {
        videoElement.style.transform = 'scaleX(-1)';
      } else {
        videoElement.style.transform = 'scaleX(1)';
      }
    }

    setIsMirrored(checked);
  }, []);

  // Initialize cameras when dialog opens
  useEffect(() => {
    if (isOpen) {
      requestCameraPermission();
    }

    // Cleanup stream when dialog closes
    return () => {
      if (currentStreamRef.current) {
        for (const track of currentStreamRef.current.getTracks()) {
          track.stop();
        }
        currentStreamRef.current = null;
      }
    };
  }, [isOpen, requestCameraPermission]);

  // Start camera when selectedCameraId changes
  useEffect(() => {
    if (isOpen && selectedCameraId) {
      startCamera(selectedCameraId);
    }
  }, [selectedCameraId, isOpen, startCamera]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[390px] rounded-[15.123px] bg-[#0F1114] shadow-[5px_6px_0_0_#3C3C42] p-4 w-full">
        <div className="rounded-[10.162px] w-full relative">
          {/* Display user camera video preview here */}
          <video
            id="video-preview"
            className="w-full h-auto rounded-[10.162px] bg-black min-h-[200px] -scale-x-100"
            autoPlay
            muted
          />

          {/* Permission states overlay */}
          {permissionState === 'checking' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-[10.162px]">
              <div className="text-center space-y-2">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
                <p className="text-white text-sm">
                  Requesting camera access...
                </p>
              </div>
            </div>
          )}

          {permissionState === 'denied' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-[10.162px]">
              <div className="text-center space-y-3 px-4">
                <svg
                  className="w-12 h-12 mx-auto text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <p className="text-white text-sm font-medium">
                  Camera Access Required
                </p>
                <p className="text-white/60 text-xs">{permissionError}</p>
                <button
                  type="button"
                  onClick={requestCameraPermission}
                  className="mt-2 py-2 px-4 text-xs text-white bg-[#FF007F] rounded-lg hover:bg-[#FF007F]/80 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {permissionState === 'granted' && (
            <div className="absolute inset-0 pointer-events-none rounded-[10.162px] overflow-hidden">
              <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                {/* Grid lines */}
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-b border-white/20" />
                <div className="border-r border-white/20" />
                <div className="border-r border-white/20" />
                <div />
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-4 mt-4">
          <p className="text-xs text-accent-text">Mirror video?</p>
          <Switch
            checked={isMirrored}
            onCheckedChange={toggleMirror}
            disabled={permissionState !== 'granted'}
          />
        </div>
        <p className="text-[21.173px] font-medium text-[#D4D4D8]">
          Good to go?
        </p>
        {/* Camera selection dropdown */}
        {availableCameras.length > 0 &&
          selectedCameraId &&
          permissionState === 'granted' && (
            <Select value={selectedCameraId} onValueChange={handleCameraChange}>
              <SelectTrigger className="w-full my-4 text-[#8A8C95] text-[15.123px]">
                <SelectValue placeholder="Select Camera" />
              </SelectTrigger>
              <SelectContent className="p-2">
                {availableCameras.map((camera) => (
                  <SelectItem
                    key={camera.deviceId}
                    value={camera.deviceId}
                    className="p-2"
                  >
                    {camera.label ||
                      `Camera ${availableCameras.indexOf(camera) + 1}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        <div className="flex items-center justify-between gap-4 py-2">
          <DialogClose asChild>
            <button
              type="button"
              className="py-4 px-10 text-[15.123px] text-[#F8F8F8] bg-[#3C3C42] rounded-[13.611px] hover:bg-[#525256] transition-colors"
            >
              Cancel
            </button>
          </DialogClose>
          <button
            type="button"
            disabled={permissionState !== 'granted'}
            className="py-4 px-10 text-[15.123px] text-[#0A0A0A] bg-[#F8F8F8] rounded-[13.611px] hover:bg-[#F8F8F8]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => {
              // Stop the preview camera stream BEFORE initiating the actual call
              // This prevents having two active camera streams
              if (currentStreamRef.current) {
                for (const track of currentStreamRef.current.getTracks()) {
                  track.stop();
                }
                currentStreamRef.current = null;
              }

              initiateCall({
                isVideoCall: true,
                receiverId: receiver?.discordId || ('' as string),
                conversationId: conversationId || ('' as string),
              });
              setIsOpen(false);
            }}
          >
            Proceed
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
