import os

path = r'd:\Projects\Smart-Library-Management-System\smart_library_app\lib\widgets\hero_section.dart'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix const Text and const TextStyle containing Theme.of(context)

content = content.replace(
    "const Text(\n                        'Hello,',\n                        style: TextStyle(\n                          color: Theme.of(context).textTheme.bodyMedium?.color,",
    "Text(\n                        'Hello,',\n                        style: TextStyle(\n                          color: Theme.of(context).textTheme.bodyMedium?.color,"
)

content = content.replace(
    "style: const TextStyle(\n                          color: Theme.of(context).colorScheme.onSurface,",
    "style: TextStyle(\n                          color: Theme.of(context).colorScheme.onSurface,"
)

content = content.replace(
    "const Text(\n                          'Search books, authors...',\n                          style: TextStyle(\n                            color: Theme.of(context).textTheme.bodyMedium?.color,",
    "Text(\n                          'Search books, authors...',\n                          style: TextStyle(\n                            color: Theme.of(context).textTheme.bodyMedium?.color,"
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed const expressions in hero_section.dart')
