import { PrismaClient, UserType } from '@prisma/client';
import { InfoEditType } from '../types/repo.type';
import { SignUpRequest } from '@/structs/authStruct';

export default class UserRepository {
  constructor(private prismaClient: PrismaClient) {}

  async userEdit({ data, where }: InfoEditType) {
    const result = await this.prismaClient.user.update({
      where,
      data,
    });

    return result;
  }

  async findByIdReturnPassword(userId: string) {
    const user = await this.prismaClient.user.findUnique({
      where: { id: userId },
      select: {
        password: true,
      },
    });
    if (!user) return new Error('유저 인증 실패');
    return user.password;
  }

  async findById(userId: string) {
    return await this.prismaClient.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        customer: true,
        mover: true,
      },
    });
  }

  async findByEmail(email: string) {
    const allUsers = await this.prismaClient.user.findMany({
      select: {
        id: true,
        email: true,
        userType: true,
      },
    });

    let isFoundInLoop = false;

    allUsers.forEach((user, index) => {
      const isExactMatch = user.email === email;

      const isTrimMatch = user.email.trim() === email.trim();

      if (isExactMatch) {
        isFoundInLoop = true;
      }
    });

    return await this.prismaClient.user.findFirst({
      where: {
        email: email.trim(),
      },
      include: {
        customer: true,
        mover: true,
        socialLogin: true,
      },
    });
  }

  async findByPhoneNumber(phoneNumber: string, userType: UserType) {
    return await this.prismaClient.user.findFirst({
      where: {
        userType,
        phoneNumber,
      },
    });
  }

  async create(data: SignUpRequest, type: UserType) {
    return await this.prismaClient.user.create({
      data: {
        ...data,
        userType: type,
      },
      include: {
        customer: true,
        mover: true,
        socialLogin: true,
      },
    });
  }

  async createWithSocialLogin(
    data: SignUpRequest,
    type: UserType,
    provider: string,
    providerId: string,
  ) {
    return await this.prismaClient.user.create({
      data: {
        ...data,
        userType: type,
        socialLogin: {
          create: {
            provider,
            providerId,
          },
        },
      },
      include: {
        customer: true,
        mover: true,
        socialLogin: true,
      },
    });
  }

  async addSocialProvider(email: string, provider: string, providerId: string) {
    return await this.prismaClient.user.update({
      where: {
        email: email,
      },
      data: {
        socialLogin: {
          create: {
            provider,
            providerId,
          },
        },
      },
      include: {
        socialLogin: true,
        customer: true,
        mover: true,
      },
    });
  }
}
