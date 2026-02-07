import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Client,
  Colors,
  Interaction,
  Message,
  Partials,
  REST,
  Routes,
  TextChannel,
} from 'discord.js';
import { User } from 'src/database/schemas/user.schema';
import { baseCommands } from './slash-commands';
import { Role, Roles } from './roles.interface';
import { UserService } from 'src/user/user.service';

@Injectable()
export class DiscordBotService {
  private readonly logger = new Logger(DiscordBotService.name);
  private readonly client: Client;
  private readonly prefix = '!'; // Define the custom command prefix

  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly usersService: UserService,
    @Inject('DISCORD_BOT_TOKEN') private readonly token: string,
    @Inject('DISCORD_BOT_ID') private readonly botId: string,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {
    this.client = new Client({
      intents: [
        'Guilds',
        'GuildMessages',
        'DirectMessages',
        'MessageContent',
        'DirectMessageTyping',
        'GuildMembers',
      ],
      partials: [Partials.Message, Partials.Channel],
    });
    this.logger.log('this is client ' + this.client.token);
    this.client.login(token);
    this.registerCommands();
    this.client.once('ready', this.onReady);
    this.client.on('warn', this.onWarn);
    this.client.on('messageCreate', this.handleRecievedMessages);
    this.client.on('interactionCreate', this.handleInteraction);
    this.client.on('guildCreate', this.createRoles);
  }

  onReady = async () => {
    this.logger.log(`Bot logged in as ${this.client.user?.username}`);
  };

  onWarn = async (message) => {
    this.logger.warn(message);
  };

  registerCommands = async () => {
    this.logger.log('Registering commands...');
    this.logger.log(`Token: ${this.token.slice(0, 10)}...`); // Partial token for security
    this.logger.log(`Bot ID: ${this.botId}`);
    this.logger.log(`Commands: ${JSON.stringify(baseCommands)}`);
    this.logger.log('Registering commands...');
    try {
      const rest = new REST().setToken(this.token);
      await rest.put(Routes.applicationCommands(this.botId), {
        body: baseCommands,
      });
      this.logger.log('Slash commands registered successfully');
    } catch (error) {
      this.logger.error('Failed to register slash commands:', error);
    }
  };

  handleRecievedMessages = async (message: Message) => {
    if (message.author.bot || message.author.id === this.botId) return;

    this.logger.log(`Received message: ${typeof message.content}`);

    try {
      const channel = this.client.channels.cache.get(message.channelId);
      if (!channel?.isTextBased()) return;

      await (channel as TextChannel).sendTyping();

      // Handle custom prefix commands (e.g., !hello)
      if (message.content.startsWith(this.prefix)) {
        await this.handleBotCommands(message);
        return;
      }

      if (!message.guildId) {
        // Handle direct messages
        await this.sendDirectMessage(message);
        return;
      }

      await message.reply(
        'Thank you for your message! I will get back to you soon.',
      );
    } catch (error) {
      this.logger.error('Error handling message:', error);
    }
  };

  sendDirectMessage = async (message: Message) => {
    try {
      const user = await this.client.users.fetch(message.author.id);
      if (!user) {
        throw new Error('User not found');
      }

      // await user.send("welcome to our support channel! How can I assist you today?");
      await message.reply(
        'Thank you for your direct message! I will get back to you soon.',
      );
      await console.log(`DM sent to ${user.tag}`);
    } catch (err) {
      console.error('Failed to send DM:', err);
    }
  };

  sendDiscordBotNotification = async (
    notification: string,
    discordId: string,
  ) => {
    try {
      const user = await this.client.users.fetch(discordId);
      if (!user) {
        throw new Error('User not found');
      }

      await user.send(notification);

      console.log(`DM sent to ${user.tag}`);
    } catch (err) {
      console.error('Failed to send DM:', err);
    }
  };

  handleBotCommands = async (message: Message) => {
    console.log(message);
    const args = message.content.slice(this.prefix.length).trim().split(/ +/);
    const command = args.shift()?.toLowerCase();

    if (!command) return;

    switch (command) {
      case 'ping':
        await message.reply(`Hello, ${message.author.username}!, bot is alive`);
        break;
      case 'verify':
        await this.saveUser(
          message.author.id,
          'buyer', // Default role, can be changed based on your logic
        );
        await this.assignRole(message, '🔞 @18+ Verified');
        // await message.reply('Verification in process, please wait...');

        break;
      case 'stats':
        await message.reply('Stats command is not implemented yet.');
        break;
      case 'profile':
        await message.reply('Profile command is not implemented yet.');
        break;
      case 'notify':
        await message.reply('Notification command is not implemented yet.');
        break;
      case 'tip':
        // const user = interaction.options.get('user');
        // const amount = interaction.options.get('amount');
        // if (user && amount) {
        //   await interaction.reply(`You tipped ${user.user} $${amount.value}.`);
        // }
        break;
      case 'help':
        await message.reply(
          'Here are the available commands: !verify, !stats, !profile, !notify, !tip, !help',
        );
        break;
      default:
        await message.reply(`Unknown command: ${command}`);
    }
  };

  handleInteraction = async (interaction: Interaction) => {
    // console.log(interaction);
    // Handle slash commands
    if (interaction.isCommand()) {
      const { commandName } = interaction;

      switch (commandName) {
        case 'ping':
          await interaction.reply(
            `Hello, ${interaction.user.username}!, bot is alive`,
          );
          break;
        // case 'verify':
        //   // const verification_code =
        //   //   interaction.options.get('verification_code');

        //   const user = await this.usersService.createUser({
        //     id: interaction.user.id,
        //     username: interaction.user.username,
        //     displayName: interaction.user.displayName,
        //     avatar: interaction.user.avatar,
        //   });

        //   if (user?.isAgeVerified) {
        //     await this.assignRoleToUser(
        //       interaction.user.id,
        //       (msg) => interaction.reply(msg),
        //       Roles.VERIFIED,
        //     );
        //   } else {
        //     await interaction.reply(
        //       'Please navigate to https://www.discreet.gg/ to verify your age',
        //     );
        //   }
        //   // await this.saveUser(
        //   //   interaction.user.id,
        //   //   'buyer', // Default role, can be changed based on your logic
        //   // );
        //   // await interaction.reply('Verification in process, please wait...');
        //   break;

        case 'verify':
          // Create or fetch the user in your database
          const user = await this.usersService.createUser({
            id: interaction.user.id,
            username: interaction.user.username,
            displayName: interaction.user.displayName,
            avatar: interaction.user.avatar,
          });

          if (user?.isAgeVerified) {
            await this.assignRoleToUser(
              interaction.guildId,
              interaction.user.id,
              Roles.VERIFIED,
            );

            if (user?.role != Roles.SELLER) {
              await this.assignRoleToUser(
                interaction.guildId,
                interaction.user.id,
                Roles.BUYER,
              );
              await await interaction.reply(
                `You have been verified and assigned the ${Roles.VERIFIED} and ${Roles.BUYER} role!`,
              );
            } else {
              await this.assignRoleToUser(
                interaction.guildId,
                interaction.user.id,
                Roles.SELLER,
              );

              await await interaction.reply(
                `You have been verified and assigned the ${Roles.VERIFIED} and ${Roles.SELLER} role!`,
              );
            }
          } else {
            await interaction.reply(
              'Please navigate to https://www.discreet.gg/ to verify your age.',
            );
          }
          break;

        case 'stats':
          await interaction.reply('Stats command is not implemented yet.');
          break;
        case 'profile':
          await interaction.reply('Profile command is not implemented yet.');
          break;
        case 'notify':
          await interaction.reply(
            'Notification command is not implemented yet.',
          );
          break;
        case 'tip':
          const tippedUser = interaction.options.get('user');
          const amount = interaction.options.get('amount');
          if (user && amount) {
            await interaction.reply(
              `You tipped ${tippedUser.user} $${amount.value}.`,
            );
          }
          break;
        case 'help':
          // await interaction.reply(
          //   'Here are the available commands: /ping, /verify, /stats, /profile, /notify, /tip, /help',
          // );
          await interaction.reply(
            'Here are the available commands: /ping, /verify, /help',
          );
          break;
        default:
          await interaction.reply(`Unknown command: ${commandName}`);
      }

      // Handle buttons (existing logic)
      if (interaction.isButton()) {
        // Your existing button handling logic
        this.logger.log('Button interaction received');
      }
    }
  };

  saveUser = async (discordId: string, role: string) => {
    try {
      const existingUser = await this.userModel.findOne({ discordId });
      if (existingUser) {
        this.logger.log(`User with ID ${discordId} already exists.`);
        return existingUser;
      }
      const newUser = new this.userModel({ discordId, role });
      await newUser.save();
      this.logger.log(`User with ID ${discordId} created successfully.`);
      return newUser;
    } catch (error) {
      this.logger.error(`Error saving user with ID ${discordId}:`, error);
      throw error;
    }
  };
  getUser = async (discordId: string) => {
    try {
      const user = await this.userModel.findOne({ discordId });
      if (!user) {
        this.logger.warn(`User with ID ${discordId} not found.`);
        return null;
      }
      this.logger.log(`User with ID ${discordId} retrieved successfully.`);
      return user;
    } catch (error) {
      this.logger.error(`Error retrieving user with ID ${discordId}:`, error);
      throw error;
    }
  };

  createRoles = async (guild) => {
    this.logger.log(`Creating roles in guild: ${guild.name} (${guild.id})`);
    try {
      const existingRole = guild.roles.cache.find(
        (role) => role.name === 'verified',
      );
      if (existingRole) {
        this.logger.log(
          `Role "verified" already exists in guild ${guild.name} (${guild.id})`,
        );
        return;
      }
      await guild.roles.create({
        name: '🔞 @18+ Verified',
        color: Colors.Green,
        mentionable: true,
        permissions: ['ViewChannel', 'SendMessages'],
        reason: 'Role created for verified users',
      });
      this.logger.log(
        `Role "verified" created in guild ${guild.name} (${guild.id})`,
      );
      // Optionally, you can assign this role to the bot itself
      // const botMember = await guild.members.fetch(this.client.user.id);
      // if (botMember) {
      //   await botMember.roles.add(role);
      //   this.logger.log(
      //     `Assigned "verified" role to the bot in guild ${guild.name} (${guild.id})`,
      //   );
      // } else {
      //   this.logger.warn(
      //     `Bot member not found in guild ${guild.name} (${guild.id})`,
      //   );
      // }
    } catch (error) {
      this.logger.error(
        `Error creating role in guild ${guild.name} (${guild.id}):`,
        error,
      );
    }
  };

  assignRole = async (message: Message, role: Role) => {
    try {
      const assignedGuilds: string[] = [];
      for (const guild of this.client.guilds.cache.values()) {
        try {
          const member = await guild.members
            .fetch(message.author.id)
            .catch(() => null);
          if (member) {
            const existingRole = guild.roles.cache.find((r) => r.name === role);
            if (existingRole) {
              await member.roles.add(existingRole);
              this.logger.log(
                `Assigned role ${role} to ${message.author.id} in guild ${guild.name} (${guild.id})`,
              );
              assignedGuilds.push(guild.name);
            } else {
              this.logger.warn(
                `Role "${role}" not found in guild ${guild.name} (${guild.id})`,
              );
            }
          }
        } catch (error) {
          this.logger.error(
            `Failed to assign role in guild ${guild.id} for ${message.author.id}:`,
            error,
          );
        }
      }

      if (assignedGuilds.length > 0) {
        await message.reply(
          `Verification successful! You have been assigned the "${role}" role in: ${assignedGuilds.join(', ')}.`,
        );
      } else {
        await message.reply(
          `Verification successful, but the "${role}" role was not found in any mutual servers or the bot lacks permissions.`,
        );
      }
    } catch (error) {
      this.logger.error('Error verifying code:', error);
      await message.reply(
        'An error occurred during verification. Please try again later.',
      );
    }
  };

  // assignRoleToUser = async (
  //   userId: string,
  //   reply: (msg: string) => Promise<any>,
  //   role: Role,
  // ) => {
  //   const assignedGuilds: string[] = [];

  //   for (const guild of this.client.guilds.cache.values()) {
  //     const member = await guild.members.fetch(userId).catch(() => null);
  //     if (!member) continue;

  //     const existingRole = guild.roles.cache.find((r) => r.name === role);
  //     if (!existingRole) continue;

  //     await member.roles.add(existingRole);
  //     assignedGuilds.push(guild.name);
  //   }

  //   if (assignedGuilds.length > 0) {
  //     await reply(
  //       `Verification successful! Role assigned in: ${assignedGuilds.join(', ')}`,
  //     );
  //   } else {
  //     await reply(
  //       `Verification successful, but the role was not found or permissions are missing.`,
  //     );
  //   }
  // };

  // assignRoleToUser = async (
  //   userId: string,
  //   reply: (msg: string) => Promise<any>,
  //   roleName: string,
  // ) => {
  //   const assignedGuilds: string[] = [];

  //   for (const guild of this.client.guilds.cache.values()) {
  //     const member = await guild.members.fetch(userId).catch(() => null);
  //     if (!member) continue;

  //     const role = guild.roles.cache.find((r) => r.name === roleName);
  //     if (!role) continue;

  //     const botMember = guild.members.me;
  //     if (!botMember?.permissions.has('ManageRoles')) continue;
  //     if (role.position >= botMember.roles.highest.position) continue;

  //     await member.roles.add(role);
  //     assignedGuilds.push(guild.name);
  //   }

  //   if (assignedGuilds.length > 0) {
  //     await reply(
  //       `✅ Verification successful! Role assigned in: ${assignedGuilds.join(', ')}`,
  //     );
  //   } else {
  //     await reply(
  //       `⚠️ Verification successful, but the role could not be assigned. Please ensure the bot role is above "${roleName}".`,
  //     );
  //   }
  // };

  async assignRoleToUser(guildId: string, userId: string, role: Role) {
    try {
      const guild = await this.client.guilds.fetch(guildId).catch(() => null);
      if (!guild) {
        console.log(`Guild ${guildId} not found or bot is not in it`);
        return;
      }

      // Check if bot is a member
      const botMember = await guild.members
        .fetch(this.client.user.id)
        .catch(() => null);
      if (!botMember) {
        console.log(`Bot is not a member of guild ${guild.name}`);
        return;
      }

      // console.log(`Bot is a member of guild ${guild.name}`);
      // console.log(guildId);

      // // Fetch the guild
      // const guild = await this.client.guilds.fetch(guildId);
      // console.log(guild);

      if (!guild) {
        this.logger.warn(`Guild ${guildId} not found`);
        return;
      }

      // Fetch the member
      const member = await guild.members.fetch(userId);
      if (!member) {
        this.logger.warn(`User ${userId} not found in guild ${guild.name}`);
        return;
      }

      // Find the role
      let roleToAssign = guild.roles.cache.find((r) => r.name === role);
      if (!roleToAssign) {
        // Optionally create the role if it doesn't exist
        roleToAssign = await guild.roles.create({
          name: role,
          mentionable: true,
          reason: `Created role ${role} for bot`,
        });
        this.logger.log(`Role ${role} created in guild ${guild.name}`);
      }

      // Assign the role
      if (!member.roles.cache.has(roleToAssign.id)) {
        await member.roles.add(roleToAssign);
        this.logger.log(`Assigned role ${role} to user ${member.user.tag}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to assign role ${role} to user ${userId} in guild ${guildId}:`,
        error,
      );
    }
  }

  verifyServerSubmittion = async (userId, guildId) => {
    let guild;
    try {
      guild = await this.client.guilds.fetch(guildId);
    } catch {
      throw new BadRequestException(
        'Bot is not in this server. Please add the bot first.',
      );
    }
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member || !member.permissions.has('Administrator')) {
      throw new ForbiddenException(
        'You must be an admin/mod of this server to submit it.',
      );
    }

    const serverDetail = {
      guildId,
      name: guild.name,
      icon: guild.iconURL({ size: 256 }) || null,
    };

    return serverDetail;
  };

  updateGuildStats = async (guildId: string) => {
    const guild = await this.client.guilds.fetch(guildId);
    await guild.members.fetch();

    const totalMembers = guild.memberCount;
    const activeMembers = guild.members.cache.filter(
      (m) =>
        m.presence && ['online', 'idle', 'dnd'].includes(m.presence.status),
    ).size;

    return { totalMembers, activeMembers };
  };
}
