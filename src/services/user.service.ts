import { User } from '../models/user.model';
import { RefreshToken } from '../models/refreshToken.model';
import { AppError } from '../middlewares/errorHandler';
import { CreateUserInput, UpdateUserInput } from '../types/user.types';
import { IUserDocument } from '../types/auth.types';

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserResponse {
  id: string;
  username: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

const toUserResponse = (user: IUserDocument): UserResponse => ({
  id: user._id.toString(),
  username: user.username,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const createUser = async (input: CreateUserInput): Promise<UserResponse> => {
  const existingUser = await User.findOne({ username: input.username });
  if (existingUser) {
    throw new AppError(409, 'Username already exists');
  }

  const user = await User.create({
    username: input.username,
    password: input.password,
    role: input.role || 'user',
  });

  return toUserResponse(user);
};

export const getUsers = async (params: PaginationParams): Promise<PaginatedResult<UserResponse>> => {
  const { page, limit } = params;
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find().select('-password').skip(skip).limit(limit).sort({ createdAt: -1 }),
    User.countDocuments(),
  ]);

  return {
    data: users.map(toUserResponse),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getUserById = async (id: string): Promise<UserResponse> => {
  const user = await User.findById(id).select('-password');
  if (!user) {
    throw new AppError(404, 'User not found');
  }
  return toUserResponse(user);
};

export const updateUser = async (id: string, input: UpdateUserInput): Promise<UserResponse> => {
  const user = await User.findById(id);
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  if (input.username && input.username !== user.username) {
    const existingUser = await User.findOne({ username: input.username });
    if (existingUser) {
      throw new AppError(409, 'Username already exists');
    }
    user.username = input.username;
  }

  if (input.password) {
    user.password = input.password; // pre-save hook will hash it
  }

  if (input.role) {
    user.role = input.role;
  }

  await user.save({ validateModifiedOnly: true });

  return toUserResponse(user);
};

export const deleteUser = async (id: string, currentUserId: string): Promise<void> => {
  if (id === currentUserId) {
    throw new AppError(400, 'Cannot delete your own account');
  }

  const user = await User.findById(id);
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  // Delete user's refresh tokens
  await RefreshToken.deleteMany({ userId: id });

  // Delete the user
  await User.deleteOne({ _id: id });
};
