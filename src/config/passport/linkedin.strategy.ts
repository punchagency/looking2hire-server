import passport from "passport";
import { Strategy as LinkedInStrategy } from "passport-linkedin-oauth2";
import { env } from "../../config/env";
import { Container } from "typedi";
import { AuthService } from "../../auth/services/auth.service";

passport.use(
  new LinkedInStrategy(
    {
      clientID: env.linkedinClientId,
      clientSecret: env.linkedinClientSecret,
      callbackURL: `${env.frontendUrl}/${env.authRedirectUri}linkedin`,
      scope: ["openid", "profile", "email"],
      passReqToCallback: true,
    },
    async (_req, _accessToken, _refreshToken, profile, done) => {
      // try {
      //   console.log("Raw LinkedIn Profile Response:", profile);
      //   const authService = Container.get(AuthService);
      //   const email = profile.emails?.[0]?.value!;
      //   let user = await authService.findUserByEmail(email);
      //   if (user) {
      //     // Update existing user with LinkedIn ID if not already linked
      //     if (!user.linkedinId) {
      //       user = await authService.linkLinkedInAccount(user.id, profile.id);
      //     }
      //   } else {
      //     // Create new user
      //     user = await authService.createUser({
      //       linkedinId: profile.id,
      //       name: profile.displayName,
      //       email,
      //     });
      //   }
      //   if (!user) {
      //     return done(new Error("Failed to create or find user"), false);
      //   }
      //   const authCode = await authService.generateAuthCode(user.id);
      //   done(null, { authCode });
      // } catch (error) {
      //   done(error, false);
      // }
    }
  )
);
