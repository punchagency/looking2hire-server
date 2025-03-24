import express from "express";
import { Container } from "typedi";
import { AuthController } from "../controllers/auth.controller";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { upload } from "../../common/middlewares/upload.middleware";

const authRouter = express.Router();
const authController = Container.get(AuthController);

authRouter.get("/google", authController.googleAuth.bind(authController));
authRouter.get(
  "/google/callback",
  authController.googleAuthCallback.bind(authController)
);
authRouter.get("/linkedin", authController.linkedinAuth.bind(authController));

authRouter.post("/token", authController.exchangeAuthCode.bind(authController));
authRouter.post(
  "/linkedin/callback",
  authController.handleLinkedinAuth.bind(authController)
);
authRouter.post("/logout", authController.logout.bind(authController));
authRouter.post(
  "/refresh-token",
  authController.refreshToken.bind(authController)
);

authRouter.post(
  "/employer/signup",
  authController.employerSignup.bind(authController)
);
authRouter.post(
  "/employer/signin",
  authController.employerSignin.bind(authController)
);
authRouter.post(
  "/applicant/signup",
  authController.applicantSignup.bind(authController)
);
authRouter.post(
  "/applicant/signin",
  authController.applicantSignin.bind(authController)
);
authRouter.post(
  "/applicant/link-password",
  authController.linkPassword.bind(authController)
);
authRouter.post("/verify-otp", authController.verifyOTP.bind(authController));
authRouter.post("/send-otp", authController.sendOTP.bind(authController));
authRouter.patch(
  "/employer/update-profile",
  authenticate,
  upload.single("company_logo"),
  authController.updateEmployerProfile.bind(authController)
);
authRouter.patch(
  "/applicant/update-profile",
  authenticate,
  upload.single("profile_pic"),
  authController.updateApplicantProfile.bind(authController)
);
authRouter.post("/signout", authController.signout.bind(authController));

//
authRouter.get("/", authController.getAllApplicants.bind(authController));

authRouter.get(
  "/user-details",
  authenticate,
  authController.getUserDetails.bind(authController)
);

export default authRouter;
