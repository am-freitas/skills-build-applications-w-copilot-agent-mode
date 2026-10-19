import { Schema, model } from 'mongoose';

const teamSchema = new Schema({
  name: { type: String, required: true, trim: true }, // changed line -3
  mascot: { type: String, required: true, trim: true }, // changed line -3
  members: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] }, // changed line -3
});

export const Team = model('Team', teamSchema);
