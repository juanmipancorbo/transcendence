import * as argon2 from "argon2"
import * as Repo from "./repository"
import { DatabaseError } from "pg";
import { AuthUser } from "@endpoints/users-response";

export async function createUser(input: {email: string, username: string, password: string})
{
  const hashPassword = await argon2.hash(input.password);// TODO thrown error are handled at errMiddleware
  // REMARK generateToken() // Should we use a verification token?
  try {
    await Repo.insertUser(input.email, input.username, hashPassword)
  } catch (err) {
    if (!(err instanceof DatabaseError) || err.code !== "23505") throw err;
    throw ("INVALID_CREDENTIAL");
  }
}

export async function loginUser(input: {email: string, password: string}): Promise<AuthUser>
{
  const user = await Repo.selectAuthUser(input.email);
  if (!user)
    throw ("INVALID_CREDENTIAL");
  if (!await argon2.verify(user.password_hash as any, input.password))
    throw ("INVALID_CREDENTIAL");
  delete user.password_hash;
  return (user)
}