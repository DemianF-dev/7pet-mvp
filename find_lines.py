
try:
    with open(r'c:\Users\oidem\antigravity\scratch\7pet-mvp\backend\prisma\schema.prisma', 'r', encoding='utf-8') as f:
        lines = f.readlines()
except UnicodeDecodeError:
    with open(r'c:\Users\oidem\antigravity\scratch\7pet-mvp\backend\prisma\schema.prisma', 'r', encoding='utf-16') as f:
        lines = f.readlines()
except Exception as e:
    print(f"Error reading file: {e}")
    exit(1)

targets = ['model StaffProfile ', 'model Order ', 'model PayPeriod ', 'model PayStatement ', 'model PayAdjustment ']
for i, line in enumerate(lines):
    for t in targets:
        if t in line:
            print(f"Found {t.strip()} at line {i+1}")
