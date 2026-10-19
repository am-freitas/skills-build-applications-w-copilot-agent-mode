import { Schema, model } from 'mongoose';

const userSchema = new Schema({
  name: { type: String, required: true, trim: true }, // changed line -1
  email: { type: String, required: true, trim: true, lowercase: true }, // changed line -1
  team: { type: Schema.Types.ObjectId, ref: 'Team' },
  fitnessGoal: { type: String, required: true, trim: true }, // changed line -1
});

export const User = model('User', userSchema);
