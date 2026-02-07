'use client';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { useFormContext, useWatch } from 'react-hook-form';
import type {
  NotificationControl,
  NotificationSettingsType,
} from './settings-notifications-content';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';

type SubNotificationKey<T extends keyof NotificationSettingsType> =
  `${T}.${Extract<keyof NotificationSettingsType[T], string>}`;

export const SettingsNotificationsGroup = ({
  title,
  description,
  name,
  fields,
  control,
}: {
  title: string;
  description: string;
  name: keyof NotificationSettingsType;
  fields: string[];
  control: NotificationControl;
}) => {
  const { setValue } = useFormContext<NotificationSettingsType>();

  const subValues = useWatch({
    control,
    name,
  }) as NotificationSettingsType[typeof name];

  return (
    <>
      <FormField
        control={control}
        name={`${name}.enabled`}
        render={({ field }) => (
          <FormItem className='flex items-center justify-between'>
            <div className='space-y-[15px]'>
              <FormLabel className='text-xl text-[#D4D4D8] font-medium'>
                {title}
              </FormLabel>
              <FormDescription className='text-[15px] text-[#8A8C95] font-medium max-w-[528px]'>
                {description}
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  if (!checked) {
                    for (const f of fields) {
                      setValue(
                        `${name}.${f}` as SubNotificationKey<typeof name>,
                        false
                      );
                    }
                  }
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />
      {subValues?.enabled && (
        <div className='space-y-[30px]'>
          {fields.map((key) => (
            <FormField
              key={key}
              control={control}
              name={`${name}.${key}` as SubNotificationKey<typeof name>}
              render={({ field }) => (
                <FormItem className='flex items-center justify-between'>
                  <FormLabel className='text-lg first-letter:capitalize text-[#D4D4D8] font-medium'>
                    {key.replace(/([A-Z])/g, ' $1')}
                  </FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          ))}
        </div>
      )}
      <Separator className='last:hidden' />
    </>
  );
};
