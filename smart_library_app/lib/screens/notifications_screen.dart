import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import '../core/app_theme.dart';
import '../widgets/glass_card.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  // Mock data for UI demonstration
  List<Map<String, dynamic>> notifications = [
    {'id': 1, 'title': 'Overdue Book', 'message': '1984 is 3 days overdue. Please return it.', 'type': 'overdue', 'is_read': false},
    {'id': 2, 'title': 'System Update', 'message': 'The library will be closed on Friday.', 'type': 'system', 'is_read': true},
  ];

  void _markAllAsRead() {
    setState(() {
      for (var n in notifications) {
        n['is_read'] = true;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: FadeInDown(child: Text('Notifications', style: AppTextStyles.heading2)),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.done_all),
            onPressed: _markAllAsRead,
            tooltip: 'Mark all as read',
          )
        ],
      ),
      body: notifications.isEmpty
          ? const Center(child: Text('No notifications', style: TextStyle(color: Colors.white70)))
          : Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 800),
                child: ListView.builder(
              padding: const EdgeInsets.all(20),
              itemCount: notifications.length,
              itemBuilder: (context, index) {
                final notif = notifications[index];
                IconData icon;
                Color color;

                switch (notif['type']) {
                  case 'overdue':
                    icon = Icons.warning_rounded;
                    color = AppColors.red;
                    break;
                  case 'fine':
                    icon = Icons.money_off;
                    color = AppColors.amber;
                    break;
                  case 'system':
                  default:
                    icon = Icons.info_outline;
                    color = AppColors.cyan;
                    break;
                }

                return FadeInUp(
                  delay: Duration(milliseconds: 100 * index),
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: GlassCard(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(icon, color: color, size: 28),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  notif['title'],
                                  style: AppTextStyles.heading3.copyWith(
                                    fontWeight: notif['is_read'] ? FontWeight.normal : FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  notif['message'],
                                  style: TextStyle(color: notif['is_read'] ? Colors.white54 : Colors.white),
                                ),
                              ],
                            ),
                          ),
                          if (!notif['is_read'])
                            Container(
                              width: 10,
                              height: 10,
                              decoration: const BoxDecoration(
                                color: AppColors.cyan,
                                shape: BoxShape.circle,
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
              ),
            ),
    );
  }
}
