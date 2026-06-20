import { PublicUser } from "@endpoints/users-response";
import * as Repo from "./repository"

// TEST Service DELETE in prod
export async function readUserData(username: string) {
  const user = await Repo.selectUser(username);
  if (!user)
    throw ("INVALID_CREDENTIAL");
  return (user);
}

// TEST Service DELETE in prod
export async function readUserTable() {
  const table = await Repo.selectUserTable();
  if (!table)
    throw ("INTERNAL_SERVER_ERROR");
  return (table)
}

export async function readProfile(userId: string): Promise<PublicUser>
{
  const profile = await Repo.selectProfile(userId);
  if (!profile)
    throw ("INVALID_CREDENTIAL");
  return (profile);
}

export async function updateUserGame(userId: string, gameId: string) {
  const user = await Repo.selectProfile(userId);
  if (!user)
    throw ("INVALID_CREDENTIAL");
  await Repo.updateUserGame(userId, gameId);
}
