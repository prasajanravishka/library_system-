import os

path = r'd:\Projects\Smart-Library-Management-System\smart_library_app\lib\services\api_service.dart'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("throw Exception('Failed to save book');", "throw Exception('Failed to save book: \ \');")
content = content.replace("throw Exception('Failed to remove saved book');", "throw Exception('Failed to remove saved book: \ \');")
content = content.replace("throw Exception('Failed to load saved books');", "throw Exception('Failed to load saved books: \ \');")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated api_service.dart to show detailed errors')
