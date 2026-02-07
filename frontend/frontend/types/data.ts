export type CreatorSubscriptionsType = {
	name: string;
	image: string;
	username: string;
	followers: string;
	plan: PlanKey;
	date: string;
	due: string;
	status: string;
};

type PlanKey = "essential_plan" | "green_plan" | "cool_plan";

export enum Ethnicity {
	AFRICAN_BLACK = "african_black",
	ASIAN = "asian",
	WHITE_CAUCASIAN = "white_caucasian",
	HISPANIC_LATINO = "hispanic_latino",
	INDIGENOUS_NATIVE = "indigenous_native",
	PACIFIC_ISLANDER = "pacific_islander",
	MIXED_RACE = "mixed_race",
}
