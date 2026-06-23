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

  // 👇 여기가 수정된 핵심 디버깅 코드입니다!
  async findByEmail(email: string) {
    console.log(`\n============== [👻 진실의 명단 확인 (Debug)] ==============`);
    console.log(`🔎 요청 들어온 이메일: [${email}] (길이: ${email.length})`);

    // 1. 서버가 보고 있는 "모든" 유저를 가져옵니다.
    // (만약 유저가 너무 많으면 take: 20 정도로 제한해도 되지만, 지금은 다 봅니다)
    const allUsers = await this.prismaClient.user.findMany({
      select: {
        id: true,
        email: true,
        userType: true,
      },
    });

    console.log(`📉 서버가 보고 있는 총 유저 수: ${allUsers.length}명`);

    // 2. 한 명씩 로그를 찍어서 비교해봅니다.
    let isFoundInLoop = false;

    allUsers.forEach((user, index) => {
      // 정확히 일치하는지 확인
      const isExactMatch = user.email === email;
      // 공백 제거하면 일치하는지 확인
      const isTrimMatch = user.email.trim() === email.trim();

      console.log(
        `${index + 1}. DB값: [${user.userType}] [${user.email}] (길이: ${user.email.length})`,
      );

      if (isExactMatch) {
        console.log(`   👉 ✨ 완벽히 똑같은 이메일 발견! (ID: ${user.id})`);
        isFoundInLoop = true;
      } else if (isTrimMatch) {
        console.log(`   👉 ⚠️ 공백 제거하니 똑같음! (범인은 공백입니다)`);
      }
    });

    if (!isFoundInLoop) {
      console.log(`❌ [결과] 루프를 다 돌았는데 일치하는 이메일이 없습니다.`);
      console.log(`   (서버가 다른 DB를 보고 있을 가능성이 99% 입니다)`);
    }

    console.log(`===========================================================\n`);

    // 3. 실제 로직 실행 (안전을 위해 trim 적용)
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
