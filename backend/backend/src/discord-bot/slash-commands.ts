import { SlashCommandBuilder } from 'discord.js';

export const baseCommands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Ping the bot to check if it is online'),

  new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Link your discreet account'),
  // .addNumberOption((option) =>
  //   option
  //     .setName('verification_code')
  //     .setDescription('Verification code to link your account')
  //     .setRequired(true),
  // ),

  // new SlashCommandBuilder()
  //   .setName('stats')
  //   .setDescription('View your earnings'),

  // new SlashCommandBuilder()
  //   .setName('profile')
  //   .setDescription('Get your store link'),

  // new SlashCommandBuilder()
  //   .setName('notify')
  //   .setDescription('Toggle Discord alert notifications'),

  // new SlashCommandBuilder()
  //   .setName('tip')
  //   .setDescription('Tip a user')
  //   .addUserOption((option) =>
  //     option.setName('user').setDescription('User to tip').setRequired(true),
  //   )
  //   .addNumberOption((option) =>
  //     option
  //       .setName('amount')
  //       .setDescription('Amount to tip in $')
  //       .setRequired(true),
  //   ),

  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Get help with commands'),
].map((cmd) => cmd.toJSON());
