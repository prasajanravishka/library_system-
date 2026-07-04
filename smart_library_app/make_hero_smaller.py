import os

path = r'd:\Projects\Smart-Library-Management-System\smart_library_app\lib\widgets\hero_section.dart'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Top Padding
content = content.replace(
    "SizedBox(height: MediaQuery.of(context).padding.top + 20),",
    "SizedBox(height: MediaQuery.of(context).padding.top + 10),"
)

# 2. Avatar Size
content = content.replace(
    "borderRadius: BorderRadius.circular(24),",
    "borderRadius: BorderRadius.circular(20),"
)
content = content.replace("width: 48,", "width: 40,")
content = content.replace("height: 48,", "height: 40,")

# 3. Name Font Size
content = content.replace(
    "fontSize: 22,",
    "fontSize: 20,"
)

# 4. Spacing before search bar
content = content.replace(
    "const SizedBox(height: 24),",
    "const SizedBox(height: 16),"
)

# 5. Search bar height
content = content.replace(
    "height: 56,",
    "height: 48,"
)

# 6. Spacing before featured card
content = content.replace(
    "const SizedBox(height: 30),",
    "const SizedBox(height: 20),"
)

# 7. Featured Card Padding
content = content.replace(
    "padding: const EdgeInsets.all(24),",
    "padding: const EdgeInsets.all(16),"
)

# 8. Featured Card Title Font Size
content = content.replace(
    "fontSize: 26,",
    "fontSize: 20,"
)

# 9. Featured Card Subtitle Font Size
content = content.replace(
    "fontSize: 14,\n                        fontWeight: FontWeight.w400,\n                        height: 1.4,",
    "fontSize: 12,\n                        fontWeight: FontWeight.w400,\n                        height: 1.3,"
)

# 10. Featured Card Button Padding
content = content.replace(
    "padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),",
    "padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),"
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Hero Section made smaller successfully')
