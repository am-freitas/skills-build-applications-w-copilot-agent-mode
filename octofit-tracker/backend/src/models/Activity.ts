import { Schema, model } from 'mongoose';

const activitySchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // changed line -1
  team: { type: Schema.Types.ObjectId, ref: 'Team', required: true }, // changed line -1
  type: { type: String, required: true, trim: true }, // changed line -1
  minutes: { type: Number, required: true, min: 1 }, // changed line -1
  points: { type: Number, required: true, min: 0 }, // changed line -1
  occurredAt: { type: Date, required: true }, // changed line -1
});

export const Activity = model('Activity', activitySchema);
