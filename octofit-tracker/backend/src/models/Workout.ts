import { Schema, model } from 'mongoose';

const workoutSchema = new Schema({
  title: { type: String, required: true, trim: true }, // changed line
  focus: { type: String, required: true, trim: true }, // changed line
  minutes: { type: Number, required: true, min: 1 }, // changed line
  difficulty: { type: String, required: true, trim: true }, // changed line
});

export const Workout = model('Workout', workoutSchema);
