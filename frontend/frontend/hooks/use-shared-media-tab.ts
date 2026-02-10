import { parseAsString, useQueryStates } from 'nuqs';

export const useSharedMediaTab = () => {
  return useQueryStates({
    mediaTab: parseAsString
      .withDefault('all')
      .withOptions({ clearOnDefault: true }),
  });
};
