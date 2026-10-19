import { Schema, model } from 'mongoose';

// change test file
const userSchema = new Schema({
  name: String,
  email: String,
  team: { type: Schema.Types.ObjectId, ref: 'Team' },
  fitnessGoal: String,
});

export const User = model('User', userSchema);
