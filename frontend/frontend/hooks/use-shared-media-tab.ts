import { parseAsString, useQueryStates } from 'nuqs';

export const useSharedMediaTab = () => {
  return useQueryStates({
    tab: parseAsString
      .withDefault('images')
      .withOptions({ clearOnDefault: true }),
  });
};
