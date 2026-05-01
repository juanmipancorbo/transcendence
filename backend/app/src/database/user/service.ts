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

export async function updateUserGame(userId: string, gameId:string) {
  const user = await Repo.selectPublicUser(userId);
  if (!user)
    throw ("INVALID_CREDENTIAL");
  await Repo.updateUserGame(userId, gameId);
}

export async function updateUserGameNull(userId: string) {
  const user = await Repo.selectPublicUser(userId);
  if (!user)
    throw ("INVALID_CREDENTIAL");
  await Repo.updateUserGameNull(userId);
}