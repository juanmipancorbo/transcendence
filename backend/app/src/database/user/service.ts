import * as Repo from "./repository"

export function readUserData(username: string)
{
}

export function updateUserGame(userId: string, gameId:string)
{
  const user = Repo.selectPublicUser(userId);
  if (!user)
    throw ("INVALID_CREDENTIAL");
  Repo.updateUserGame(userId, gameId);
}

export function updateUserGameNull(userId: string)
{
  const user = Repo.selectPublicUser(userId);
  if (!user)
    throw ("INVALID_CREDENTIAL");
  Repo.updateUserGameNull(userId);
}