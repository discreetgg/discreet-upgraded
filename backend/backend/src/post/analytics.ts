// generate service for this:
// 1. Likes per Post (with total like count)
// await likeModel.aggregate([
//   { $match: { targetType: 'Post' } },
//   { $group: {
//       _id: '$targetId',
//       totalLikes: { $sum: 1 },
//     }
//   },

// 2.  Likes Over Time (e.g. daily)
// await likeModel.aggregate([
//   {
//     $match: {
//       createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // last 7 days
//       targetType: 'Post',
//     },
//   },
//   {
//     $group: {
//       _id: {
//         day: { $dayOfMonth: '$createdAt' },
//         month: { $month: '$createdAt' },
//         year: { $year: '$createdAt' },
//       },
//       count: { $sum: 1 },
//     },
//   },
//   {
//     $sort: {
//       '_id.year': 1,
//       '_id.month': 1,
//       '_id.day': 1,
//     },
//   },
// ]);

// 3. Top Liking Users
// await likeModel.aggregate([
//   { $group: {
//       _id: '$user',
//       totalLikesGiven: { $sum: 1 },
//     }
//   },
//   { $sort: { totalLikesGiven: -1 } },
//   { $limit: 10 },
//   {
//     $lookup: {
//       from: 'users',
//       localField: '_id',
//       foreignField: '_id',
//       as: 'user',
//     }
//   },
//   { $unwind: '$user' },
//   {
//     $project: {
//       username: '$user.username',
//       totalLikesGiven: 1,
//     }
//   }
// ]);

// async getLikesPerDay() {
//     const now = new Date();
//     const sevenDaysAgo = new Date(now);
//     sevenDaysAgo.setDate(now.getDate() - 6); // Include today

//     const result = await this.likeModel.aggregate([
//       {
//         $match: {
//           createdAt: { $gte: sevenDaysAgo },
//           targetType: 'Post',
//         },
//       },
//       {
//         $group: {
//           _id: {
//             year: { $year: '$createdAt' },
//             month: { $month: '$createdAt' },
//             day: { $dayOfMonth: '$createdAt' },
//           },
//           count: { $sum: 1 },
//         },
//       },
//       {
//         $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 },
//       },
//     ]);

//     return result.map(item => {
//       const date = new Date(item._id.year, item._id.month - 1, item._id.day);
//       return {
//         date: date.toISOString().split('T')[0], // YYYY-MM-DD
//         count: item.count,
//       };
//     });
//   }

// async publishScheduledPosts(): Promise<void> {
//     const now = new Date();

//     const posts = await this.postModel.find({
//       'scheduledPost.isScheduled': true,
//       'scheduledPost.scheduledFor': { $lte: now },
//     });

//     for (const post of posts) {
//       post.scheduledPost.isScheduled = false;
//       post.isDraft = false;
//       await post.save();
//     }
//   }

// import { Injectable } from '@nestjs/common';
// import { Interval } from '@nestjs/schedule';

// @Injectable()
// export class SchedulerService {
//   constructor(private readonly postService: PostService) {}

//   // Runs every 60 seconds
//   @Interval(60_000)
//   async checkAndPublishScheduledPosts() {
//     await this.postService.publishScheduledPosts();
//   }
// }
