import os

path = r'd:\Projects\Smart-Library-Management-System\smart_library_app\lib\widgets\hero_section.dart'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

search_bar_start = content.find('// --- Search / Action Bar ---')
featured_card_start = content.find('// --- Featured Card (The "Hero") ---')
end_of_featured_card = content.find('          const SizedBox(height: 10),\n        ],\n      ),\n    );\n  }\n}')

# Extract the chunks
search_chunk = content[search_bar_start:featured_card_start]
featured_chunk = content[featured_card_start:end_of_featured_card]

# Reconstruct
new_content = content[:search_bar_start] + featured_chunk + search_chunk + content[end_of_featured_card:]

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Successfully swapped Featured Card and Search Bar.')
