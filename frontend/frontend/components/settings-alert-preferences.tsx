'use client';

import { useAlertPreferences } from '@/context/alert-preferences-context';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';

export const SettingsAlertPreferences = () => {
  const {
    liveAlertsEnabled,
    setLiveAlertsEnabled,
    alertSoundsEnabled,
    setAlertSoundsEnabled,
  } = useAlertPreferences();

  return (
    <>
      <div className="space-y-[15px]">
        <h3 className="text-xl text-[#D4D4D8] font-medium">Live Alerts</h3>
        <p className="text-[15px] text-[#8A8C95] font-medium max-w-[528px]">
          Control real-time on-screen alerts for incoming tips and bundle
          purchases. These settings are saved on this device.
        </p>
      </div>

      <div className="space-y-[30px]">
        <div className="flex items-center justify-between">
          <p className="text-lg text-[#D4D4D8] font-medium">Show Live Alerts</p>
          <Switch
            checked={liveAlertsEnabled}
            onCheckedChange={setLiveAlertsEnabled}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-lg font-medium text-[#D4D4D8]">
              Play Alert Sounds
            </p>
            <p className="text-sm text-[#8A8C95] font-medium">
              Applies to live alerts and message alert sounds.
            </p>
          </div>
          <Switch
            checked={alertSoundsEnabled}
            onCheckedChange={setAlertSoundsEnabled}
          />
        </div>
      </div>

      <Separator />
    </>
  );
};
