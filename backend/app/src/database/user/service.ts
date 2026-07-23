import { PublicUser } from "@endpoints/users-response";
import * as Repo from "./repository"
import { ApiError } from "@utils/error";

export async function readProfile(userId: string): Promise<PublicUser>
{
  const profile = await Repo.selectProfile(userId);
  if (!profile)
    throw (new ApiError("User profile does not exist", 404));
  return (profile);
}

function ensureProfileEditable(user: PublicUser | null): user is PublicUser {
	if (!user)
		return false;
	if (user.currentGame)
		throw new ApiError("Profile cannot be changed during a game", 409);
	return true;
}

export async function updateUsername(userId: string, newUsername: string): Promise<boolean> {
	if (!ensureProfileEditable(await Repo.selectProfile(userId)))
		return false;
	return Repo.updateUsername(userId, newUsername);
}

export async function updateBio(userId: string, bio: string): Promise<boolean> {
	if (!ensureProfileEditable(await Repo.selectProfile(userId)))
		return false;
	return Repo.updateBio(userId, bio);
}

export async function updateAvatar(userId: string | undefined, avatarUrl: string): Promise<string> {
        if (!userId) {
                throw new ApiError("User id is required", 400);
        }
	return Repo.updateAvatar(userId, avatarUrl);
}

export async function updateUserGame(userId: string, gameId: string) {
  const user = await Repo.selectProfile(userId);
  if (!user)
    throw (new ApiError("User not found", 404));
  await Repo.updateUserGame(userId, gameId);
}

export async function clearUserGame(userId: string) {
  await Repo.updateUserGame(userId, null);
}
