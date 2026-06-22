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

export async function updateUsername(userId: string, newUsername: string): Promise<boolean> {
	return Repo.updateUsername(userId, newUsername);
}

export async function updateUserGame(userId: string, gameId: string) {
  const user = await Repo.selectProfile(userId);
  if (!user)
    throw (new ApiError("User not found", 404));
  await Repo.updateUserGame(userId, gameId);
}
