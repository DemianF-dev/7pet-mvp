
import dotenv from 'dotenv';
dotenv.config();
import prisma from './src/lib/prisma';

async function main() {
    const email = 'oidemianf@gmail.com';
    console.log(`Checking for user with email: ${email}`);
    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: { customer: true }
        });

        if (user) {
            console.log('User found:', JSON.stringify(user, null, 2));
        } else {
            console.log('User NOT found.');
        }
    } catch (error) {
        console.error("Error querying user:", error);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
