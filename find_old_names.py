
import re

try:
    with open(r'c:\Users\oidem\antigravity\scratch\7pet-mvp\backend\prisma\schema.prisma', 'r', encoding='utf-8') as f:
        content = f.read()
except UnicodeDecodeError:
    with open(r'c:\Users\oidem\antigravity\scratch\7pet-mvp\backend\prisma\schema.prisma', 'r', encoding='utf-16') as f:
        content = f.read()

# Search for substrings PayStatement, PayAdjustment, PayPeriod NOT preceded by Staff
pattern = r'(?<!Staff)Pay(Statement|Adjustment|Period)'
matches = re.finditer(pattern, content)

for match in matches:
    start = match.start()
    line_no = content.count('\n', 0, start) + 1
    print(f"Found '{match.group()}' at line {line_no}: ...{content[start-20:start+20]}...")
