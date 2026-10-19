import { Activity, Team, User, Workout } from '../models/index.js';

type ServiceError = Error & { status: number }; // changed line -1
// changed line -1
function serviceError(status: number, message: string): ServiceError { // changed line -1
  return Object.assign(new Error(message), { status }); // changed line -1
} // changed line -1
// changed line -1
function isRecord(value: unknown): value is Record<string, unknown> { // changed line -1
  return typeof value === 'object' && value !== null && !Array.isArray(value); // changed line -1
} // changed line -1
// changed line -1
export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) { // changed line -1
  if (!isRecord(input)) throw serviceError(400, 'Activity details are required'); // changed line -1
  const { userId, teamId, type, minutes } = input; // changed line -1
  if (typeof userId !== 'string' || !/^[\da-f]{24}$/i.test(userId)) throw serviceError(400, 'A valid userId is required'); // changed line -1
  if (typeof teamId !== 'string' || !/^[\da-f]{24}$/i.test(teamId)) throw serviceError(400, 'A valid teamId is required'); // changed line -1
  if (typeof type !== 'string' || !type.trim()) throw serviceError(400, 'Activity type is required'); // changed line -1
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) throw serviceError(400, 'Minutes must be a positive number'); // changed line -1
// changed line -1
  const [user, team] = await Promise.all([User.exists({ _id: userId }), Team.exists({ _id: teamId })]); // changed line -1
  if (!user || !team) throw serviceError(400, 'The referenced user and team must exist'); // changed line -1
// changed line -1
  const activity = await Activity.create({ // changed line -1
    user: userId, // changed line -1
    team: teamId, // changed line -1
    type: type.trim(), // changed line -1
    minutes, // changed line -1
    points: minutes, // changed line -1
    occurredAt: new Date(), // changed line -1
  }); // changed line -1
  return activity.toObject(); // changed line -1
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) { // changed line -1
  if (!isRecord(input)) throw serviceError(400, 'Team details are required'); // changed line -1
  const { name, mascot } = input; // changed line -1
  const members = input.members ?? []; // changed line -1
  if (typeof name !== 'string' || !name.trim()) throw serviceError(400, 'Team name is required'); // changed line -1
  if (typeof mascot !== 'string' || !mascot.trim()) throw serviceError(400, 'Team mascot is required'); // changed line -1
  if (!Array.isArray(members) || members.some((member) => typeof member !== 'string' || !/^[\da-f]{24}$/i.test(member))) { // changed line -1
    throw serviceError(400, 'Team members must be valid user IDs'); // changed line -1
  } // changed line -1
// changed line -1
  const uniqueMembers = [...new Set(members as string[])]; // changed line -1
  const existingMembers = await User.countDocuments({ _id: { $in: uniqueMembers } }); // changed line -1
  if (existingMembers !== uniqueMembers.length) throw serviceError(400, 'All team members must exist'); // changed line -1
// changed line -1
  const team = await Team.create({ name: name.trim(), mascot: mascot.trim(), members: uniqueMembers }); // changed line -1
  if (uniqueMembers.length) await User.updateMany({ _id: { $in: uniqueMembers } }, { $set: { team: team._id } }); // changed line -1
  return team.toObject(); // changed line -1
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([ // changed line -1
    Team.find().lean(), // changed line -1
    Activity.aggregate<{ _id: unknown; totalPoints: number }>([ // changed line -1
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } }, // changed line -1
    ]), // changed line -1
  ]); // changed line -1
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [String(_id), totalPoints])); // changed line -1
  return teams // changed line -1
    .map((team) => ({ teamName: team.name, totalPoints: pointsByTeam.get(String(team._id)) ?? 0 })) // changed line -1
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName)) // changed line -1
    .map((team, index) => ({ ...team, rank: index + 1 })); // changed line -1
}

export async function suggestWorkouts(userEmail: string) { // changed line -1
  const user = await User.findOne({ email: userEmail.toLowerCase() }).lean(); // changed line -1
  if (!user) throw serviceError(404, 'User not found'); // changed line -1
// changed line -1
  const [recentActivities, workouts] = await Promise.all([ // changed line -1
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(3).lean(), // changed line -1
    Workout.find().lean(), // changed line -1
  ]); // changed line -1
  const goalFocus = user.fitnessGoal || ''; // changed line -1
  const hasGoalMatch = workouts.some((workout) => workout.focus.toLowerCase() === goalFocus.toLowerCase()); // changed line -1
  const focus = hasGoalMatch ? goalFocus : recentActivities[0]?.type || goalFocus || 'general fitness'; // changed line -1
  const normalizedFocus = focus.toLowerCase(); // changed line -1
  return workouts // changed line -1
    .map((workout) => ({ // changed line -1
      ...workout, // changed line -1
      reason: workout.focus.toLowerCase() === normalizedFocus // changed line -1
        ? `Recommended to match your ${hasGoalMatch ? 'goal' : 'recent activity'} (${focus}).` // changed line -1
        : `Recommended based on your ${goalFocus || focus} goal and recent activity.`, // changed line -1
    })) // changed line -1
    .sort((left, right) => Number(right.focus.toLowerCase() === normalizedFocus) - Number(left.focus.toLowerCase() === normalizedFocus)); // changed line -1
}

export { User };
