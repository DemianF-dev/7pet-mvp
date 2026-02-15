import os

def refactor_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Relation names in PayStatement
    # Replace .payPeriod with .staffPayPeriod (careful with word boundaries)
    # Using simple replace for known patterns
    new_content = content.replace('statement.payPeriod', 'statement.staffPayPeriod')
    new_content = new_content.replace('payPeriod:', 'staffPayPeriod:')
    new_content = new_content.replace('payPeriodId', 'staffPayPeriodId')
    
    if content != new_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Refactored: {filepath}")

files = [
    r'src\components\staff\profile\financial\PayStatementList.tsx',
    r'src\pages\staff\hr\PayStatementDetail.tsx',
    r'src\pages\staff\MobileMyHR.tsx',
    r'src\pages\staff\MyHR.tsx'
]

os.chdir(r'c:\Users\oidem\antigravity\scratch\7pet-mvp\frontend')
for f in files:
    if os.path.exists(f):
        refactor_file(f)
    else:
        print(f"Not found: {f}")
