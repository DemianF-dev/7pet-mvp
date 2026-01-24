
$filePath = "backend/src/controllers/managementController.ts"
$content = Get-Content $filePath -Raw
$oldBlock = @"
        const invoices = await prisma.invoice.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                customer: true,
                appointment: {
                    include: { services: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(invoices);
"@

$newBlock = @"
        const [invoices, orders] = await Promise.all([
            prisma.invoice.findMany({
                where: {
                    createdAt: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                include: {
                    customer: true,
                    appointment: {
                        include: { services: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.order.findMany({
                where: {
                    status: 'PAID',
                    createdAt: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                include: {
                    customer: true,
                    items: true
                },
                orderBy: { createdAt: 'desc' }
            })
        ]);

        const normalizedOrders = orders.map((o: any) => ({
            id: o.id,
            amount: o.finalAmount,
            status: 'PAGO',
            createdAt: o.createdAt,
            customer: o.customer || { name: 'Venda S/ Identificação' },
            appointment: {
                services: o.items.map((i: any) => ({ name: i.description }))
            },
            isPOS: true
        }));

        const combined = [...invoices, ...normalizedOrders].sort((a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        res.json(combined);
"@

# Replace using regex to be flexible about whitespace/tabs
$escapedOld = [regex]::Escape($oldBlock).Replace("\ ", "\s+").Replace("\t", "\s+")
$newContent = $content -replace $escapedOld, $newBlock

Set-Content $filePath $newContent -NoNewline
Write-Host "Update completed"
