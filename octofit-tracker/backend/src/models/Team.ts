import { Schema, model } from 'mongoose';

const teamSchema = new Schema({
  name: { type: String, required: true, trim: true }, // changed line
  mascot: { type: String, required: true, trim: true }, // changed line
  members: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] }, // changed line
});

export const Team = model('Team', teamSchema);
