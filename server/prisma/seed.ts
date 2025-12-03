import { PrismaClient, ScreenStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const slides = await prisma.slide.createMany({
    data: [
      {
        title: 'Welcome Slide',
        content: { text: 'Welcome to AccelMenu' },
        mediaUrl: null,
        duration: 10,
        order: 1,
      },
      {
        title: 'Featured Item',
        content: { text: 'Try our new burger!' },
        mediaUrl: 'https://example.com/burger.jpg',
        duration: 15,
        order: 2,
      },
      {
        title: 'Dessert Promo',
        content: { text: 'Get a free dessert with any meal.' },
        mediaUrl: 'https://example.com/dessert.jpg',
        duration: 12,
        order: 3,
      },
    ],
  });

  const screens = await prisma.screen.createMany({
    data: [
      {
        name: 'Lobby Screen',
        location: 'Main Entrance',
        status: ScreenStatus.ACTIVE,
      },
      {
        name: 'Kitchen Display',
        location: 'Kitchen',
        status: ScreenStatus.ACTIVE,
      },
      {
        name: 'Outdoor Sign',
        location: 'Patio',
        status: ScreenStatus.INACTIVE,
      },
    ],
  });

  const lobby = await prisma.screen.findFirst({ where: { name: 'Lobby Screen' } });
  const kitchen = await prisma.screen.findFirst({ where: { name: 'Kitchen Display' } });

  const allSlides = await prisma.slide.findMany({ orderBy: { order: 'asc' } });

  if (lobby && kitchen) {
    await prisma.playlistEntry.createMany({
      data: [
        {
          screenId: lobby.id,
          slideId: allSlides[0]?.id ?? '',
          position: 1,
          active: true,
        },
        {
          screenId: lobby.id,
          slideId: allSlides[1]?.id ?? '',
          position: 2,
          active: true,
        },
        {
          screenId: kitchen.id,
          slideId: allSlides[1]?.id ?? '',
          position: 1,
          active: true,
        },
        {
          screenId: kitchen.id,
          slideId: allSlides[2]?.id ?? '',
          position: 2,
          active: false,
        },
      ].filter((entry) => entry.slideId !== ''),
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
