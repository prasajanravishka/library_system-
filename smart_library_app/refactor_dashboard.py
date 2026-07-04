import os

path = r'd:\Projects\Smart-Library-Management-System\smart_library_app\lib\screens\dashboard_screen.dart'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
content = content.replace(
    "import '../models/category_model.dart';",
    "import '../models/category_model.dart';\nimport '../widgets/hero_section.dart';"
)

# Replace the first SliverToBoxAdapter child which is _buildHeroSection
import re
# Find where the slivers start
pattern = r'slivers: \[\s*// 1. Premium Hero Section\s*SliverToBoxAdapter\(\s*child: _buildHeroSection\(context, authState, dashboardAsync\),\s*\),'
replacement = "slivers: [\n            // 1. Industrial-Standard Hero Section\n            const SliverToBoxAdapter(\n              child: HeroSectionWidget(),\n            ),"
content = re.sub(pattern, replacement, content)

# Remove the _buildHeroSection method completely
method_start = content.find('Widget _buildHeroSection(BuildContext context')
if method_start != -1:
    method_end = content.find('Widget _buildSectionHeader', method_start)
    if method_end != -1:
        content = content[:method_start] + content[method_end:]

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Successfully integrated HeroSectionWidget into DashboardScreen')
