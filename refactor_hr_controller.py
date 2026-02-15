
import re

file_path = r'c:\Users\oidem\antigravity\scratch\7pet-mvp\backend\src\controllers\hrController.ts'

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
except UnicodeDecodeError:
    with open(file_path, 'r', encoding='utf-16') as f:
        content = f.read()

# Replace variables and object keys
# payPeriodId -> staffPayPeriodId
content = content.replace('payPeriodId', 'staffPayPeriodId')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Refactored hrController.ts")
