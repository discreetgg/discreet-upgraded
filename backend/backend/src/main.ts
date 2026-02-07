import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import { json, urlencoded } from 'express';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const PORT = process.env.PORT || 3001;

  // app.enableCors({
  //   origin: '*',
  //   credentials: true,
  // });

  // Store current request path globally (only during CORS check)
  let currentPath = '';

  // Tiny middleware that runs BEFORE CORS and captures the path
  app.use((req, res, next) => {
    currentPath = req.originalUrl || req.url;
    next();
  });

  const allowedOrigins = [
    'https://discreet-mocha.vercel.app',
    'https://www.discreet.gg',
  ];

  const regexWhitelist = [
    /^http:\/\/localhost:\d+$/, // localhost:port
    /^http:\/\/127\.0\.0\.1:\d+$/, // 127.0.0.1:port
    /^https:\/\/.*\.?discreet\.fan$/, // any subdomain of discreet.fan
    /^https:\/\/.*\.?discreet\.fans$/, // any subdomain of discreet.fans
    /^https:\/\/.*\.?discreet\.gg$/, // any subdomain of discreet.gg
  ];

  app.enableCors({
    origin: (origin, callback) => {
      console.log(currentPath);
      if (!origin) return callback(null, true); // allow Postman/curl

      // WEBHOOK BYPASS: Allow ANY origin (or no origin) for /webhooks/check
      if (currentPath?.includes('/webhooks/ondato')) {
        console.log(
          `CORS bypassed for webhook → ${currentPath} | Origin: ${origin || 'server-to-server'}`,
        );
        return callback(null, true); // This allows everything
      }

      const allowed =
        allowedOrigins.includes(origin) ||
        regexWhitelist.some((regex) => regex.test(origin));

      if (allowed) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
  });

  // Increase request size limit to 100 GB
  app.use(json({ limit: '100gb' }));
  app.use(urlencoded({ limit: '100gb', extended: true }));
  app.use(cookieParser());
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      // stopAtFirstError: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Discreet API')
    .setDescription('API documentation for the Discreet application')
    .setVersion('1.0')
    .addServer(`http://localhost:${PORT}`, 'Development Server')
    .addServer(`https://api.discreet.fans`, 'Production Server')
    .addTag('Auth', 'Authentication and authorization operations')
    .addTag('User', 'Users operations')
    .addCookieAuth('auth_token')
    // .addCookieAuth('auth_token')
    .addOAuth2({
      type: 'oauth2',
      flows: {
        authorizationCode: {
          authorizationUrl: 'https://discord.com/oauth2/authorize',
          tokenUrl: 'https://discord.com/api/oauth2/token',
          scopes: {
            identify: 'Access basic user info',
            email: 'access user email',
          },
        },
      },
    })
    .addTag('Post', 'Creators post operations')
    .addTag('Media', 'To proxy any media file')
    // .addTag('messages', 'Operations related to messages')
    // .addTag('groups', 'Operations related to groups')
    // .addTag('files', 'Operations related to file uploads and downloads')
    // .addTag('notifications', 'Operations related to notifications')
    // .addTag('settings', 'Operations related to user settings')
    // .addTag('auth', 'Authentication and authorization operations')
    // .addTag('admin', 'Administrative operations')
    // .addTag('analytics', 'Analytics and reporting operations')
    // .addTag('search', 'Search operations')
    // .addTag('integration', 'Third-party integrations')
    // .addTag('webhooks', 'Webhook management operations')
    // .addTag('audit', 'Audit and logging operations')
    // .addTag('support', 'Support and helpdesk operations')
    // .addTag('feedback', 'User feedback and suggestions')
    // .addTag('legal', 'Legal and compliance operations')
    // .addTag('billing', 'Billing and subscription management')
    // .addTag('performance', 'Performance monitoring and optimization')
    // .addTag('security', 'Security operations and configurations')
    // .addTag('data', 'Data management and operations')
    // .addTag('configuration', 'Configuration and settings management')
    // .addTag('localization', 'Localization and internationalization')
    // .addTag('notifications', 'Notification management and operations')
    // .addTag('scheduling', 'Scheduling and calendar operations')
    // .addTag('tasks', 'Task management operations')
    // .addTag('reports', 'Reporting and analytics operations')
    // .addTag('logs', 'Logging and monitoring operations')
    // .addTag('api-keys', 'API key management operations')
    // .addTag('oauth', 'OAuth and third-party authentication')
    // .addTag('websockets', 'WebSocket operations')
    // .addTag('graphql', 'GraphQL operations')
    // .addTag('rest', 'RESTful API operations')
    // .addTag('graphql', 'GraphQL API operations')
    // .addTag('rest', 'REST API operations')
    // .addTag('graphql', 'GraphQL API operations')
    // .addTag('rest', 'REST API operations')
    // .addTag('graphql', 'GraphQL API operations')
    // .addTag('rest', 'REST API operations')
    // .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      oauth2RedirectUrl: process.env.DISCORD_REDIRECT_URI,
      oauth: {
        clientId: process.env.DISCORD_CLIENT_ID,
        usePkceWithAuthorizationCodeGrant: true,
        scopes: 'identify',
      },
      withCredentials: true, // Important for cookies
    },
  });
  await app.listen(PORT);
}
bootstrap();
