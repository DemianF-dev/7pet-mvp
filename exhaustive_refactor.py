
import re
import os

src_dir = r'c:\Users\oidem\antigravity\scratch\7pet-mvp\backend\src'

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

for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            file_path = os.path.join(root, file)
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
            except UnicodeDecodeError:
                try:
                    with open(file_path, 'r', encoding='utf-16') as f:
                        content = f.read()
                except Exception as e:
                    print(f"Skipping {file_path}: {e}")
                    continue

            new_content = content
            for pattern, replacement in replacements:
                new_content = re.sub(pattern, replacement, new_content)

            if new_content != content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Refactored {file_path}")
