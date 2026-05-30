const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    include: {
      productstock: true
    }
  });
  console.log('--- Products in Database ---');
  console.log(JSON.stringify(products, null, 2));

  const transactions = await prisma.transaction.findMany({
    include: {
      products: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 10
  });
  console.log('--- Last 10 Transactions ---');
  console.log(JSON.stringify(transactions, null, 2));

  const total = await prisma.transaction.count();
  console.log('Total transactions in database:', total);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
