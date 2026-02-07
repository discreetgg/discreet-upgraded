export interface DiscordUser {
  id: string;
  username: string;
  discriminator?: string;
  global_name?: string;
  avatar?: string;
  email?: string;
  verified?: boolean;
  [key: string]: any; // allows for additional fields without breaking
}
