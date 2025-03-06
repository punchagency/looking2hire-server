import express from "express";
import { Container } from "typedi";
import { AuthController } from "../controllers/auth.controller";

const authRouter = express.Router();
const authController = Container.get(AuthController);

authRouter.get("/google", authController.googleAuth.bind(authController));
authRouter.get(
  "/google/callback",
  authController.googleAuthCallback.bind(authController)
);
authRouter.get("/linkedin", authController.linkedinAuth.bind(authController));

// authRouter.get(
//   "/linkedin/callback",
//   authController.linkedinAuthCallback.bind(authController)
// );

authRouter.post(
  "/refresh-token",
  authController.refreshToken.bind(authController)
);
authRouter.post("/logout", authController.logout.bind(authController));
authRouter.post("/token", authController.exchangeAuthCode.bind(authController));
authRouter.post(
  "/linkedin/callback",
  authController.handleLinkedinAuth.bind(authController)
);
authRouter.get("/", authController.getAllUsers.bind(authController));

export default authRouter;
