import { Router } from "express";
import {
  getFriends,
  getFriendProfiles,
  getIncomingRequests,
  getOutgoingRequests,
  getFriendStatus,
  sendRequest,
  acceptRequest,
  declineRequest,
  cancelRequest,
  removeFriend,
} from "./controller";
import * as EPSchema from "@endpoints/friend-request";
import { validateBody, validateParams } from "@utils/validation-middelwares";
import { authMiddleware } from "../../middleware/auth-middleware";

const router = Router();

// Every friend action is scoped to the authenticated user.
router.use(authMiddleware);

// Friends
router.get("/", getFriends);
router.get("/profiles", getFriendProfiles);
router.get("/status/:id", validateParams(EPSchema.FriendParamReqSchema), getFriendStatus);
router.delete("/", validateBody(EPSchema.FriendTargetReqSchema), removeFriend);

// Friend requests
router.get("/requests/incoming", getIncomingRequests);
router.get("/requests/outgoing", getOutgoingRequests);
router.post("/requests", validateBody(EPSchema.FriendTargetReqSchema), sendRequest);
router.post("/requests/accept", validateBody(EPSchema.RespondRequestReqSchema), acceptRequest);
router.post("/requests/decline", validateBody(EPSchema.RespondRequestReqSchema), declineRequest);
router.delete("/requests", validateBody(EPSchema.FriendTargetReqSchema), cancelRequest);

export { router };
