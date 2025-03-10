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
        const authService = Container.get(AuthService);
        const email = profile.emails?.[0]?.value!;

        let applicant = await authService.findApplicantByEmail(email);

        if (applicant) {
          // Update existing user with Google ID if not already linked
          if (!applicant.googleId) {
            applicant = await authService.linkGoogleAccount(
              applicant.id,
              profile.id
            );
          }
        } else {
          // Create new user
          applicant = await authService.createApplicant({
            googleId: profile.id,
            name: profile.displayName,
            email,
          });
        }

        if (!applicant) {
          return done(new Error("Failed to create or find applicant"), false);
        }
        const authCode = await authService.generateAuthCode(applicant.id);
        done(null, { authCode });
      } catch (error) {
        done(error, false);
      }
    }
  )
);
