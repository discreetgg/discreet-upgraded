"use client";

import { parseAsString, useQueryStates } from "nuqs";

export const useMenuItemFilters = () => {
	return useQueryStates({
		hashtag: parseAsString
			.withDefault("all")
			.withOptions({ clearOnDefault: true }),
		menuTab: parseAsString
			.withDefault("subscription")
			.withOptions({ clearOnDefault: false }),
	});
};
