// MongoDB writes for real-time data: tracking events, notifications, logs.
import { mongo } from './db';

export const point = (lat, lng) => ({ type: 'Point', coordinates: [Number(lng), Number(lat)] });

export const trackEvent = (order_id, status, actor, extra = {}) =>
  mongo(db => db.collection('order_tracking_events').insertOne({ order_id, status, actor, at: new Date(), ...extra }));

export const notify = (user_type, user_id, title, body, order_id) =>
  mongo(db => db.collection('notifications').insertOne({
    user_type, user_id, ...(order_id ? { order_id } : {}), channel: 'PUSH', title, body, read: false, created_at: new Date(),
  }));

export const logActivity = (actor, action, target = null, details = null) =>
  mongo(db => db.collection('activity_logs').insertOne({ actor, action, target, details, at: new Date() }));

export function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371, rad = d => d * Math.PI / 180;
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
