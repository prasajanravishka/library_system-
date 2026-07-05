import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:animate_do/animate_do.dart';
import '../core/app_theme.dart';
import '../providers/providers.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() =>
      _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  void _markAllAsRead() async {
    try {
      final userId = ref.read(authProvider).userId;
      await ref.read(apiServiceProvider).markAllNotificationsRead(userId);
      ref.invalidate(notificationsProvider(userId));
      ref.invalidate(userDashboardProvider(userId));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.red),
        );
      }
    }
  }

  void _markAsRead(int notificationId) async {
    try {
      final userId = ref.read(authProvider).userId;
      await ref.read(apiServiceProvider).markNotificationRead(notificationId);
      ref.invalidate(notificationsProvider(userId));
      ref.invalidate(userDashboardProvider(userId));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.red),
        );
      }
    }
  }

  void _deleteNotification(int notificationId) async {
    try {
      final userId = ref.read(authProvider).userId;
      await ref.read(apiServiceProvider).deleteNotification(notificationId);
      ref.invalidate(notificationsProvider(userId));
      ref.invalidate(userDashboardProvider(userId));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final userId = ref.watch(authProvider).userId;
    final notificationsAsync = ref.watch(notificationsProvider(userId));

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: FadeInDown(
          child: Text(
            'Notifications',
            style: AppTextStyles.heading2.copyWith(
              color: Theme.of(context).colorScheme.onSurface,
            ),
          ),
        ),
        centerTitle: true,
        iconTheme: IconThemeData(color: Theme.of(context).colorScheme.onSurface),
        actions: [
          IconButton(
            icon: Icon(Icons.done_all, color: Theme.of(context).colorScheme.onSurface),
            onPressed: _markAllAsRead,
            tooltip: 'Mark all as read',
          ),
        ],
      ),
      body: notificationsAsync.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.cyan),
        ),
        error: (error, _) => Center(
          child: Text(
            'Error: $error',
            style: const TextStyle(color: AppColors.red),
          ),
        ),
        data: (notifications) {
          if (notifications.isEmpty) {
            return Center(
              child: Text(
                'No notifications',
                style: TextStyle(color: Theme.of(context).textTheme.bodyMedium?.color),
              ),
            );
          }

          return Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 800),
              child: ListView.builder(
                padding: const EdgeInsets.all(20),
                itemCount: notifications.length,
                itemBuilder: (context, index) {
                  final notif = notifications[index];
                  final isRead =
                      notif['is_read'] == true || notif['is_read'] == 1;
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
                    delay: Duration(milliseconds: 50 * index),
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: Dismissible(
                        key: ValueKey(notif['notification_id']),
                        background: Container(
                          color: AppColors.red.withValues(alpha: 0.8),
                          alignment: Alignment.centerRight,
                          padding: const EdgeInsets.only(right: 20),
                          child: const Icon(Icons.delete, color: Colors.white),
                        ),
                        direction: DismissDirection.endToStart,
                        onDismissed: (direction) {
                          _deleteNotification(notif['notification_id']);
                        },
                        child: InkWell(
                          onTap: () {
                            if (!isRead) _markAsRead(notif['notification_id']);
                          },
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: isRead
                                  ? Colors.white
                                  : AppColors.cyan.withValues(alpha: 0.05),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: isRead
                                    ? Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.1)
                                    : AppColors.cyan.withValues(alpha: 0.3),
                              ),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Icon(icon, color: color, size: 28),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        notif['title'],
                                        style: AppTextStyles.heading3.copyWith(
                                          fontWeight: isRead
                                              ? FontWeight.normal
                                              : FontWeight.bold,
                                          color: Theme.of(context).colorScheme.onSurface,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        notif['message'],
                                        style: TextStyle(
                                          color: isRead
                                              ? Theme.of(context).textTheme.bodyMedium?.color
                                              : Theme.of(context).colorScheme.onSurface,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                if (!isRead)
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
                      ),
                    ),
                  );
                },
              ),
            ),
          );
        },
      ),
    );
  }
}
