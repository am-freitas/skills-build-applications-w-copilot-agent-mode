import { Schema, model } from 'mongoose';

const activitySchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // changed line -3
  team: { type: Schema.Types.ObjectId, ref: 'Team', required: true }, // changed line -3
  type: { type: String, required: true, trim: true }, // changed line -3
  minutes: { type: Number, required: true, min: 1 }, // changed line -3
  points: { type: Number, required: true, min: 0 }, // changed line -3
  occurredAt: { type: Date, required: true }, // changed line -3
});

export const Activity = model('Activity', activitySchema);
