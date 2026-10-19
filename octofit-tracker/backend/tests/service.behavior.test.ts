import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { Activity, Team, User, Workout } from '../src/models/index.js';

let mongo: MongoMemoryServer;
const app = createApp();

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
}, 60_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await Promise.all([Activity.deleteMany({}), Team.deleteMany({}), User.deleteMany({}), Workout.deleteMany({})]);
});

describe('OctoFit service behavior', () => {
  it('removes members from their previous teams when assigning them to a new team', async () => {
    const previousTeam = await Team.create({ name: 'Previous team', mascot: 'Old mascot' });
    const member = await User.create({
      name: 'Mona',
      email: 'mona@example.com',
      team: previousTeam._id,
      fitnessGoal: 'endurance',
    });
    previousTeam.members.push(member._id);
    await previousTeam.save();

    const response = await request(app).post('/api/teams').send({
      name: 'Octocats',
      mascot: 'Mona',
      members: [member._id.toString()],
    });

    expect(response.status).toBe(201);
    expect(await Team.findById(previousTeam._id).then((team) => team?.members)).toHaveLength(0);
    expect((await User.findById(member._id))?.team?.toString()).toBe(response.body.team._id);
    expect(response.body.team.members).toContain(member._id.toString());
  });

  it('rejects activities when the user and team are not associated', async () => {
    const userTeam = await Team.create({ name: 'User team', mascot: 'Mona' });
    const otherTeam = await Team.create({ name: 'Other team', mascot: 'Hubot' });
    const user = await User.create({
      name: 'Mona',
      email: 'mona@example.com',
      team: userTeam._id,
      fitnessGoal: 'endurance',
    });
    userTeam.members.push(user._id);
    await userTeam.save();

    const response = await request(app).post('/api/activities').send({
      userId: user._id.toString(),
      teamId: otherTeam._id.toString(),
      type: 'run',
      minutes: 30,
    });

    expect(response.status).toBe(400);
    expect(await Activity.countDocuments()).toBe(0);
  });

  it('ranks teams with tied points equally and skips the next rank', async () => {
    const teams = await Promise.all([
      Team.create({ name: 'Alpha', mascot: 'A' }),
      Team.create({ name: 'Beta', mascot: 'B' }),
      Team.create({ name: 'Gamma', mascot: 'G' }),
    ]);
    const users = await Promise.all(teams.map((team, index) => User.create({
      name: `User ${index}`,
      email: `user${index}@example.com`,
      team: team._id,
      fitnessGoal: 'endurance',
    })));
    for (let index = 0; index < teams.length; index += 1) {
      teams[index].members.push(users[index]._id);
      await teams[index].save();
    }
    await Activity.create([
      { user: users[0]._id, team: teams[0]._id, type: 'run', minutes: 20, points: 20, occurredAt: new Date() },
      { user: users[1]._id, team: teams[1]._id, type: 'run', minutes: 20, points: 20, occurredAt: new Date() },
      { user: users[2]._id, team: teams[2]._id, type: 'run', minutes: 5, points: 5, occurredAt: new Date() },
    ]);

    const response = await request(app).get('/api/leaderboard');

    expect(response.status).toBe(200);
    expect(response.body.leaderboard.map(({ teamName, rank }: { teamName: string; rank: number }) => ({ teamName, rank }))).toEqual([
      { teamName: 'Alpha', rank: 1 },
      { teamName: 'Beta', rank: 1 },
      { teamName: 'Gamma', rank: 3 },
    ]);
  });

  it('prioritizes a matching recent-activity workout over a different goal workout', async () => {
    const team = await Team.create({ name: 'Octocats', mascot: 'Mona' });
    const user = await User.create({
      name: 'Mona',
      email: 'mona@example.com',
      team: team._id,
      fitnessGoal: 'endurance',
    });
    team.members.push(user._id);
    await team.save();
    await Activity.create({
      user: user._id,
      team: team._id,
      type: 'strength',
      minutes: 30,
      points: 30,
      occurredAt: new Date(),
    });
    await Workout.create([
      { title: 'Intervals', focus: 'endurance', minutes: 30, difficulty: 'moderate' },
      { title: 'Strength Circuit', focus: 'strength', minutes: 30, difficulty: 'moderate' },
    ]);

    const response = await request(app).get('/api/workouts/suggestions/mona%40example.com');

    expect(response.status).toBe(200);
    expect(response.body.suggestions[0]).toMatchObject({
      title: 'Strength Circuit',
      focus: 'strength',
      reason: expect.stringMatching(/recent activity/i),
    });
  });
});
