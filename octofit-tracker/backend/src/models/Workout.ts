import { Schema, model } from 'mongoose';

const workoutSchema = new Schema({
  title: { type: String, required: true, trim: true }, // changed line -3
  focus: { type: String, required: true, trim: true }, // changed line -3
  minutes: { type: Number, required: true, min: 1 }, // changed line -3
  difficulty: { type: String, required: true, trim: true }, // changed line -3
});

export const Workout = model('Workout', workoutSchema);
