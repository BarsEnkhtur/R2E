import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// Get the current domain for callback URLs
function getCurrentDomain(req: any): string {
  return `${req.protocol}://${req.get('host')}`;
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Check if Google OAuth credentials are available
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.log("Google OAuth credentials not found. Using demo authentication mode.");
    
    // Setup demo authentication routes
    app.get("/api/login", (req, res) => {
      (req.session as any).userId = "demo_user";
      res.redirect("/");
    });

    app.get("/api/logout", (req, res) => {
      req.session.destroy(() => {
        res.redirect("/");
      });
    });

    return;
  }

  // Get the base domain for OAuth configuration
  const getBaseURL = () => {
    const replitDomains = process.env.REPLIT_DOMAINS;
    if (replitDomains) {
      const domains = replitDomains.split(',');
      return `https://${domains[0]}`;
    }
    return 'http://localhost:5000';
  };

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: `${getBaseURL()}/api/auth/google/callback`
  },
  async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      // Create or update user in database
      const user = await storage.upsertUser({
        id: profile.id,
        email: profile.emails?.[0]?.value || null,
        firstName: profile.name?.givenName || null,
        lastName: profile.name?.familyName || null,
        profileImageUrl: profile.photos?.[0]?.value || null,
      });
      
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));

  passport.serializeUser((user: any, cb) => cb(null, user.id));
  passport.deserializeUser(async (id: string, cb) => {
    try {
      const user = await storage.getUser(id);
      cb(null, user);
    } catch (error) {
      cb(error, null);
    }
  });

  // Auth routes
  app.get("/api/login", 
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  app.get("/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login-failed" }),
    (req, res) => {
      res.redirect("/");
    }
  );

  app.get("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
      }
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // Check for Google OAuth authentication
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  
  // Check for demo session authentication
  if (req.session && (req.session as any).userId) {
    req.user = { id: (req.session as any).userId };
    return next();
  }
  
  return res.status(401).json({ message: "Unauthorized" });
};

export const getUserId = (req: any): string => {
  return req.user?.id || (req.session as any)?.userId || "demo_user";
};