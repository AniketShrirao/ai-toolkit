import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { generateToken } from "../middleware/auth.js";
import {
  validateLogin,
  validateRegistration,
} from "../middleware/validation.js";
import {
  AuthenticationError,
  ValidationError,
} from "../middleware/errorHandler.js";

const router = Router();

// In-memory user store (replace with database in production)
const users: Array<{
  id: string;
  username: string;
  password: string;
  role: string;
}> = [
  {
    id: "1",
    username: "admin",
    password: bcrypt.hashSync("admin123", 10),
    role: "admin",
  },
];

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     role:
 *                       type: string
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/login", validateLogin, async (req: Request, res: Response) => {
  const { username, password } = req.body;

  const user = users.find((u) => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    throw new AuthenticationError("Invalid username or password");
  }

  const token = generateToken({
    id: user.id,
    username: user.username,
    role: user.role,
  });

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
  });
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: User registration
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *               password:
 *                 type: string
 *                 minLength: 6
 *               role:
 *                 type: string
 *                 enum: [admin, user]
 *                 default: user
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     role:
 *                       type: string
 *       400:
 *         description: Validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/register",
  validateRegistration,
  async (req: Request, res: Response) => {
    const { username, password, role = "user" } = req.body;

    // Check if user already exists
    if (users.find((u) => u.username === username)) {
      throw new ValidationError("Username already exists");
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = {
      id: (users.length + 1).toString(),
      username,
      password: hashedPassword,
      role,
    };

    users.push(newUser);

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
      },
    });
  }
);

export default router;
