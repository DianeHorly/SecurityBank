require('dotenv').config();

const {
  PrismaClient,
  AccountType,
  AccountStatus,
  UserStatus,
  TransactionStatus,
  TransactionType,
} = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  const client1 = await prisma.user.create({
    data: {
      keycloakUserId: 'kc-client-1',
      email: 'client1@bank.local',
      fullName: 'Client One',
      status: UserStatus.ACTIVE,
    },
  });

  const client2 = await prisma.user.create({
    data: {
      keycloakUserId: 'kc-client-2',
      email: 'client2@bank.local',
      fullName: 'Client Two',
      status: UserStatus.ACTIVE,
    },
  });

  const agent1 = await prisma.user.create({
    data: {
      keycloakUserId: 'kc-agent-1',
      email: 'agent1@bank.local',
      fullName: 'Agent One',
      status: UserStatus.ACTIVE,
    },
  });

  const admin1 = await prisma.user.create({
    data: {
      keycloakUserId: 'kc-admin-1',
      email: 'admin1@bank.local',
      fullName: 'Admin One',
      status: UserStatus.ACTIVE,
    },
  });

  const account1 = await prisma.account.create({
    data: {
      accountNumber: 'SB-0001',
      userId: client1.id,
      accountType: AccountType.CURRENT,
      balance: 2500.00,
      currency: 'EUR',
      status: AccountStatus.ACTIVE,
    },
  });

  const account2 = await prisma.account.create({
    data: {
      accountNumber: 'SB-0002',
      userId: client1.id,
      accountType: AccountType.SAVINGS,
      balance: 7000.00,
      currency: 'EUR',
      status: AccountStatus.ACTIVE,
    },
  });

  const account3 = await prisma.account.create({
    data: {
      accountNumber: 'SB-0003',
      userId: client2.id,
      accountType: AccountType.CURRENT,
      balance: 1800.00,
      currency: 'EUR',
      status: AccountStatus.ACTIVE,
    },
  });

  await prisma.transaction.create({
    data: {
      sourceAccountId: account1.id,
      targetAccountId: account3.id,
      amount: 250.00,
      currency: 'EUR',
      type: TransactionType.TRANSFER,
      status: TransactionStatus.EXECUTED,
      initiatedBy: client1.id,
    },
  });

  await prisma.transaction.create({
    data: {
      sourceAccountId: account2.id,
      targetAccountId: account3.id,
      amount: 6000.00,
      currency: 'EUR',
      type: TransactionType.TRANSFER,
      status: TransactionStatus.PENDING,
      initiatedBy: client1.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: client1.id,
      action: 'SEED_CREATED',
      resourceType: 'SYSTEM',
      resourceId: null,
      status: 'SUCCESS',
      details: 'Initial seed data inserted',
    },
  });

  console.log('Seed completed successfully.');
  console.log({ client1, client2, agent1, admin1, account1, account2, account3 });
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();

  });