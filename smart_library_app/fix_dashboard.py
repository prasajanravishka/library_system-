import os

path = r'd:\Projects\Smart-Library-Management-System\smart_library_app\lib\screens\dashboard_screen.dart'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if line.startswith('class CategoryInteractiveCard extends StatefulWidget'):
        break
    new_lines.append(line)

content = ''.join(new_lines)

# Add imports
content = content.replace(
    "import 'notifications_screen.dart';",
    "import 'notifications_screen.dart';\nimport '../widgets/interactive_cards.dart';\nimport 'all_categories_screen.dart';\nimport 'all_featured_books_screen.dart';"
)

# Update see all callbacks
content = content.replace(
    "ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('All Categories screen coming soon!')));",
    "Navigator.push(context, MaterialPageRoute(builder: (_) => const AllCategoriesScreen()));"
)

content = content.replace(
    "ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('All Featured Books screen coming soon!')));",
    "Navigator.push(context, MaterialPageRoute(builder: (_) => const AllFeaturedBooksScreen()));"
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Dashboard screen updated!')
