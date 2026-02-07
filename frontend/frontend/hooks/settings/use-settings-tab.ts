import { parseAsString, useQueryStates } from 'nuqs';

export const useSettingsTab = () => {
  return useQueryStates({
    tab: parseAsString
      .withDefault('profile')
      .withOptions({ clearOnDefault: true }),
  });
};
