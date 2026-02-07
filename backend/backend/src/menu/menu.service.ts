import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { CollectionType, Menu } from 'src/database/schemas/menu.schema';
import { User } from 'src/database/schemas/user.schema';
import { FileUploaderService } from 'src/file-uploader/file-uploader.service';
import {
  CreateMenuDto,
  MediaMetaDto,
  UpdateMenuDto,
} from './dto/create-menu.dto';
import {
  Category,
  CategoryDocument,
} from 'src/database/schemas/category.schema';
import { Media } from 'src/database/schemas/media.schema';
import { CreateCategoryDto } from './dto/creator-menu-category';
import { MenuMedia } from 'src/database/schemas/menu-media.schema';

@Injectable()
export class MenuService {
  private logger = new Logger(MenuService.name);

  constructor(
    private readonly fileUploaderService: FileUploaderService,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Menu.name) private readonly menuModel: Model<Menu>,
    @InjectModel(Media.name) private readonly mediaModel: Model<Media>,
    @InjectModel(MenuMedia.name)
    private readonly menuMediaModel: Model<MenuMedia>,
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // MENUs
  // ─────────────────────────────────────────────────────────────

  // async createMenu(
  //   userId: string,
  //   dto: CreateMenuDto,
  //   files: Express.Multer.File[] = [],
  //   mediaMeta: MediaMetaDto[] = [],
  // ): Promise<Menu> {
  //   console.log('menu dto :', dto);
  //   const session = await this.connection.startSession();
  //   session.startTransaction();

  //   // Keep track of successfully uploaded files for cleanup if needed
  //   const uploadedFiles: { public_id: string }[] = [];

  //   try {
  //     const user = await this.userModel
  //       .findOne({ discordId: userId })
  //       .session(session);
  //     if (!user) throw new NotFoundException('User not found');

  //     if (!dto.description && files.length === 0) {
  //       throw new BadRequestException('Menu must have description and media');
  //     }

  //     // Validate category
  //     if (dto.category) {
  //       let category = await this.categoryModel.findOne({
  //         normalizedCategory: dto.category.toLowerCase(),
  //         owner: user._id,
  //       });

  //       if (!category) {
  //         category = new this.categoryModel({
  //           category: dto.category,
  //           normalizedCategory: dto.category.toLowerCase(), // ensure normalized field is set
  //           hashtag: await this.toHashtag(dto.category),
  //           owner: user._id,
  //         });

  //         await category.save({ session });
  //       }

  //       dto.category = category._id.toString();
  //       await this.categoryModel.updateOne(
  //         { _id: category._id },
  //         { $inc: { usageCount: 1 } },
  //       );
  //     }

  //     // Step 1: create post (inside transaction)
  //     const menu = await new this.menuModel({
  //       ...dto,
  //       owner: user.id,
  //     }).save({ session });

  //     if (files.length > 0 && files.length !== mediaMeta.length) {
  //       throw new BadRequestException(
  //         'Each file must have a corresponding mediaMeta entry',
  //       );
  //     }

  //     if (files.length > 0) {
  //       const [coverMedia, ...menuMedias] = files;

  //       // Upload cover image
  //       const uploadedCoverMedia =
  //         await this.fileUploaderService.uploadImage(coverMedia);
  //       uploadedFiles.push({ public_id: uploadedCoverMedia.public_id });

  //       if (menuMedias.length > 0 && menuMedias.length !== mediaMeta.length) {
  //         throw new BadRequestException(
  //           'Each file must have a corresponding mediaMeta entry',
  //         );
  //       }

  //       // 1️⃣ Upload all media in parallel
  //       const uploads = await Promise.all(
  //         menuMedias.map(async (file, i) => {
  //           const meta = mediaMeta?.[i];
  //           if (!meta)
  //             throw new BadRequestException(`Missing metadata at index ${i}`);

  //           const upload =
  //             meta.type === 'video'
  //               ? await this.fileUploaderService.uploadVideo(file)
  //               : await this.fileUploaderService.uploadImage(file);

  //           uploadedFiles.push({ public_id: upload.public_id });

  //           return {
  //             url: upload.url,
  //             public_id: upload.public_id,
  //             type: meta.type,
  //             caption: meta.caption || '',
  //             uploadedAt: new Date(),
  //             owner: user._id,
  //             menu: menu._id, // ✅ include the menu reference
  //           };
  //         }),
  //       );

  //       // 2️⃣ Bulk insert all Media
  //       const insertedMedia = await this.mediaModel.insertMany(uploads, {
  //         session,
  //       });

  //       // 3️⃣ Prepare MenuMedia documents
  //       const menuMediaDocs = insertedMedia.map((m) => ({
  //         media: m._id,
  //         menu: menu._id,
  //         isSold: false,
  //         boughtBy: null,
  //       }));

  //       // 4️⃣ Bulk insert all MenuMedia
  //       const insertedMenuMedias = await this.menuMediaModel.insertMany(
  //         menuMediaDocs,
  //         { session },
  //       );

  //       // 5️⃣ Update Menu with cover and list of media
  //       await this.menuModel.findByIdAndUpdate(
  //         menu._id,
  //         {
  //           media: insertedMenuMedias.map((mm) => mm._id),
  //           coverImage: {
  //             url: uploadedCoverMedia.url,
  //             public_id: uploadedCoverMedia.public_id,
  //           },
  //           collectionType:
  //             insertedMenuMedias.length > 1
  //               ? CollectionType.BUNDLES
  //               : CollectionType.SINGLE,
  //         },
  //         { session },
  //       );
  //     }

  //     // Step 3: commit transaction
  //     await session.commitTransaction();
  //     session.endSession();

  //     // Step 4: return the final populated post
  //     const finalMenu = await this.menuModel
  //       .findById(menu.id)
  //       .populate({
  //         path: 'media',
  //         populate: [
  //           { path: 'media', model: 'Media' },
  //           { path: 'boughtBy', model: 'User', select: 'username displayName' },
  //         ],
  //       })
  //       .populate('category')
  //       .populate({
  //         path: 'owner',
  //         select:
  //           'id discordId username displayName discordAvatar role profileImage',
  //       })
  //       .lean();

  //     return finalMenu;
  //   } catch (error) {
  //     // Rollback DB
  //     await session.abortTransaction();
  //     session.endSession();

  //     // Cleanup orphaned uploads if DB failed after upload
  //     if (uploadedFiles.length > 0) {
  //       try {
  //         await Promise.all(
  //           uploadedFiles.map((f) =>
  //             this.fileUploaderService.deleteFile(f.public_id),
  //           ),
  //         );
  //         this.logger.warn(
  //           `Rolled back and cleaned up ${uploadedFiles.length} orphaned files.`,
  //         );
  //       } catch (cleanupErr) {
  //         this.logger.error('Failed to cleanup orphaned uploads', cleanupErr);
  //       }
  //     }

  //     this.logger.error(error);
  //     if (error instanceof HttpException) {
  //       throw error;
  //     }
  //     throw new BadRequestException('Failed to create Menu');
  //   }
  // }

  async createMenu(
    userId: string,
    dto: CreateMenuDto,
    files: Express.Multer.File[] = [],
    mediaMeta: MediaMetaDto[] = [],
  ): Promise<Menu> {
    const session = await this.connection.startSession();
    session.startTransaction();

    const uploadedFiles: { public_id: string }[] = [];

    try {
      // 1️⃣ Validate user
      const user = await this.userModel
        .findOne({ discordId: userId })
        .session(session);
      if (!user) throw new NotFoundException('User not found');

      if (!dto.description && files.length === 0) {
        throw new BadRequestException('Menu must have description and media');
      }

      // 2️⃣ Validate or create category
      if (dto.category) {
        let category = await this.categoryModel.findOne({
          normalizedCategory: dto.category.toLowerCase(),
          owner: user._id,
        });

        if (!category) {
          category = new this.categoryModel({
            category: dto.category,
            normalizedCategory: dto.category.toLowerCase(),
            hashtag: await this.toHashtag(dto.category),
            owner: user._id,
          });

          await category.save({ session });
        }

        dto.category = category._id.toString();
        await this.categoryModel.updateOne(
          { _id: category._id },
          { $inc: { usageCount: 1 } },
          { session },
        );
      }

      // 3️⃣ Create menu (bare minimum first)
      const menu = await new this.menuModel({
        ...dto,
        owner: user._id,
      }).save({ session });

      // 4️⃣ Validate media input
      if (files.length > 0 && files.length !== mediaMeta.length) {
        throw new BadRequestException(
          'Each file must have a corresponding mediaMeta entry',
        );
      }

      if (files.length > 0) {
        // console.log(mediaMeta);

        const cleanedmediaMeta = mediaMeta
          .map((item) => {
            if (typeof item === 'string') {
              try {
                return JSON.parse(item);
              } catch {
                console.warn('Invalid JSON string skipped:', item);
                return null; // or handle differently
              }
            }
            return item;
          })
          .filter(Boolean); // remove any nulls
        // First file = cover image
        const [coverFile, ...menuFiles] = files;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [coverMeta, ...menuMeta] = cleanedmediaMeta;

        // console.log(menuMeta);

        // Upload cover
        const uploadedCover =
          await this.fileUploaderService.uploadImage(coverFile);
        uploadedFiles.push({ public_id: uploadedCover.public_id });

        // Upload all menu media in parallel
        const uploads = await Promise.all(
          menuFiles.map(async (file, i) => {
            const meta = menuMeta?.[i];
            if (!meta)
              throw new BadRequestException(`Missing metadata at index ${i}`);

            const upload =
              meta.type === 'video'
                ? await this.fileUploaderService.uploadVideo(file)
                : await this.fileUploaderService.uploadImage(file);

            uploadedFiles.push({ public_id: upload.public_id });

            return {
              url: upload.url,
              public_id: upload.public_id,
              type: meta.type,
              caption: meta.caption || '',
              uploadedAt: new Date(),
              owner: user._id,
              menu: menu._id,
            };
          }),
        );

        // console.log(uploads);
        // Bulk insert into Media collection
        const insertedMedia = await this.mediaModel.insertMany(uploads, {
          session,
        });

        // console.log(insertedMedia);

        // Create MenuMedia entries
        const menuMediaDocs = insertedMedia.map((m) => ({
          media: m._id,
          menu: menu._id,
          sold: false,
          buyer: null,
        }));

        const insertedMenuMedia = await this.menuMediaModel.insertMany(
          menuMediaDocs,
          {
            session,
          },
        );

        console.log(insertedMenuMedia);

        // Update menu with cover & media
        await this.menuModel.findByIdAndUpdate(
          menu._id,
          {
            media: insertedMenuMedia.map((mm) => mm._id),
            coverImage: {
              url: uploadedCover.url,
              public_id: uploadedCover.public_id,
            },
            collectionType:
              insertedMenuMedia.length > 1
                ? CollectionType.BUNDLES
                : CollectionType.SINGLE,
            itemCount: insertedMedia.length,
          },
          { session },
        );
      }

      // 5️⃣ Commit transaction
      await session.commitTransaction();

      // Clear uploaded file tracking after success
      uploadedFiles.length = 0;

      // 6️⃣ Return populated menu
      const finalMenu = await this.menuModel
        .findById(menu._id)
        .populate({
          path: 'media',
          populate: [
            { path: 'media', model: 'Media' },
            { path: 'buyer', model: 'User', select: 'username displayName' },
          ],
        })
        .populate('category')
        .populate({
          path: 'owner',
          select:
            'id discordId username displayName discordAvatar role profileImage',
        })
        .lean();

      return finalMenu;
    } catch (error) {
      // console.log(error);
      // Rollback
      await session.abortTransaction();

      // Cleanup orphan uploads
      if (uploadedFiles.length > 0) {
        try {
          await Promise.all(
            uploadedFiles.map((f) =>
              this.fileUploaderService.deleteFile(f.public_id),
            ),
          );
          this.logger.warn(
            `Rolled back and cleaned up ${uploadedFiles.length} orphaned files.`,
          );
        } catch (cleanupErr) {
          this.logger.error('Failed to cleanup orphaned uploads', cleanupErr);
        }
      }

      this.logger.error(error);
      if (error instanceof HttpException) throw error;
      throw new BadRequestException('Failed to create Menu');
    } finally {
      session.endSession();
    }
  }

  // async updateMenu(
  //   userId: string,
  //   menuId: string,
  //   dto: UpdateMenuDto,
  //   files: Express.Multer.File[] = [],
  //   mediaMeta: MediaMetaDto[] = [],
  // ): Promise<Menu> {
  //   const session = await this.connection.startSession();
  //   session.startTransaction();

  //   const uploadedFiles: { public_id: string }[] = [];

  //   try {
  //     // Step 1: Validate user
  //     const user = await this.userModel
  //       .findOne({ discordId: userId })
  //       .session(session);
  //     if (!user) throw new NotFoundException('User not found');

  //     // Step 2: Fetch menu
  //     const menu = await this.menuModel
  //       .findOne({ _id: menuId, owner: user._id })
  //       .populate('category')
  //       .session(session);

  //     if (!menu)
  //       throw new NotFoundException('Menu not found or user not owner of menu');
  //     if (menu.itemSold > 0)
  //       throw new BadRequestException(
  //         "Menu can't be updated, an item has been sold",
  //       );

  //     // Step 3: Handle category update
  //     const existingCategory = menu.category as CategoryDocument;

  //     if (dto.category) {
  //       const normalizedCategory = dto.category.toLowerCase();
  //       const currentCategoryNormalized = existingCategory?.normalizedCategory;
  //       const isSameCategory = normalizedCategory === currentCategoryNormalized;

  //       if (!isSameCategory) {
  //         let category = await this.categoryModel
  //           .findOne({ normalizedCategory, owner: user._id })
  //           .session(session);

  //         if (!category) {
  //           category = new this.categoryModel({
  //             category: dto.category,
  //             normalizedCategory,
  //             hashtag: await this.toHashtag(dto.category),
  //             owner: user._id,
  //           });
  //           await category.save({ session });
  //         }

  //         dto.category = category._id.toString();

  //         await this.categoryModel
  //           .updateOne({ _id: category._id }, { $inc: { usageCount: 1 } })
  //           .session(session);

  //         // Decrease or delete old category usage
  //         if (existingCategory) {
  //           if (existingCategory.usageCount === 1) {
  //             await this.categoryModel
  //               .deleteOne({ _id: existingCategory._id })
  //               .session(session);
  //           } else if (existingCategory.usageCount > 1) {
  //             await this.categoryModel
  //               .updateOne(
  //                 { _id: existingCategory._id },
  //                 { $inc: { usageCount: -1 } },
  //               )
  //               .session(session);
  //           }
  //         }
  //       } else {
  //         dto.category = existingCategory._id.toString();
  //       }
  //     }

  //     // Step 4: Update menu fields (inside transaction)
  //     const updatedMenu = await this.menuModel
  //       .findByIdAndUpdate(menu._id, { ...dto }, { new: true, session })
  //       .populate('media');

  //     // Step 5: Validate file/meta count
  //     if (files.length > 0 && files.length !== mediaMeta.length) {
  //       throw new BadRequestException(
  //         'Each file must have a corresponding mediaMeta entry',
  //       );
  //     }

  //     // Step 6: Handle uploads
  //     if (files.length > 0) {
  //       let uploadedCoverMedia: any = null;
  //       const uploadedMenuMedia: string[] = [];

  //       // Determine cover image upload
  //       const [coverFile, ...menuFiles] = updatedMenu.coverImage
  //         ? [null, ...files]
  //         : [files[0], ...files.slice(1)];

  //       // Upload cover if missing
  //       if (!updatedMenu.coverImage && coverFile) {
  //         uploadedCoverMedia =
  //           await this.fileUploaderService.uploadImage(coverFile);
  //         uploadedFiles.push({ public_id: uploadedCoverMedia.public_id });
  //       }

  //       // Upload media files
  //       await Promise.all(
  //         menuFiles.map(async (file, i) => {
  //           const meta = mediaMeta?.[i];
  //           if (!meta)
  //             throw new BadRequestException(
  //               `Missing media meta for file index ${i}`,
  //             );

  //           try {
  //             let upload;
  //             if (meta.type === 'image') {
  //               upload = await this.fileUploaderService.uploadImage(file);
  //             } else if (meta.type === 'video') {
  //               upload = await this.fileUploaderService.uploadVideo(file);
  //             } else {
  //               throw new BadRequestException(
  //                 `Unknown media type at index ${i}`,
  //               );
  //             }

  //             uploadedFiles.push({ public_id: upload.public_id });

  //             const savedMedia = await new this.mediaModel({
  //               url: upload.url,
  //               public_id: upload.public_id,
  //               type: meta.type,
  //               caption: meta.caption || '',
  //               uploadedAt: new Date(),
  //               menu: menu.id,
  //               owner: user.id,
  //             }).save({ session });

  //             uploadedMenuMedia.push(savedMedia.id);
  //           } catch (err) {
  //             throw new BadRequestException(
  //               `Failed to upload media at index ${i}: ${err.message || err}`,
  //             );
  //           }
  //         }),
  //       );

  //       // Compute new collection type
  //       const totalMediaCount =
  //         updatedMenu.media.length + uploadedMenuMedia.length;
  //       const collectionType =
  //         totalMediaCount > 1 ? CollectionType.BUNDLES : CollectionType.SINGLE;

  //       // Step 7: Update menu with new media + cover
  //       await this.menuModel
  //         .findByIdAndUpdate(
  //           updatedMenu.id,
  //           {
  //             $addToSet: { media: { $each: uploadedMenuMedia } },
  //             $set: {
  //               coverImage:
  //                 updatedMenu.coverImage ??
  //                 (uploadedCoverMedia && {
  //                   url: uploadedCoverMedia.url,
  //                   public_id: uploadedCoverMedia.public_id,
  //                 }),
  //               collectionType,
  //             },
  //           },
  //           { session, new: true },
  //         )
  //         .session(session);
  //     }

  //     // Step 8: Commit transaction
  //     await session.commitTransaction();
  //     session.endSession();

  //     // Step 9: Return populated menu
  //     const finalUpdatedMenu = await this.menuModel
  //       .findById(menu.id)
  //       .populate('media')
  //       .populate('category')
  //       .populate({
  //         path: 'owner',
  //         select:
  //           'id discordId username displayName discordAvatar role profileImage',
  //       })
  //       .lean();

  //     return finalUpdatedMenu;
  //   } catch (error) {
  //     // Rollback DB
  //     await session.abortTransaction();
  //     session.endSession();

  //     // Cleanup orphaned uploads
  //     if (uploadedFiles.length > 0) {
  //       try {
  //         await Promise.all(
  //           uploadedFiles.map((f) =>
  //             this.fileUploaderService.deleteFile(f.public_id),
  //           ),
  //         );
  //         this.logger.warn(
  //           `Rolled back and cleaned up ${uploadedFiles.length} orphaned files.`,
  //         );
  //       } catch (cleanupErr) {
  //         this.logger.error('Failed to cleanup orphaned uploads', cleanupErr);
  //       }
  //     }

  //     console.log(error);
  //     this.logger.error(error);
  //     if (error instanceof HttpException) throw error;

  //     throw new BadRequestException('Failed to update Menu');
  //   }
  // }

  async updateMenu(
    userId: string,
    menuId: string,
    dto: UpdateMenuDto,
    files: Express.Multer.File[] = [],
    mediaMeta: MediaMetaDto[] = [],
  ): Promise<Menu> {
    console.log('updatinggg');
    const session = await this.connection.startSession();
    session.startTransaction();

    const uploadedFiles: { public_id: string }[] = [];

    try {
      // 1️⃣ Validate user
      const user = await this.userModel
        .findOne({ discordId: userId })
        .session(session);
      if (!user) throw new NotFoundException('User not found');

      // 2️⃣ Fetch menu
      const menu = await this.menuModel
        .findOne({ _id: menuId, owner: user._id })
        .populate('category')
        .populate('media')
        .session(session);

      if (!menu)
        throw new NotFoundException('Menu not found or user not owner of menu');
      if (menu.itemSold > 0)
        throw new BadRequestException(
          "Menu can't be updated, an item has already been sold",
        );

      // 3️⃣ Handle category update
      const existingCategory = menu.category as CategoryDocument;

      if (dto.category) {
        const normalizedCategory = dto.category.toLowerCase();
        const currentCategoryNormalized = existingCategory?.normalizedCategory;
        const isSameCategory = normalizedCategory === currentCategoryNormalized;

        if (!isSameCategory) {
          let category = await this.categoryModel
            .findOne({ normalizedCategory, owner: user._id })
            .session(session);

          if (!category) {
            category = new this.categoryModel({
              category: dto.category,
              normalizedCategory,
              hashtag: await this.toHashtag(dto.category),
              owner: user._id,
            });
            await category.save({ session });
          }

          dto.category = category._id.toString();

          await this.categoryModel
            .updateOne({ _id: category._id }, { $inc: { usageCount: 1 } })
            .session(session);

          // Adjust old category usage
          if (existingCategory) {
            if (existingCategory.usageCount === 1) {
              await this.categoryModel
                .deleteOne({ _id: existingCategory._id })
                .session(session);
            } else {
              await this.categoryModel
                .updateOne(
                  { _id: existingCategory._id },
                  { $inc: { usageCount: -1 } },
                )
                .session(session);
            }
          }
        } else {
          dto.category = existingCategory._id.toString();
        }
      }

      // 4️⃣ Update menu core fields
      await this.menuModel.findByIdAndUpdate(menu._id, { ...dto }, { session });

      // 5️⃣ Handle new media uploads (if any)
      if (files.length > 0) {
        if (files.length !== mediaMeta.length) {
          throw new BadRequestException(
            'Each uploaded file must have a matching mediaMeta entry',
          );
        }

        // If menu already has a cover image, first uploaded file is treated as normal media
        const [coverFile, ...menuFiles] = menu.coverImage
          ? [null, ...files] // existing cover image → treat all as media
          : [files[0], ...files.slice(1)]; // no cover → use first as cover

        // If there is no cover image yet, upload and set it
        let uploadedCoverMedia = null;
        if (!menu.coverImage && coverFile) {
          uploadedCoverMedia =
            await this.fileUploaderService.uploadImage(coverFile);
          uploadedFiles.push({ public_id: uploadedCoverMedia.public_id });
        }

        // Upload all remaining media
        const uploadedMediaData = await Promise.all(
          menuFiles.map(async (file, i) => {
            const meta = mediaMeta?.[menu.coverImage ? i : i + 1];
            if (!meta)
              throw new BadRequestException(`Missing metadata at index ${i}`);

            const upload =
              meta.type === 'video'
                ? await this.fileUploaderService.uploadVideo(file)
                : await this.fileUploaderService.uploadImage(file);

            uploadedFiles.push({ public_id: upload.public_id });

            return {
              url: upload.url,
              public_id: upload.public_id,
              type: meta.type,
              caption: meta.caption || '',
              uploadedAt: new Date(),
              owner: user._id,
              menu: menu._id,
            };
          }),
        );

        // 6️⃣ Insert media into Media collection
        const insertedMedia = await this.mediaModel.insertMany(
          uploadedMediaData,
          {
            session,
          },
        );

        // 7️⃣ Insert into MenuMedia
        const menuMediaDocs = insertedMedia.map((m) => ({
          media: m._id,
          menu: menu._id,
          sold: false,
          buyer: null,
        }));

        const insertedMenuMedias = await this.menuMediaModel.insertMany(
          menuMediaDocs,
          { session },
        );

        // 8️⃣ Update Menu document
        await this.menuModel.findByIdAndUpdate(
          menu._id,
          {
            $addToSet: {
              media: { $each: insertedMenuMedias.map((mm) => mm._id) },
            },
            $set: {
              coverImage:
                menu.coverImage ||
                (uploadedCoverMedia && {
                  url: uploadedCoverMedia.url,
                  public_id: uploadedCoverMedia.public_id,
                }),
              collectionType:
                menu.media.length + insertedMenuMedias.length > 1
                  ? CollectionType.BUNDLES
                  : CollectionType.SINGLE,
              itemCount: menu.media.length + insertedMenuMedias.length,
            },
          },
          { session },
        );
      }

      // 9️⃣ Commit transaction
      await session.commitTransaction();
      session.endSession();

      // 🔟 Return populated final menu
      const finalMenu = await this.menuModel
        .findById(menu._id)
        .populate({
          path: 'media',
          populate: [
            { path: 'media', model: 'Media' },
            { path: 'buyer', model: 'User', select: 'username displayName' },
          ],
        })
        .populate('category')
        .populate({
          path: 'owner',
          select:
            'id discordId username displayName discordAvatar role profileImage',
        })
        .lean();

      return finalMenu;
    } catch (error) {
      console.log(error);
      await session.abortTransaction();
      session.endSession();

      if (uploadedFiles.length > 0) {
        await Promise.allSettled(
          uploadedFiles.map((f) =>
            this.fileUploaderService.deleteFile(f.public_id),
          ),
        );
      }

      this.logger.error(error);
      if (error instanceof HttpException) throw error;
      throw new BadRequestException('Failed to update Menu');
    }
  }

  // async deleteMenuMedia(
  //   userId: string,
  //   mediaId: string,
  // ): Promise<{ deleted: boolean }> {
  //   const user = await this.userModel.findOne({ discordId: userId });
  //   if (!user) throw new NotFoundException('User not found');

  //   const media = await this.mediaModel.findOne({
  //     _id: mediaId,
  //     owner: user._id,
  //   });
  //   if (!media)
  //     throw new NotFoundException('Media not found or not owned by user');

  //   // Step 1: Delete the media file from cloud/storage
  //   await this.fileUploaderService.deleteFile(media.public_id);

  //   // Step 2: Find any menus that contain this media
  //   const menus = await this.menuModel.find({
  //     owner: user._id,
  //     media: media._id,
  //   });

  //   // Step 3: Update each affected menu
  //   for (const menu of menus) {
  //     // Remove media from array
  //     menu.media = menu.media.filter(
  //       (m: any) => m.toString() !== media._id.toString(),
  //     );

  //     // If the deleted media was the cover image, remove it
  //     if (menu.coverImage?.public_id === media.public_id) {
  //       menu.coverImage = undefined;
  //     }

  //     // Adjust collectionType based on remaining media count
  //     if (menu.media.length === 0) {
  //       // No media left → clear collectionType
  //       menu.collectionType = undefined;
  //     } else if (menu.media.length === 1) {
  //       // Single media left → Singles
  //       menu.collectionType = CollectionType.SINGLE;
  //     } else {
  //       // More than 1 → Bundles
  //       menu.collectionType = CollectionType.BUNDLES;
  //     }

  //     await menu.save();
  //   }

  //   // Step 4: Delete the media document itself
  //   await this.mediaModel.deleteOne({ _id: media._id });

  //   return { deleted: true };
  // }

  async deleteMenuMedia(
    userId: string,
    mediaId: string,
  ): Promise<{ deleted: boolean }> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // 1️⃣ Validate user
      const user = await this.userModel
        .findOne({ discordId: userId })
        .session(session);
      if (!user) throw new NotFoundException('User not found');

      // 2️⃣ Validate media ownership
      const media = await this.mediaModel
        .findOne({ _id: mediaId, owner: user._id })
        .session(session);
      if (!media)
        throw new NotFoundException('Media not found or not owned by user');

      // 3️⃣ Check if any menu item that uses this media has been sold
      const soldMenuMedia = await this.menuMediaModel
        .findOne({
          media: media._id,
          isSold: true,
        })
        .session(session);

      if (soldMenuMedia) {
        await session.abortTransaction();
        session.endSession();
        throw new BadRequestException(
          'Cannot delete media — one or more items in the menu using this media have been sold.',
        );
      }

      // 3️⃣ Delete the file from storage
      await this.fileUploaderService.deleteFile(media.public_id);

      // 4️⃣ Find and delete MenuMedia linking this media
      const menuMedia = await this.menuMediaModel
        .findOne({ media: media._id })
        .session(session);

      if (menuMedia) {
        await this.menuMediaModel
          .deleteOne({ _id: menuMedia._id })
          .session(session);
      }

      // 5️⃣ Update affected menu(s)
      const menus = await this.menuModel
        .find({ owner: user._id, media: menuMedia?._id })
        .session(session);

      for (const menu of menus) {
        // Remove MenuMedia reference
        menu.media = menu.media.filter(
          (m: any) => m.toString() !== menuMedia._id.toString(),
        );

        // If deleted media was the cover image, clear it
        if (menu.coverImage?.public_id === media.public_id) {
          menu.coverImage = undefined;
        }

        // Adjust collectionType based on remaining media count
        if (menu.media.length === 0) {
          menu.collectionType = undefined;
        } else if (menu.media.length === 1) {
          menu.collectionType = CollectionType.SINGLE;
        } else {
          menu.collectionType = CollectionType.BUNDLES;
        }

        menu.itemCount = menu.media.length;
        await menu.save({ session });
      }

      // 6️⃣ Delete the Media document
      await this.mediaModel.deleteOne({ _id: media._id }).session(session);

      // 7️⃣ Commit transaction
      await session.commitTransaction();
      session.endSession();

      return { deleted: true };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      this.logger.error(error);
      throw new BadRequestException('Failed to delete menu media');
    }
  }

  // async deleteMenu(
  //   userId: string,
  //   menuId: string,
  // ): Promise<{ deleted: boolean }> {
  //   const user = await this.userModel.findOne({ discordId: userId });
  //   if (!user) throw new NotFoundException('User not found');

  //   const menu = await this.menuModel
  //     .findOne({
  //       _id: menuId,
  //       owner: user._id,
  //     })
  //     .populate('media');
  //   if (!menu)
  //     throw new NotFoundException('Menu not found or not owned by user');

  //   // Step 2: Delete cover image if exists
  //   if (menu.coverImage?.public_id) {
  //     try {
  //       await this.fileUploaderService.deleteFile(menu.coverImage.public_id);
  //     } catch (err) {
  //       console.error(
  //         `Failed to delete cover image ${menu.coverImage.public_id}:`,
  //         err,
  //       );
  //     }
  //   }

  //   // Step 3: Delete all linked media files
  //   const mediaFiles = (menu.media as unknown as MediaDocument[]) || [];
  //   for (const media of mediaFiles) {
  //     try {
  //       // Delete from Cloudinary
  //       if (media.public_id) {
  //         await this.fileUploaderService.deleteFile(media.public_id);
  //       }
  //       // Delete from DB
  //       await this.mediaModel.deleteOne({ _id: media._id });
  //     } catch (err) {
  //       console.error(`Failed to delete media ${media._id}:`, err);
  //     }
  //   }

  //   // Step 4: Delete the menu itself
  //   await this.menuModel.deleteOne({ _id: menu._id });

  //   return { deleted: true };
  // }

  async deleteMenu(
    userId: string,
    menuId: string,
  ): Promise<{ deleted: boolean; archived?: boolean }> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // 1️⃣ Validate user
      const user = await this.userModel
        .findOne({ discordId: userId })
        .session(session);
      if (!user) throw new NotFoundException('User not found');

      // 2️⃣ Fetch menu
      const menu = await this.menuModel
        .findOne({ _id: menuId, owner: user._id })
        .populate('media')
        .session(session);
      if (!menu)
        throw new NotFoundException('Menu not found or not owned by user');

      // 3️⃣ If an item has been sold → archive, not delete
      if (menu.itemSold > 0) {
        menu.isArchived = true;
        await menu.save({ session });
        await session.commitTransaction();
        session.endSession();
        return { deleted: false, archived: true };
      }

      // 4️⃣ Delete cover image (if exists)
      if (menu.coverImage?.public_id) {
        try {
          await this.fileUploaderService.deleteFile(menu.coverImage.public_id);
        } catch (err) {
          console.error(
            `⚠️ Failed to delete cover image ${menu.coverImage.public_id}:`,
            err,
          );
        }
      }

      // 5️⃣ Delete all linked media + MenuMedia
      const menuMediaDocs = await this.menuMediaModel
        .find({ menu: menu._id })
        .populate('media')
        .session(session);

      for (const menuMedia of menuMediaDocs) {
        const media = menuMedia.media as any;

        // Delete file from cloud
        if (media?.public_id) {
          try {
            await this.fileUploaderService.deleteFile(media.public_id);
          } catch (err) {
            console.error(
              `⚠️ Failed to delete media file ${media.public_id}:`,
              err,
            );
          }
        }

        // Delete from DB
        await this.mediaModel.deleteOne({ _id: media._id }).session(session);
        await this.menuMediaModel
          .deleteOne({ _id: menuMedia._id })
          .session(session);
      }

      // 6️⃣ Delete the Menu
      await this.menuModel.deleteOne({ _id: menu._id }).session(session);

      // 7️⃣ Commit transaction
      await session.commitTransaction();
      session.endSession();

      return { deleted: true };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      this.logger.error('❌ Failed to delete menu:', error);
      throw new BadRequestException('Failed to delete menu');
    }
  }

  async getMenuByUser(discordId: string): Promise<Menu[] | any[]> {
    const user = await this.userModel.findOne({ discordId }).lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const menus = await this.menuModel
      .find({ owner: user._id, isArchived: false })
      .populate('media')
      .populate('category')
      .populate(
        'owner',
        'discordId username displayName discordAvatar profileImage',
      )
      .sort({ createdAt: -1 })
      .lean();

    return menus.map(({ owner, ...menu }) => ({
      ...menu,
      author: owner,
      noteToBuyer: menu.noteToBuyer ?? '',
    }));
  }

  async getMenusByCategory(category: string): Promise<Menu[] | any[]> {
    const menus = await this.menuModel
      .find({ category, isArchived: false })
      .populate('media')
      .populate('category')
      .populate(
        'owner',
        'discordId username displayName discordAvatar profileImage',
      )
      .sort({ createdAt: -1 })
      .lean();

    return menus.map(({ owner, ...menu }) => ({
      ...menu,
      author: owner,
      noteToBuyer: menu.noteToBuyer ?? '',
    }));
  }

  async createCategory(dto: CreateCategoryDto): Promise<Category> {
    const creator = await this.userModel.findOne({ discordId: dto.owner });
    if (!creator) {
      throw new NotFoundException('User not found');
    }

    const category = new this.categoryModel({
      category: dto.category,
      normalizedCategory: dto.category.toLowerCase(),
      hashtag: await this.toHashtag(dto.category),
      owner: creator._id,
    });

    const saved = await category.save();
    return saved.populate(
      'owner',
      'id discordId username displayName discordAvatar role',
    );
  }

  async fetchUserCategory(discordId: string): Promise<Category[]> {
    const creator = await this.userModel.findOne({ discordId });
    if (!creator) {
      throw new NotFoundException('User not found');
    }
    return await this.categoryModel
      .find({ owner: creator._id })
      .select('category hashtag')
      .exec();
  }

  async deleteCategory(
    discordId: string,
    categoryId: string,
  ): Promise<{ message: string }> {
    const user = await this.userModel.findOne({ discordId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const category = await this.categoryModel.findOneAndDelete({
      _id: categoryId,
      owner: user._id,
    });

    if (!category) {
      throw new NotFoundException('Category not found or not owned by user');
    }

    return { message: 'Category deleted successfully' };
  }

  private async toHashtag(text: string) {
    return (
      '#' +
      text
        .replace(/\s+/g, '') // remove spaces
        .replace(/[^a-zA-Z0-9]/g, '') // remove special characters
        .trim()
    );
  }
}
