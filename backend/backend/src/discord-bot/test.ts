// import { Inject, Injectable, Logger } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import {
//   Client,
//   Message,
//   Partials,
//   REST,
//   Routes,
//   TextChannel,
//   SlashCommandBuilder,
//   Guild,
//   GuildMember,
// } from 'discord.js';
// import { User } from 'src/database/schemas/user.schema';

// // Define slash commands
// export const baseCommands = [
//   new SlashCommandBuilder()
//     .setName('hello')
//     .setDescription('Says hello to the user')
//     .toJSON(),
//   new SlashCommandBuilder()
//     .setName('ping')
//     .setDescription('Ping command!')
//     .toJSON(),
// ];

// @Injectable()
// export class DiscordBotService {
//   private readonly logger = new Logger(DiscordBotService.name);
//   private readonly client: Client;
//   private readonly prefix = '!';
//   private pendingVerifications: Map<string, { awaitingCode: boolean }> =
//     new Map();

//   constructor(
//     @Inject('DISCORD_BOT_TOKEN') private readonly token: string,
//     @Inject('DISCORD_BOT_ID') private readonly botId: string,
//     @InjectModel(User.name) private readonly userModel: Model<User>,
//   ) {
//     this.client = new Client({
//       intents: [
//         'Guilds',
//         'GuildMessages',
//         'DirectMessages',
//         'MessageContent',
//         'DirectMessageTyping',
//         'GuildMembers', // Required for role management
//       ],
//       partials: [Partials.Message, Partials.Channel],
//     });

//     this.logger.log('Bot initializing...');
//     this.client.login(this.token);
//     this.registerCommands();
//     this.client.once('ready', this.onReady);
//     this.client.on('warn', this.onWarn);
//     this.client.on('messageCreate', this.handleRecievedMessages);
//     this.client.on('interactionCreate', this.handleInteraction);
//   }

//   onReady = async () => {
//     this.logger.log(`Bot logged in as ${this.client.user?.username}`);
//   };

//   onWarn = async (message) => {
//     this.logger.warn(message);
//   };

//   registerCommands = async () => {
//     this.logger.log('Registering commands...');
//     this.logger.log(`Token: ${this.token.slice(0, 10)}...`);
//     this.logger.log(`Bot ID: ${this.botId}`);
//     this.logger.log(`Commands: ${JSON.stringify(baseCommands)}`);
//     try {
//       const rest = new REST().setToken(this.token);
//       const result = await rest.put(Routes.applicationCommands(this.botId), {
//         body: baseCommands,
//       });
//       this.logger.log('Commands registered:', JSON.stringify(result));
//     } catch (error) {
//       this.logger.error('Failed to register slash commands:', error);
//     }
//   };

//   handleRecievedMessages = async (message: Message) => {
//     if (message.author.bot || message.author.id === this.botId) return;

//     this.logger.log(`Received message: ${message.content}`);
//     try {
//       const channel = this.client.channels.cache.get(message.channelId);
//       if (!channel?.isTextBased()) return;

//       await (channel as TextChannel).sendTyping();

//       // Check if user is pending verification code
//       const pendingVerification = this.pendingVerifications.get(
//         message.author.id,
//       );
//       if (pendingVerification?.awaitingCode) {
//         await this.handleVerificationCode(message);
//         return;
//       }

//       if (message.content.startsWith(this.prefix)) {
//         this.logger.log(`Detected command: ${message.content}`);
//         await this.handleBotCommands(message);
//         return;
//       }

//       if (!message.guildId) {
//         await this.sendDirectMessage(message);
//         return;
//       }

//       await message.reply(
//         'Thank you for your message! I will get back to you soon.',
//       );
//     } catch (error) {
//       this.logger.error('Error handling message:', error);
//     }
//   };

//   handleBotCommands = async (message: Message) => {
//     const args = message.content.slice(this.prefix.length).trim().split(/ +/);
//     const command = args.shift()?.toLowerCase();
//     this.logger.log(`Parsed command: ${command}, args: ${args}`);

//     if (!command) return;

//     switch (command) {
//       case 'hello':
//         await message.reply(`Hello, ${message.author.username}!`);
//         break;
//       case 'ping':
//         await message.reply(`Hello, ${message.author.username}!, bot is alive`);
//         break;
//       case 'verify':
//         if (args.length === 0) {
//           // No code provided, prompt for code
//           this.pendingVerifications.set(message.author.id, {
//             awaitingCode: true,
//           });
//           await message.reply('Please provide your verification code.');
//         } else {
//           // Code provided (e.g., !verify 3774743)
//           const verificationCode = args[0];
//           this.logger.log(
//             `Verification code from ${message.author.id}: ${verificationCode}`,
//           );
//           await this.handleVerificationCode(message, verificationCode);
//         }
//         break;
//       case 'stats':
//         await message.reply('Stats command is not implemented yet.');
//         break;
//       case 'profile':
//         await message.reply('Profile command is not implemented yet.');
//         break;
//       case 'notify':
//         await message.reply('Notification command is not implemented yet.');
//         break;
//       case 'tip':
//         if (!message.guildId) {
//           await message.reply('Please use !tip in a server channel.');
//           return;
//         }
//         if (args.length < 2) {
//           await message.reply('Usage: !tip <@user> <amount>');
//           return;
//         }
//         const userMention = args[0];
//         const amount = parseFloat(args[1]);
//         if (isNaN(amount)) {
//           await message.reply('Amount must be a valid number.');
//           break;
//         }
//         const userIdMatch = userMention.match(/^<@!?(\d+)>$/);
//         if (!userIdMatch) {
//           await message.reply(
//             'Please mention a valid user (e.g., !tip @user 50).',
//           );
//           break;
//         }
//         const userId = userIdMatch[1];
//         try {
//           const user = await this.client.users.fetch(userId);
//           await message.reply(`You tipped ${user.username} $${amount}.`);
//         } catch (error) {
//           this.logger.error(`Failed to fetch user ${userId}:`, error);
//           await message.reply('Failed to find the mentioned user.');
//         }
//         break;
//       case 'help':
//         await message.reply(
//           'Available commands: !verify, !stats, !profile, !notify, !tip, !help',
//         );
//         break;
//       default:
//         await message.reply(`Unknown command: ${command}`);
//     }
//   };

//   handleVerificationCode = async (message: Message, code?: string) => {
//     const verificationCode = code || message.content.trim();
//     this.logger.log(
//       `Received verification code from ${message.author.id}: ${verificationCode}`,
//     );

//     // Remove pending verification
//     this.pendingVerifications.delete(message.author.id);

//     try {
//       // Validate code against database
//       const user = await this.userModel.findOne({
//         verificationCode: verificationCode,
//       });
//       if (!user) {
//         await message.reply(
//           'Invalid verification code. Please try again or use !verify to request a new code.',
//         );
//         return;
//       }

//       // Save user data
//       await this.saveUser(message.author.id, 'buyer');

//       // Assign role in all mutual guilds
//       const roleName = 'Verified'; // Replace with your desired role name
//       let assignedGuilds: string[] = [];
//       for (const guild of this.client.guilds.cache.values()) {
//         try {
//           const member = await guild.members
//             .fetch(message.author.id)
//             .catch(() => null);
//           if (member) {
//             const role = guild.roles.cache.find((r) => r.name === roleName);
//             if (role) {
//               await member.roles.add(role);
//               this.logger.log(
//                 `Assigned role ${roleName} to ${message.author.id} in guild ${guild.name} (${guild.id})`,
//               );
//               assignedGuilds.push(guild.name);
//             } else {
//               this.logger.warn(
//                 `Role "${roleName}" not found in guild ${guild.name} (${guild.id})`,
//               );
//             }
//           }
//         } catch (error) {
//           this.logger.error(
//             `Failed to assign role in guild ${guild.id} for ${message.author.id}:`,
//             error,
//           );
//         }
//       }

//       if (assignedGuilds.length > 0) {
//         await message.reply(
//           `Verification successful! You have been assigned the "${roleName}" role in: ${assignedGuilds.join(', ')}.`,
//         );
//       } else {
//         await message.reply(
//           `Verification successful, but the "${roleName}" role was not found in any mutual servers or the bot lacks permissions.`,
//         );
//       }
//     } catch (error) {
//       this.logger.error('Error verifying code:', error);
//       await message.reply(
//         'An error occurred during verification. Please try again later.',
//       );
//     }
//   };

//   saveUser = async (discordId: string, role: string) => {
//     try {
//       await this.userModel.updateOne(
//         { discordId },
//         { $set: { role, verified: true } },
//         { upsert: true },
//       );
//       this.logger.log(`Saved user ${discordId} with role ${role}`);
//     } catch (error) {
//       this.logger.error(`Failed to save user ${discordId}:`, error);
//       throw error;
//     }
//   };

//   handleInteraction = async (interaction) => {
//     this.logger.log(`Interaction received: ${interaction.type}`);
//     if (interaction.isCommand()) {
//       this.logger.log(`Slash command: ${interaction.commandName}`);
//       const { commandName } = interaction;
//       if (commandName === 'hello') {
//         await interaction.reply(`Hello, ${interaction.user.username}!`);
//       } else if (commandName === 'ping') {
//         await interaction.reply('Hello you Pong!');
//       }
//     }
//     if (interaction.isButton()) {
//       this.logger.log('Button interaction received');
//     }
//   };

//   sendDirectMessage = async (message: Message) => {
//     try {
//       const user = await this.client.users.fetch(message.author.id);
//       if (!user) {
//         throw new Error('User not found');
//       }

//       await message.reply(
//         'Thank you for your direct message! I will get back to you soon.',
//       );
//       this.logger.log(`DM sent to ${user.tag}`);
//     } catch (err) {
//       this.logger.error('Failed to send DM:', err);
//     }
//   };
// }
