import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Bell, BellOff, ArrowRight } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors, fonts, fontSize, radius, spacing } from '@/theme/tokens';

type AppNotification = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

type ListItem =
  | { type: 'header'; label: string; key: string }
  | { type: 'item'; data: AppNotification; key: string };

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `hace ${days}d`;
  return new Date(dateStr).toLocaleDateString('es', { day: 'numeric', month: 'short' });
}

function getSectionLabel(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Hoy';
  if (days <= 7) return 'Esta semana';
  return 'Antes';
}

function buildListItems(notifications: AppNotification[]): ListItem[] {
  const items: ListItem[] = [];
  let lastSection = '';
  for (const n of notifications) {
    const section = getSectionLabel(n.created_at);
    if (section !== lastSection) {
      items.push({ type: 'header', label: section, key: `h-${section}` });
      lastSection = section;
    }
    items.push({ type: 'item', data: n, key: n.id });
  }
  return items;
}

export default function Notifications() {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);
    const { data } = await supabase
      .from('app_notifications')
      .select('id, title, body, link, read_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications(data ?? []);
    if (!silent) setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  }, [load]);

  const onPress = async (notif: AppNotification) => {
    if (!notif.read_at) {
      await supabase
        .from('app_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read_at: new Date().toISOString() } : n))
      );
    }
    if (notif.link) {
      router.push(notif.link as any);
    }
  };

  const markAllRead = async () => {
    if (!user) return;
    const now = new Date().toISOString();
    await supabase
      .from('app_notifications')
      .update({ read_at: now })
      .eq('user_id', user.id)
      .is('read_at', null);
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? now })));
  };

  const unread = notifications.filter((n) => !n.read_at).length;
  const listItems = buildListItems(notifications);

  return (
    <LinearGradient colors={[colors.burgundy[900], colors.burgundy[800]]} style={{ flex: 1 }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={22} color={colors.cream[100]} />
          </TouchableOpacity>
          <Text style={styles.crumb}>Notificaciones</Text>
          {unread > 0 ? (
            <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
              <Text style={styles.markAllText}>Marcar todo leído</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 80 }} />
          )}
        </View>

        {loading ? (
          <ActivityIndicator color={colors.gold[400]} style={{ marginTop: spacing.xl }} />
        ) : notifications.length === 0 ? (
          <View style={styles.empty}>
            <BellOff size={36} color={colors.cream[200]} strokeWidth={1.3} />
            <Text style={styles.emptyTitle}>Sin notificaciones</Text>
            <Text style={styles.emptyBody}>Aquí verás los avisos del equipo NextFlight.</Text>
          </View>
        ) : (
          <FlatList
            data={listItems}
            keyExtractor={(item) => item.key}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.gold[400]}
                colors={[colors.gold[400]]}
              />
            }
            renderItem={({ item }) => {
              if (item.type === 'header') {
                return <Text style={styles.sectionHeader}>{item.label}</Text>;
              }
              const notif = item.data;
              const isUnread = !notif.read_at;
              return (
                <TouchableOpacity
                  style={[styles.card, isUnread && styles.cardUnread]}
                  onPress={() => onPress(notif)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.dot, isUnread ? styles.dotActive : styles.dotRead]} />
                  <View style={styles.cardBody}>
                    <View style={styles.cardHeader}>
                      <Text style={[styles.cardTitle, isUnread && styles.cardTitleUnread]} numberOfLines={2}>
                        {notif.title}
                      </Text>
                      <Text style={styles.cardTime}>{timeAgo(notif.created_at)}</Text>
                    </View>
                    <Text style={styles.cardText} numberOfLines={3}>{notif.body}</Text>
                    {notif.link ? (
                      <View style={styles.linkRow}>
                        <Text style={styles.linkText}>Ver más</Text>
                        <ArrowRight size={13} color={colors.gold[400]} strokeWidth={1.8} />
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,251,224,0.06)',
  },
  crumb: {
    fontFamily: fonts.supportMedium,
    fontSize: 11,
    letterSpacing: 3,
    color: colors.gold[400],
    textTransform: 'uppercase',
  },
  markAllBtn: { width: 80, alignItems: 'flex-end' },
  markAllText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.cream[200],
    textDecorationLine: 'underline',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontFamily: fonts.headingItalic,
    fontSize: fontSize.xl,
    color: colors.cream[100],
    marginTop: spacing.sm,
  },
  emptyBody: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.cream[200],
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionHeader: {
    fontFamily: fonts.supportMedium,
    fontSize: 10,
    letterSpacing: 2.5,
    color: colors.gold[400],
    textTransform: 'uppercase',
    paddingHorizontal: 2,
    paddingTop: spacing.sm,
    paddingBottom: 6,
  },
  list: { paddingHorizontal: spacing.md, paddingTop: spacing.xs, paddingBottom: 100, gap: spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: 'rgba(255,251,224,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,251,224,0.08)',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  cardUnread: {
    backgroundColor: 'rgba(175,137,86,0.08)',
    borderColor: 'rgba(175,137,86,0.20)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    flexShrink: 0,
  },
  dotActive: { backgroundColor: colors.gold[400] },
  dotRead: { backgroundColor: 'rgba(255,251,224,0.15)' },
  cardBody: { flex: 1, gap: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  cardTitle: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.cream[200],
    lineHeight: 20,
  },
  cardTitleUnread: {
    fontFamily: fonts.bodySemibold,
    color: colors.cream[100],
  },
  cardTime: {
    fontFamily: fonts.support,
    fontSize: 10,
    color: colors.cream[200],
    flexShrink: 0,
    marginTop: 2,
  },
  cardText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.cream[200],
    lineHeight: 18,
  },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  linkText: {
    fontFamily: fonts.bodySemibold,
    fontSize: 11,
    color: colors.gold[400],
    letterSpacing: 0.5,
  },
});
