
import re

file_path = r'c:\Users\oidem\antigravity\scratch\7pet-mvp\backend\src\services\hrService.ts'

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
except UnicodeDecodeError:
    with open(file_path, 'r', encoding='utf-16') as f:
        content = f.read()

# Replace models
content = content.replace('prisma.payPeriod', 'prisma.staffPayPeriod')
content = content.replace('prisma.payAdjustment', 'prisma.staffPayAdjustment')
content = content.replace('prisma.payStatement', 'prisma.staffPayStatement')

# Replace field names
content = content.replace('payPeriodId', 'staffPayPeriodId')
content = content.replace('payStatementId', 'staffPayStatementId')

# Replace audit entities
content = content.replace("'PayPeriod'", "'StaffPayPeriod'")
content = content.replace("'PayAdjustment'", "'StaffPayAdjustment'")
content = content.replace("'PayStatement'", "'StaffPayStatement'")

# Replace unique constraint key
content = content.replace('payPeriodId_staffId', 'staffPayPeriodId_staffId')

# Replace relation names in includes
# I should check if there are any
# In getPayPeriods (line 325):
# include: { statements: { include: { staff: ... } }, adjustments: true }
# Wait, let's check StaffPayPeriod relations in schema.
# model StaffPayPeriod {
#   statements  StaffPayStatement[]
#   adjustments StaffPayAdjustment[]
# These are still 'statements' and 'adjustments'. Fine.

# In getPayStatements (line 739):
# include: { staff: ..., payPeriod: true }
# This 'payPeriod' relation in StaffPayStatement is NAMED 'staffPayPeriod' in schema!
content = content.replace('payPeriod: true', 'staffPayPeriod: true')
content = content.replace('payPeriod: { include: { adjustments: true } }', 'staffPayPeriod: { include: { adjustments: true } }')

# In generatePayStatements (line 441):
# const statement = await calculateStaffStatement(staff, period);
# This handles the object passed to upsert.
# The 'period' object comes from getPayPeriods or similar, it has id, startDate, endDate.

# One more thing: createdById vs closedBy?
# I'll check manually if needed.

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Refactored hrService.ts")
