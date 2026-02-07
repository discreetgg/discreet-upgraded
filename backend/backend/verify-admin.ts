import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { AdminService } from './src/admin/admin.service';
import { AuthService } from './src/auth/auth.service';
import { User } from './src/database/schemas/user.schema';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as request from 'supertest';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.init();

  const userModel = app.get<Model<User>>(getModelToken(User.name));
  const authService = app.get(AuthService);

  // 1. Create/Get Admin User
  let admin = await userModel.findOne({ email: 'admin@test.com' });
  if (!admin) {
    console.log('Creating Admin User...');
    // Create verify-admin user manually to bypass registration restrictions if any
    // Depending on how registration is handled, direct DB insertion is safer for test
    admin = await userModel.create({
      email: 'admin@test.com',
      username: 'admin',
      displayName: 'Admin User',
      password: 'password', // AuthService usually hashes this or we need to hash it manually? 
      // Checking auth service: normally register hashes it. 
      // For this test, let's assume we can use a direct create but password might need hashing if login uses bcrypt compare
      // Let's try to find an existing user or just update one to be admin
      role: 'admin',
      discordId: 'admin-discord-id',
      discordDisplayName: 'Admin',
    });
  } else {
    // Ensure role is admin
    admin.role = 'admin' as any;
    await admin.save();
  }

  // Create normal users for testing
  let user1 = await userModel.findOne({ email: 'user1@test.com' });
  if (!user1) {
    user1 = await userModel.create({
      email: 'user1@test.com',
      username: 'user1',
      displayName: 'User One',
      discordId: 'user1-id',
      discordDisplayName: 'UserOne',
    });
  }

  // Generate Admin Token
  // We need to see how AuthService generates token. 
  // Assuming authService.login(user) or similar.
  // Accessing private method might be hard, so let's use JwtService directly if simple
  // OR mock the login flow.
  
  // Let's assume we can mock the token or just use a valid one if we knew the secret.
  // Since we are inside the app context, we can use JwtService.
  const jwtService = app.get('JwtService'); // might key is JwtService class
  const token = jwtService.sign({ sub: admin._id, email: admin.email, role: admin.role });
  const adminCookie = `auth_token=${token}`;

  const server = app.getHttpServer();

  console.log('--- Testing Admin Endpoints ---');

  // 2. Ban User
  console.log('Banning User 1...');
  await request(server)
    .patch(`/admin/users/${user1._id}/ban`)
    .set('Cookie', [adminCookie])
    .send({ reason: 'violation of rules' })
    .expect(200);

  // 3. Get Banned Users
  console.log('Fetching Banned Users...');
  const res = await request(server)
    .get('/admin/users/banned')
    .set('Cookie', [adminCookie])
    .expect(200);

  const bannedParams = res.body.find(u => u._id === user1._id.toString());
  if (bannedParams && bannedParams.banReason === 'violation of rules') {
    console.log('PASS: User 1 found in banned list with correct reason');
  } else {
    console.error('FAIL: User 1 not found or reason mismatch', res.body);
  }

  // 4. Unban User
  console.log('Unbanning User 1...');
  await request(server)
    .patch(`/admin/users/${user1._id}/unban`)
    .set('Cookie', [adminCookie])
    .expect(200);

    // Verify unban
  const user1Refreshed = await userModel.findById(user1._id);
  if (!user1Refreshed.isBanned) {
      console.log('PASS: User 1 unbanned successfully');
  } else {
      console.error('FAIL: User 1 still banned');
  }

  console.log('--- Tests Completed ---');
  await app.close();
  process.exit(0);
}

bootstrap();
