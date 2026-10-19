import { Schema, model } from 'mongoose';

const activitySchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // changed line
  team: { type: Schema.Types.ObjectId, ref: 'Team', required: true }, // changed line
  type: { type: String, required: true, trim: true }, // changed line
  minutes: { type: Number, required: true, min: 1 }, // changed line
  points: { type: Number, required: true, min: 0 }, // changed line
  occurredAt: { type: Date, required: true }, // changed line
});

export const Activity = model('Activity', activitySchema);
