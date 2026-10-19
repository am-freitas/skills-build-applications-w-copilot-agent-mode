import { Activity, Team, User, Workout } from '../models/index.js';

type ServiceError = Error & { status: number };

function serviceError(status: number, message: string): ServiceError {
  return Object.assign(new Error(message), { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw serviceError(400, 'Activity details are required');
  const { userId, teamId, type, minutes } = input;
  if (typeof userId !== 'string' || !/^[\da-f]{24}$/i.test(userId)) throw serviceError(400, 'A valid userId is required');
  if (typeof teamId !== 'string' || !/^[\da-f]{24}$/i.test(teamId)) throw serviceError(400, 'A valid teamId is required');
  if (typeof type !== 'string' || !type.trim()) throw serviceError(400, 'Activity type is required');
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) throw serviceError(400, 'Minutes must be a positive number');

  const [user, team] = await Promise.all([User.exists({ _id: userId }), Team.exists({ _id: teamId })]);
  if (!user || !team) throw serviceError(400, 'The referenced user and team must exist');

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw serviceError(400, 'Team details are required');
  const { name, mascot } = input;
  const members = input.members ?? [];
  if (typeof name !== 'string' || !name.trim()) throw serviceError(400, 'Team name is required');
  if (typeof mascot !== 'string' || !mascot.trim()) throw serviceError(400, 'Team mascot is required');
  if (!Array.isArray(members) || members.some((member) => typeof member !== 'string' || !/^[\da-f]{24}$/i.test(member))) {
    throw serviceError(400, 'Team members must be valid user IDs');
  }

  const uniqueMembers = [...new Set(members as string[])];
  const existingMembers = await User.countDocuments({ _id: { $in: uniqueMembers } });
  if (existingMembers !== uniqueMembers.length) throw serviceError(400, 'All team members must exist');

  const team = await Team.create({ name: name.trim(), mascot: mascot.trim(), members: uniqueMembers });
  if (uniqueMembers.length) await User.updateMany({ _id: { $in: uniqueMembers } }, { $set: { team: team._id } });
  return team.toObject();
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().lean(),
    Activity.aggregate<{ _id: unknown; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [String(_id), totalPoints]));
  return teams
    .map((team) => ({ teamName: team.name, totalPoints: pointsByTeam.get(String(team._id)) ?? 0 }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.toLowerCase() }).lean();
  if (!user) throw serviceError(404, 'User not found');

  const [recentActivities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(3).lean(),
    Workout.find().lean(),
  ]);
  const goalFocus = user.fitnessGoal || '';
  const hasGoalMatch = workouts.some((workout) => workout.focus.toLowerCase() === goalFocus.toLowerCase());
  const focus = hasGoalMatch ? goalFocus : recentActivities[0]?.type || goalFocus || 'general fitness';
  const normalizedFocus = focus.toLowerCase();
  return workouts
    .map((workout) => ({
      ...workout,
      reason: workout.focus.toLowerCase() === normalizedFocus
        ? `Recommended to match your ${hasGoalMatch ? 'goal' : 'recent activity'} (${focus}).`
        : `Recommended based on your ${goalFocus || focus} goal and recent activity.`,
    }))
    .sort((left, right) => Number(right.focus.toLowerCase() === normalizedFocus) - Number(left.focus.toLowerCase() === normalizedFocus));
}

export { User };
