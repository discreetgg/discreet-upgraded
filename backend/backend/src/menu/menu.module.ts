import { Module } from '@nestjs/common';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';
import { JwtModule } from '@nestjs/jwt';
import { FileUploaderModule } from 'src/file-uploader/file-uploader.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Menu, MenuSchema } from 'src/database/schemas/menu.schema';
import { User, UserSchema } from 'src/database/schemas/user.schema';
import { Category, CategorySchema } from 'src/database/schemas/category.schema';
import { Media, MediaSchema } from 'src/database/schemas/media.schema';
import {
  MenuMedia,
  MenuMediaSchema,
} from 'src/database/schemas/menu-media.schema';

@Module({
  imports: [
    JwtModule,
    FileUploaderModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Menu.name, schema: MenuSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Media.name, schema: MediaSchema },
      { name: MenuMedia.name, schema: MenuMediaSchema },
    ]),
  ],
  providers: [MenuService],
  controllers: [MenuController],
  exports: [MenuService],
})
export class MenuModule {}
