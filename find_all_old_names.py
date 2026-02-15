
import re

try:
    with open(r'c:\Users\oidem\antigravity\scratch\7pet-mvp\backend\prisma\schema.prisma', 'r', encoding='utf-8') as f:
        content = f.read()
except UnicodeDecodeError:
    with open(r'c:\Users\oidem\antigravity\scratch\7pet-mvp\backend\prisma\schema.prisma', 'r', encoding='utf-16') as f:
        content = f.read()

pattern = r'\b(?<!Staff)Pay(Statement|Adjustment|Period)\b'
matches = re.finditer(pattern, content)

results = []
for match in matches:
    start = match.start()
    line_no = content.count('\n', 0, start) + 1
    line_start = content.rfind('\n', 0, start) + 1
    line_end = content.find('\n', start)
    line_content = content[line_start:line_end].strip()
    results.append(f"{line_no}: {line_content}")

if not results:
    print("No matches found.")
else:
    for r in results:
        print(r)
