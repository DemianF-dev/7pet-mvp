import { PrismaClient } from '@prisma/client';
import 'dotenv/config'; // Load env vars

const prisma = new PrismaClient();

async function main() {
    const games = [
        {
            title: 'Paciência Pet',
            slug: 'paciencia-pet',
            description: 'Um clássico jogo de cartas relaxante com tema pet.',
            active: true,
            baseXp: 50
        },
        {
            title: 'Zen Espuma',
            slug: 'zen-espuma',
            description: 'Espuma relaxante para acalmar a mente.',
            active: true,
            baseXp: 10
        },
        {
            title: 'Pet Match',
            slug: 'petmatch',
            description: 'Combine os itens fofos para vencer!',
            active: false, // Coming soon
            baseXp: 30
        },
        {
            title: 'Desenrosca a Coleira',
            slug: 'coleira',
            description: 'Desembaraçe as coleiras sem cruzamentos.',
            active: false, // Coming soon
            baseXp: 20
        }
    ];

    for (const game of games) {
        const existing = await prisma.pauseGame.findUnique({
            where: { slug: game.slug }
        });

        if (!existing) {
            await prisma.pauseGame.create({
                data: game
            });
            console.log(`Created game: ${game.title}`);
        } else {
            console.log(`Game already exists: ${game.title}`);
        }
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
