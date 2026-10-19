import { Activity, Team, User, Workout } from '../models/index.js';

type ServiceError = Error & { status: number }; // changed line
// changed line
function serviceError(status: number, message: string): ServiceError { // changed line
  return Object.assign(new Error(message), { status }); // changed line
} // changed line
// changed line
function isRecord(value: unknown): value is Record<string, unknown> { // changed line
  return typeof value === 'object' && value !== null && !Array.isArray(value); // changed line
} // changed line
// changed line
export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) { // changed line
  if (!isRecord(input)) throw serviceError(400, 'Activity details are required'); // changed line
  const { userId, teamId, type, minutes } = input; // changed line
  if (typeof userId !== 'string' || !/^[\da-f]{24}$/i.test(userId)) throw serviceError(400, 'A valid userId is required'); // changed line
  if (typeof teamId !== 'string' || !/^[\da-f]{24}$/i.test(teamId)) throw serviceError(400, 'A valid teamId is required'); // changed line
  if (typeof type !== 'string' || !type.trim()) throw serviceError(400, 'Activity type is required'); // changed line
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) throw serviceError(400, 'Minutes must be a positive number'); // changed line
// changed line
  const [user, team] = await Promise.all([User.exists({ _id: userId }), Team.exists({ _id: teamId })]); // changed line
  if (!user || !team) throw serviceError(400, 'The referenced user and team must exist'); // changed line
// changed line
  const activity = await Activity.create({ // changed line
    user: userId, // changed line
    team: teamId, // changed line
    type: type.trim(), // changed line
    minutes, // changed line
    points: minutes, // changed line
    occurredAt: new Date(), // changed line
  }); // changed line
  return activity.toObject(); // changed line
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) { // changed line
  if (!isRecord(input)) throw serviceError(400, 'Team details are required'); // changed line
  const { name, mascot } = input; // changed line
  const members = input.members ?? []; // changed line
  if (typeof name !== 'string' || !name.trim()) throw serviceError(400, 'Team name is required'); // changed line
  if (typeof mascot !== 'string' || !mascot.trim()) throw serviceError(400, 'Team mascot is required'); // changed line
  if (!Array.isArray(members) || members.some((member) => typeof member !== 'string' || !/^[\da-f]{24}$/i.test(member))) { // changed line
    throw serviceError(400, 'Team members must be valid user IDs'); // changed line
  } // changed line
// changed line
  const uniqueMembers = [...new Set(members as string[])]; // changed line
  const existingMembers = await User.countDocuments({ _id: { $in: uniqueMembers } }); // changed line
  if (existingMembers !== uniqueMembers.length) throw serviceError(400, 'All team members must exist'); // changed line
// changed line
  const team = await Team.create({ name: name.trim(), mascot: mascot.trim(), members: uniqueMembers }); // changed line
  if (uniqueMembers.length) await User.updateMany({ _id: { $in: uniqueMembers } }, { $set: { team: team._id } }); // changed line
  return team.toObject(); // changed line
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([ // changed line
    Team.find().lean(), // changed line
    Activity.aggregate<{ _id: unknown; totalPoints: number }>([ // changed line
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } }, // changed line
    ]), // changed line
  ]); // changed line
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [String(_id), totalPoints])); // changed line
  return teams // changed line
    .map((team) => ({ teamName: team.name, totalPoints: pointsByTeam.get(String(team._id)) ?? 0 })) // changed line
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName)) // changed line
    .map((team, index) => ({ ...team, rank: index + 1 })); // changed line
}

export async function suggestWorkouts(userEmail: string) { // changed line
  const user = await User.findOne({ email: userEmail.toLowerCase() }).lean(); // changed line
  if (!user) throw serviceError(404, 'User not found'); // changed line
// changed line
  const [recentActivities, workouts] = await Promise.all([ // changed line
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(3).lean(), // changed line
    Workout.find().lean(), // changed line
  ]); // changed line
  const goalFocus = user.fitnessGoal || ''; // changed line
  const hasGoalMatch = workouts.some((workout) => workout.focus.toLowerCase() === goalFocus.toLowerCase()); // changed line
  const focus = hasGoalMatch ? goalFocus : recentActivities[0]?.type || goalFocus || 'general fitness'; // changed line
  const normalizedFocus = focus.toLowerCase(); // changed line
  return workouts // changed line
    .map((workout) => ({ // changed line
      ...workout, // changed line
      reason: workout.focus.toLowerCase() === normalizedFocus // changed line
        ? `Recommended to match your ${hasGoalMatch ? 'goal' : 'recent activity'} (${focus}).` // changed line
        : `Recommended based on your ${goalFocus || focus} goal and recent activity.`, // changed line
    })) // changed line
    .sort((left, right) => Number(right.focus.toLowerCase() === normalizedFocus) - Number(left.focus.toLowerCase() === normalizedFocus)); // changed line
}

export { User };
