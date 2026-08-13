import jwt from "jsonwebtoken"; // Import JSON Web Token to decrypt and verify active sessions token hashes

/**
 * verifyToken - Express security middleware that guards protected routes and decodes user tokens.
 */
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization; // Retrieve Authorization descriptor header from client request

    // Verify whether the header is present and accurately formatted
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Access Denied! Authorization token is missing or contains an invalid format."
      });
    }

    // Extract raw JWT string from Bearer prefix
    const token = authHeader.split(" ")[1];

    // Decode and verify signature authenticity using the system secret key
    const decodedPayload = jwt.verify(
      token,
      process.env.JWT_SECRET || "defaultSuperSecretTokenKey123!@#"
    );

    // Mount user coordinates payload safely onto the request context object
    req.user = {
      userId: decodedPayload.userId,
      email: decodedPayload.email,
    };

    next(); // Pass control to the next sequential route controller action
  } catch (error) {
    console.error("🚨 [AuthMiddleware] Authorization token verification failed:", error.message);
    return res.status(403).json({
      error: "Your session is invalid or has expired! Please log in again."
    });
  }
};
