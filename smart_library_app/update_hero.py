import os

path = r'd:\Projects\Smart-Library-Management-System\smart_library_app\lib\widgets\hero_section.dart'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix search bar color
content = content.replace(
    "color: const Color(0xFF1E293B).withOpacity(0.7),",
    "color: Theme.of(context).colorScheme.surface.withOpacity(0.7),"
)

# Add profileAsync
content = content.replace(
    "final dashboardAsync = ref.watch(userDashboardProvider(authState.userId));",
    "final dashboardAsync = ref.watch(userDashboardProvider(authState.userId));\n    final profileAsync = ref.watch(userProfileProvider(authState.userId));"
)

# Replace the Featured Card
featured_card_start = content.find('// --- Featured Card (The "Hero") ---')
featured_card_end = content.find('const SizedBox(height: 10),', featured_card_start)

stats_card = '''// --- Stats Card (The "Hero") ---
          FadeInUp(
            delay: const Duration(milliseconds: 200),
            child: profileAsync.when(
              data: (profile) {
                final readCount = '';
                final overdueCount = '';
                final rank = profile['rank'] ?? 'Bronze';
                
                return ClipRRect(
                  borderRadius: BorderRadius.circular(24),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          const Color(0xFF8B5CF6).withOpacity(0.85), // Vibrant Purple
                          const Color(0xFF06B6D4).withOpacity(0.85), // Cyan
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF8B5CF6).withOpacity(0.3),
                          blurRadius: 20,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'YOUR STATS',
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.2,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            _buildStatItem('Read', readCount, Icons.menu_book),
                            Container(width: 1, height: 40, color: Colors.white24),
                            _buildStatItem('Overdue', overdueCount, Icons.warning_amber_rounded),
                            Container(width: 1, height: 40, color: Colors.white24),
                            _buildStatItem('Rank', rank, Icons.military_tech),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
              loading: () => const SizedBox(height: 120, child: Center(child: CircularProgressIndicator(color: AppColors.cyan))),
              error: (_, __) => const SizedBox.shrink(),
            ),
          ),
          
'''

content = content[:featured_card_start] + stats_card + content[featured_card_end:]

# Add helper method to HeroSectionWidget class
method_to_add = '''
  Widget _buildStatItem(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, color: Colors.white, size: 24),
        const SizedBox(height: 8),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(
            color: Colors.white70,
            fontSize: 12,
          ),
        ),
      ],
    );
  }
}'''

content = content.replace("}\n}", "}\n" + method_to_add)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Successfully updated Hero Section with Stats Card and fixed search bar color.')
