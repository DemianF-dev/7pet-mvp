import dotenv from 'dotenv';
dotenv.config();

import prisma from './src/lib/prisma';
import bcrypt from 'bcryptjs';

async function createMissingUsers() {
    try {
        console.log('🔧 Checking and creating missing users...\n');

        const usersToCreate = [
            {
                email: 'marcio@gmail.com',
                password: '123456',
                firstName: 'Marcio',
                lastName: 'User',
                name: 'Marcio User',
                phone: '(11) 99999-8888',
                role: 'CLIENTE' as const,
                division: 'CLIENTE' as const
            },
            {
                email: 'claudio@gmail.com',
                password: '123456',
                firstName: 'Claudio',
                lastName: 'User',
                name: 'Claudio User',
                phone: '(11) 99999-7777',
                role: 'CLIENTE' as const,
                division: 'CLIENTE' as const
            }
        ];

        for (const userData of usersToCreate) {
            console.log(`📧 Processing: ${userData.email}`);
            
            // Check if user already exists
            const existingUser = await prisma.user.findUnique({
                where: { email: userData.email },
                include: { customer: true }
            });

            if (existingUser) {
                console.log(`✅ User already exists: ${userData.email}`);
                console.log(`   ID: ${existingUser.id}`);
                console.log(`   Role: ${existingUser.role}`);
                console.log(`   Division: ${existingUser.division}`);
                console.log(`   Active: ${existingUser.active || 'N/A'}`);
                console.log(`   Customer Profile: ${existingUser.customer ? 'YES' : 'NO'}`);
                
                if (existingUser.customer) {
                    console.log(`   Customer Blocked: ${existingUser.customer.isBlocked}`);
                    console.log(`   Customer Type: ${existingUser.customer.type}`);
                }
                
                // Check password hash
                if (!existingUser.passwordHash) {
                    console.log(`   ⚠️  PASSWORD_ISSUE: No password hash set`);
                    
                    // Update with proper password
                    const passwordHash = await bcrypt.hash(userData.password, 10);
                    await prisma.user.update({
                        where: { id: existingUser.id },
                        data: {
                            passwordHash,
                            plainPassword: userData.password
                        }
                    });
                    console.log(`   ✅ Password updated`);
                } else if (existingUser.passwordHash === 'TEMPORARY') {
                    console.log(`   ⚠️  PASSWORD_ISSUE: Temporary password hash detected`);
                    
                    // Update with proper password
                    const passwordHash = await bcrypt.hash(userData.password, 10);
                    await prisma.user.update({
                        where: { id: existingUser.id },
                        data: {
                            passwordHash,
                            plainPassword: userData.password
                        }
                    });
                    console.log(`   ✅ Password fixed`);
                } else if (existingUser.passwordHash === 'GOOGLE_AUTH') {
                    console.log(`   🔐 AUTH_METHOD: Google OAuth only - adding password fallback`);
                    
                    // Add password as fallback for Google users
                    const passwordHash = await bcrypt.hash(userData.password, 10);
                    await prisma.user.update({
                        where: { id: existingUser.id },
                        data: {
                            passwordHash,
                            plainPassword: userData.password
                        }
                    });
                    console.log(`   ✅ Password fallback added`);
                } else {
                    console.log(`   ✅ Password hash looks OK`);
                }
                
                // Check if customer profile exists
                if (!existingUser.customer && existingUser.role === 'CLIENTE') {
                    console.log(`   ⚠️  Creating missing customer profile...`);
                    
                    await prisma.customer.create({
                        data: {
                            userId: existingUser.id,
                            name: existingUser.name || userData.name,
                            phone: existingUser.phone || userData.phone,
                            type: 'AVULSO',
                            discoverySource: 'SYSTEM_FIX',
                            isBlocked: false
                        }
                    });
                    console.log(`   ✅ Customer profile created`);
                }
                
                // Ensure user is not blocked
                if (existingUser.customer?.isBlocked) {
                    console.log(`   ⚠️  UNBLOCKING: User was blocked, unblocking now...`);
                    await prisma.customer.update({
                        where: { id: existingUser.customer.id },
                        data: { isBlocked: false }
                    });
                    console.log(`   ✅ User unblocked`);
                }
                
            } else {
                console.log(`❌ User not found: ${userData.email}`);
                console.log(`   Creating new user...`);
                
                // Create new user with proper password
                const passwordHash = await bcrypt.hash(userData.password, 10);
                
                const newUser = await prisma.user.create({
                    data: {
                        email: userData.email,
                        passwordHash,
                        plainPassword: userData.password,
                        firstName: userData.firstName,
                        lastName: userData.lastName,
                        name: userData.name,
                        phone: userData.phone,
                        role: userData.role,
                        division: userData.division,
                        isEligible: false,
                        active: true,
                        customer: {
                            create: {
                                name: userData.name,
                                phone: userData.phone,
                                type: 'AVULSO',
                                discoverySource: 'SYSTEM_FIX',
                                isBlocked: false
                            }
                        }
                    },
                    include: { customer: true }
                });
                
                console.log(`   ✅ User created successfully!`);
                console.log(`   ID: ${newUser.id}`);
                console.log(`   Password: ${userData.password}`);
            }
            
            console.log('');
        }

        console.log('✅ User creation/fix process completed!');
        
        // Now test the users
        console.log('\n🧪 Testing user access...');
        for (const userData of usersToCreate) {
            const user = await prisma.user.findUnique({
                where: { email: userData.email },
                include: { customer: true }
            });
            
            if (user) {
                console.log(`\n📧 ${userData.email}:`);
                console.log(`   ✅ User exists`);
                console.log(`   🔑 Password test: ${user.passwordHash ? 'HASH_PRESENT' : 'MISSING'}`);
                console.log(`   👤 Role: ${user.role}`);
                console.log(`   🏢 Division: ${user.division}`);
                console.log(`   🚦 Status: ${user.active ? 'ACTIVE' : 'INACTIVE'}`);
                console.log(`   🛍️  Customer: ${user.customer ? 'YES' : 'NO'}`);
                if (user.customer) {
                    console.log(`   🚫 Blocked: ${user.customer.isBlocked ? 'YES' : 'NO'}`);
                }
            }
        }

    } catch (error: any) {
        console.error('❌ Error:', error?.message || 'Unknown error');
        console.error('Full error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createMissingUsers();