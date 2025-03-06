import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { env } from "../../config/env";
import { Container } from "typedi";
import { AuthService } from "../../auth/services/auth.service";

passport.use(
  new GoogleStrategy(
    {
      clientID: env.googleClientId,
      clientSecret: env.googleClientSecret,
      callbackURL: "http://localhost:5000/api/auth/google/callback",
      passReqToCallback: true,
    },
    async (_req, _accessToken, _refreshToken, profile, done) => {
      try {
        console.log("goran");
        const authService = Container.get(AuthService);
        const email = profile.emails?.[0]?.value!;

        let user = await authService.findUserByEmail(email);

        if (user) {
          // Update existing user with Google ID if not already linked
          if (!user.googleId) {
            user = await authService.linkGoogleAccount(user.id, profile.id);
          }
        } else {
          // Create new user
          user = await authService.createUser({
            googleId: profile.id,
            name: profile.displayName,
            email,
          });
        }

        if (!user) {
          return done(new Error("Failed to create or find user"), false);
        }

        const authCode = await authService.generateAuthCode(user.id);
        done(null, { authCode });
      } catch (error) {
        done(error, false);
      }
    }
  )
);
