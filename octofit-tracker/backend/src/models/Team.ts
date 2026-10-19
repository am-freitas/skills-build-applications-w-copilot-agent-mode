import { Schema, model } from 'mongoose';

const teamSchema = new Schema({
  name: { type: String, required: true, trim: true }, // changed line -1
  mascot: { type: String, required: true, trim: true }, // changed line -1
  members: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] }, // changed line -1
});

export const Team = model('Team', teamSchema);
