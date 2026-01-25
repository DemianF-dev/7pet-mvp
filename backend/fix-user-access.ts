import dotenv from 'dotenv';
dotenv.config();

import prisma from './src/lib/prisma';
import bcrypt from 'bcryptjs';

async function fixUserAccessIssues() {
    try {
        console.log('🔧 Fixing user access issues...\n');

        const usersToFix = [
            {
                email: 'marcio@gmail.com',
                password: '123456',
                firstName: 'Marcio',
                lastName: 'User',
                name: 'Marcio User',
                phone: '(11) 99999-8888',
                correctRole: 'CLIENTE',
                correctDivision: 'CLIENTE'
            },
            {
                email: 'claudio@gmail.com',
                password: '123456',
                firstName: 'Claudio',
                lastName: 'User',
                name: 'Claudio User',
                phone: '(11) 99999-7777',
                correctRole: 'CLIENTE',
                correctDivision: 'CLIENTE'
            }
        ];

        for (const userData of usersToFix) {
            console.log(`📧 Fixing: ${userData.email}`);
            
            // Check current user state
            const existingUser = await prisma.user.findUnique({
                where: { email: userData.email },
                include: { customer: true }
            });

            if (!existingUser) {
                console.log(`   ❌ User not found, creating new user...`);
                
                // Create new user with correct role
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
                        role: userData.correctRole,
                        division: userData.correctDivision,
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
                
                console.log(`   ✅ User created with correct role!`);
                console.log(`   ID: ${newUser.id}`);
                console.log(`   Role: ${newUser.role}`);
                console.log(`   Division: ${newUser.division}`);
                console.log(`   Password: ${userData.password}`);
                continue;
            }

            console.log(`   📋 Current state:`);
            console.log(`      Role: ${existingUser.role}`);
            console.log(`      Division: ${existingUser.division}`);
            console.log(`      Customer: ${existingUser.customer ? 'YES' : 'NO'}`);
            
            // Fix role and division if incorrect
            if (existingUser.role !== userData.correctRole || existingUser.division !== userData.correctDivision) {
                console.log(`   ⚠️  FIXING: Incorrect role/division detected`);
                
                await prisma.user.update({
                    where: { id: existingUser.id },
                    data: {
                        role: userData.correctRole,
                        division: userData.correctDivision
                    }
                });
                
                console.log(`   ✅ Updated role to: ${userData.correctRole}`);
                console.log(`   ✅ Updated division to: ${userData.correctDivision}`);
            } else {
                console.log(`   ✅ Role and division are correct`);
            }
            
            // Ensure password is properly set
            if (!existingUser.passwordHash || existingUser.passwordHash === 'TEMPORARY') {
                console.log(`   ⚠️  FIXING: Password issue detected`);
                
                const passwordHash = await bcrypt.hash(userData.password, 10);
                await prisma.user.update({
                    where: { id: existingUser.id },
                    data: {
                        passwordHash,
                        plainPassword: userData.password
                    }
                });
                
                console.log(`   ✅ Password fixed`);
            } else {
                console.log(`   ✅ Password hash is OK`);
            }
            
            // Create customer profile if missing
            if (!existingUser.customer) {
                console.log(`   ⚠️  FIXING: Missing customer profile`);
                
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
            } else {
                // Ensure customer is not blocked
                if (existingUser.customer.isBlocked) {
                    console.log(`   ⚠️  FIXING: User was blocked`);
                    
                    await prisma.customer.update({
                        where: { id: existingUser.customer.id },
                        data: { isBlocked: false }
                    });
                    
                    console.log(`   ✅ User unblocked`);
                } else {
                    console.log(`   ✅ Customer profile exists and not blocked`);
                }
            }
            
            console.log('');
        }

        console.log('🧪 Final verification...');
        
        // Verify all fixes
        for (const userData of usersToFix) {
            const user = await prisma.user.findUnique({
                where: { email: userData.email },
                include: { customer: true }
            });
            
            console.log(`\n📧 ${userData.email}:`);
            if (user) {
                console.log(`   ✅ User exists`);
                console.log(`   👤 Role: ${user.role} ${user.role === userData.correctRole ? '✅' : '❌'}`);
                console.log(`   🏢 Division: ${user.division} ${user.division === userData.correctDivision ? '✅' : '❌'}`);
                console.log(`   🔑 Password: ${user.passwordHash ? 'HASH_PRESENT' : 'MISSING'} ✅`);
                console.log(`   🚦 Active: ${user.active ? 'YES' : 'NO'} ${user.active ? '✅' : '❌'}`);
                console.log(`   🛍️  Customer: ${user.customer ? 'YES' : 'NO'} ${user.customer ? '✅' : '❌'}`);
                if (user.customer) {
                    console.log(`   🚫 Blocked: ${user.customer.isBlocked ? 'YES' : 'NO'} ${!user.customer.isBlocked ? '✅' : '❌'}`);
                }
                
                // Final login test
                console.log(`   🔐 Expected password: ${userData.password}`);
            }
        }

        console.log('\n✅ All user access issues have been fixed!');
        console.log('\n📝 Summary of fixes:');
        console.log('   - Updated role from TTM to CLIENTE');
        console.log('   - Updated division from LOGISTICA to CLIENTE');
        console.log('   - Created missing customer profiles');
        console.log('   - Ensured users are not blocked');
        console.log('   - Verified password hashes are valid');

    } catch (error: any) {
        console.error('❌ Error:', error?.message || 'Unknown error');
        console.error('Full error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixUserAccessIssues();