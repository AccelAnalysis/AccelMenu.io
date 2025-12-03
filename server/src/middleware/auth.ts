import { Request, Response, NextFunction } from "express";

const mutationMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const configuredApiKey = process.env.API_KEY;

  if (!configuredApiKey) {
    return res
      .status(500)
      .json({ message: "API key is not configured on the server" });
  }

  const providedKey = req.headers["x-api-key"];

  if (typeof providedKey !== "string" || providedKey !== configuredApiKey) {
    return res.status(401).json({ message: "Invalid or missing API key" });
  }

  next();
};

export const authForMutations = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (mutationMethods.has(req.method.toUpperCase())) {
    return validateApiKey(req, res, next);
  }

  next();
};

export default validateApiKey;
