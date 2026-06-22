import { PublicUser } from "@endpoints/users-response";
import * as Repo from "./repository"
import { DatabaseError } from "pg";

// Send a friend request from senderId to receiverId. Rejects self-requests,
// duplicate requests and requests between users that are already friends.
export async function sendFriendRequest(senderId: string, receiverId: string) {
  if (senderId === receiverId)
    throw ("INVALID_CREDENTIAL");
  if (await Repo.selectAreFriends(senderId, receiverId))
    throw ("ALREADY_FRIENDS");
  // If the other side already invited us, just accept it instead of stacking a request.
  if (await Repo.selectFriendRequest(receiverId, senderId)) {
    await Repo.acceptFriendRequest(receiverId, senderId);
    return;
  }
  try {
    await Repo.insertFriendRequest(senderId, receiverId);
  } catch (err) {
    if (!(err instanceof DatabaseError) || err.code !== "23505") throw err;
    throw ("ALREADY_REQUESTED");
  }
}

// Accept a request that senderId sent to receiverId (the current user).
export async function acceptFriendRequest(receiverId: string, senderId: string) {
  if (!(await Repo.selectFriendRequest(senderId, receiverId)))
    throw ("REQUEST_NOT_FOUND");
  await Repo.acceptFriendRequest(senderId, receiverId);
}

// Decline a request that senderId sent to receiverId (the current user).
export async function declineFriendRequest(receiverId: string, senderId: string) {
  if (!(await Repo.selectFriendRequest(senderId, receiverId)))
    throw ("REQUEST_NOT_FOUND");
  await Repo.deleteFriendRequest(senderId, receiverId);
}

// Cancel a request the current user (senderId) sent to receiverId.
export async function cancelFriendRequest(senderId: string, receiverId: string) {
  if (!(await Repo.selectFriendRequest(senderId, receiverId)))
    throw ("REQUEST_NOT_FOUND");
  await Repo.deleteFriendRequest(senderId, receiverId);
}

export async function removeFriend(userId: string, friendId: string) {
  if (!(await Repo.selectAreFriends(userId, friendId)))
    throw ("NOT_FRIENDS");
  await Repo.deleteFriend(userId, friendId);
}

export async function readFriends(userId: string): Promise<string[]> {
  return Repo.selectFriends(userId);
}

export async function readFriendProfiles(userId: string): Promise<PublicUser[]> {
  return Repo.selectFriendProfiles(userId);
}

export async function readIncomingRequests(userId: string): Promise<PublicUser[]> {
  return Repo.selectIncomingRequests(userId);
}

export async function readOutgoingRequests(userId: string): Promise<PublicUser[]> {
  return Repo.selectOutgoingRequests(userId);
}

export async function areFriends(userId: string, friendId: string): Promise<boolean> {
  return Repo.selectAreFriends(userId, friendId);
}
