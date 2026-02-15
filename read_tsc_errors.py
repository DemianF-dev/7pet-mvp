
try:
    with open(r'c:\Users\oidem\antigravity\scratch\7pet-mvp\backend\tsc_errors.txt', 'r', encoding='utf-16') as f:
        print(f.read())
except Exception as e:
    print(f"Error reading file: {e}")
