// MongoDB aggregation pipelines over the real-time collections.
import { route } from '@/lib/api';
import { mongo } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const PIPELINES = {
  eventsByStatus: {
    title: 'Tracking events by status', collection: 'order_tracking_events',
    pipeline: [{ $group: { _id: '$status', events: { $sum: 1 } } }, { $sort: { events: -1 } }],
  },
  notificationsByType: {
    title: 'Notifications by user type and channel', collection: 'notifications',
    pipeline: [
      { $group: { _id: { user: '$user_type', channel: '$channel' }, sent: { $sum: 1 }, unread: { $sum: { $cond: ['$read', 0, 1] } } } },
      { $sort: { sent: -1 } },
    ],
  },
  deliveryTimes: {
    title: 'Minutes from order placed to delivered', collection: 'order_tracking_events',
    pipeline: [
      { $match: { status: { $in: ['PLACED', 'DELIVERED'] } } },
      { $group: { _id: '$order_id', placed: { $min: { $cond: [{ $eq: ['$status', 'PLACED'] }, '$at', null] } },
                  delivered: { $max: { $cond: [{ $eq: ['$status', 'DELIVERED'] }, '$at', null] } } } },
      { $match: { placed: { $ne: null }, delivered: { $ne: null } } },
      { $project: { _id: 0, order_id: '$_id', minutes: { $round: [{ $divide: [{ $subtract: ['$delivered', '$placed'] }, 60000] }, 1] } } },
      { $sort: { order_id: -1 } }, { $limit: 10 },
    ],
  },
  activityByActor: {
    title: 'Platform activity by actor type', collection: 'activity_logs',
    pipeline: [{ $group: { _id: '$actor.type', actions: { $sum: 1 }, last: { $max: '$at' } } }, { $sort: { actions: -1 } }],
  },
  partnersOnline: {
    title: 'Partner locations by availability', collection: 'partner_locations',
    pipeline: [{ $group: { _id: { city: '$city', availability: '$availability' }, partners: { $sum: 1 } } }, { $sort: { '_id.city': 1 } }],
  },
};

export const GET = route(async () => {
  await requireRole('admin');
  const results = await mongo(async db => {
    const out = [];
    for (const [id, p] of Object.entries(PIPELINES)) {
      out.push({ id, title: p.title, collection: p.collection, pipeline: p.pipeline,
                 rows: await db.collection(p.collection).aggregate(p.pipeline).toArray() });
    }
    return out;
  }, null);
  return { connected: results !== null, results: results || [] };
});
