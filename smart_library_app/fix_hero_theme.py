import os

path = r'd:\Projects\Smart-Library-Management-System\smart_library_app\lib\widgets\hero_section.dart'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Avatar
content = content.replace(
    "color: const Color(0xFF1E293B).withOpacity(0.6),",
    "color: Theme.of(context).colorScheme.surface.withOpacity(0.6),"
)
content = content.replace(
    "border: Border.all(color: Colors.white.withOpacity(0.1)),",
    "border: Border.all(color: Theme.of(context).colorScheme.onSurface.withOpacity(0.1)),"
)
content = content.replace(
    "child: const Icon(Icons.person, color: Colors.white),",
    "child: Icon(Icons.person, color: Theme.of(context).colorScheme.onSurface),"
)

# Greeting
content = content.replace(
    "color: Color(0xFF9CA3AF),",
    "color: Theme.of(context).textTheme.bodyMedium?.color,"
)
content = content.replace(
    """color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          letterSpacing: -0.5,""",
    """color: Theme.of(context).colorScheme.onSurface,
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          letterSpacing: -0.5,"""
)

# Notification Bell
content = content.replace(
    "icon: const Icon(Icons.notifications_outlined, color: Colors.white, size: 24),",
    "icon: Icon(Icons.notifications_outlined, color: Theme.of(context).colorScheme.onSurface, size: 24),"
)

# Search Bar (The color replacement above already caught the search bar container color)
# Search Bar Text
content = content.replace(
    """color: Color(0xFF9CA3AF),
                            fontSize: 16,
                            fontWeight: FontWeight.w400,""",
    """color: Theme.of(context).textTheme.bodyMedium?.color,
                            fontSize: 16,
                            fontWeight: FontWeight.w400,"""
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated hero_section.dart for Light/Dark mode')
