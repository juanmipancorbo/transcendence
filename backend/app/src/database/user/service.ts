import { PublicUser } from "@endpoints/users-response";
import * as Repo from "./repository"
import { ApiError } from "@utils/error";

// TEST Service DELETE in prod
export async function readUserData(username: string) {
  const user = await Repo.selectUser(username);
  if (!user)
    throw (new ApiError("User not found", 404));
  return (user);
}

// TEST Service DELETE in prod
export async function readUserTable() {
  const table = await Repo.selectUserTable();
  if (!table)
    throw (new ApiError("INTERNAL_SERVER_ERROR", 500));
  return (table)
}

export async function readProfile(userId: string): Promise<PublicUser>
{
  const profile = await Repo.selectProfile(userId);
  if (!profile)
    throw (new ApiError("User profile does not exist", 404));
  return (profile);
}

export async function updateUserGame(userId: string, gameId: string) {
  const user = await Repo.selectProfile(userId);
  if (!user)
    throw (new ApiError("User not found", 404));
  await Repo.updateUserGame(userId, gameId);
}
