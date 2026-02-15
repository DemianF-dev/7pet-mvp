
import re
import os

files_to_refactor = [
    r'c:\Users\oidem\antigravity\scratch\7pet-mvp\backend\src\controllers\hrController.ts',
    r'c:\Users\oidem\antigravity\scratch\7pet-mvp\backend\src\services\timeTrackingService.ts'
]

replacements = [
    (r'\bpayPeriodId\b', 'staffPayPeriodId'),
    (r'\bpayStatementId\b', 'staffPayStatementId'),
    (r'\bpayPeriod\b', 'staffPayPeriod'),
    (r'\bpayStatement\b', 'staffPayStatement'),
    (r'\bpayAdjustment\b', 'staffPayAdjustment'),
    (r'\bPayPeriod\b', 'StaffPayPeriod'),
    (r'\bPayStatement\b', 'StaffPayStatement'),
    (r'\bPayAdjustment\b', 'StaffPayAdjustment')
]

for file_path in files_to_refactor:
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        continue
        
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        with open(file_path, 'r', encoding='utf-16') as f:
            content = f.read()

    for pattern, replacement in replacements:
        content = re.sub(pattern, replacement, content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Refactored {file_path}")
