import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Slot, Redirect, usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { isAdminRole } from '@/lib/supabase';
import { BrandMark } from '@/components/BrandMark';
import { colors, fonts, fontSize, spacing, radius } from '@/theme/tokens';
import {
  LayoutDashboard,
  Wallet,
  Users,
  Receipt,
  ScrollText,
  Settings,
  Bell,
  BookOpen,
  LifeBuoy,
  LogOut,
  ShoppingBag,
  FileText,
  Menu,
  X,
  ChevronLeft,
} from 'lucide-react-native';

type NavItem = { href: string; label: string; icon: any };

const NAV: NavItem[] = [
  { href: '/(admin)/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/(admin)/payouts', label: 'Payouts', icon: Wallet },
  { href: '/(admin)/transactions', label: 'Transacciones', icon: Receipt },
  { href: '/(admin)/users', label: 'Usuarios', icon: Users },
  { href: '/(admin)/content', label: 'Contenido', icon: BookOpen },
  { href: '/(admin)/store', label: 'Tienda', icon: ShoppingBag },
  { href: '/(admin)/publicaciones', label: 'Publicaciones', icon: FileText },
  { href: '/(admin)/notifications', label: 'Notificaciones', icon: Bell },
  { href: '/(admin)/support', label: 'Soporte', icon: LifeBuoy },
  { href: '/(admin)/audit', label: 'Auditoría', icon: ScrollText },
  { href: '/(admin)/settings', label: 'Ajustes', icon: Settings },
];

function useSectionLabel(pathname: string | null): string {
  if (!pathname) return 'Admin';
  for (const item of NAV) {
    if (pathname.includes(item.href.replace('/(admin)', ''))) return item.label;
  }
  return 'Admin';
}

type NavContentProps = {
  pathname: string | null;
  router: ReturnType<typeof useRouter>;
  profile: any;
  roles: string[];
  signOut: () => void;
  onNavPress?: () => void;
};

function NavContent({ pathname, router, profile, roles, signOut, onNavPress }: NavContentProps) {
  return (
    <>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: spacing.md }}>
        {NAV.map((item) => {
          const active = pathname?.includes(item.href.replace('/(admin)', ''));
          const Icon = item.icon;
          return (
            <Pressable
              key={item.href}
              onPress={() => {
                router.push(item.href as any);
                onNavPress?.();
              }}
              style={[styles.navItem, active && styles.navItemActive]}
            >
              <Icon size={18} color={active ? colors.cream[100] : colors.cream[200]} strokeWidth={1.6} />
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={styles.userBlock}>
        <Text style={styles.userName} numberOfLines={1}>
          {profile?.full_name ?? 'Capitán'}
        </Text>
        <Text style={styles.userRole} numberOfLines={1}>
          {roles.filter((r) => r.startsWith('admin_')).join(' · ')}
        </Text>
        <Pressable onPress={signOut} style={styles.signOut}>
          <LogOut size={14} color={colors.cream[200]} />
          <Text style={styles.signOutText}>Cerrar sesión</Text>
        </Pressable>
      </View>
    </>
  );
}

function NavDrawer({
  visible,
  onClose,
  pathname,
  router,
  profile,
  roles,
  signOut,
}: { visible: boolean; onClose: () => void } & NavContentProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.drawerOverlay}>
        <TouchableOpacity style={styles.drawerBackdrop} onPress={onClose} activeOpacity={1} />
        <View style={[styles.drawer, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.drawerHeader}>
            <BrandMark variant="wordmark" theme="light" size={18} />
            <TouchableOpacity onPress={onClose} style={styles.drawerClose} hitSlop={12}>
              <X size={22} color={colors.cream[200]} strokeWidth={1.5} />
            </TouchableOpacity>
          </View>
          <NavContent
            pathname={pathname}
            router={router}
            profile={profile}
            roles={roles}
            signOut={signOut}
            onNavPress={onClose}
          />
        </View>
      </View>
    </Modal>
  );
}

function MobileHeader({
  sectionLabel,
  onMenu,
  onBack,
}: {
  sectionLabel: string;
  onMenu: () => void;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.mobileHeader, { paddingTop: insets.top + 10 }]}>
      <TouchableOpacity onPress={onBack} style={styles.mobileHeaderBtn} hitSlop={12}>
        <ChevronLeft size={22} color={colors.cream[100]} strokeWidth={1.5} />
      </TouchableOpacity>
      <Text style={styles.mobileHeaderTitle} numberOfLines={1}>
        {sectionLabel}
      </Text>
      <TouchableOpacity onPress={onMenu} style={styles.mobileHeaderBtn} hitSlop={12}>
        <Menu size={22} color={colors.cream[100]} strokeWidth={1.5} />
      </TouchableOpacity>
    </View>
  );
}

export default function AdminLayout() {
  const { session, roles, loading, signOut, profile } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const isLargeScreen = width >= 768;
  const sectionLabel = useSectionLabel(pathname);

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator color={colors.gold[500]} />
      </View>
    );
  }
  if (!session) return <Redirect href="/(auth)/check-in" />;
  if (!isAdminRole(roles as string[])) return <Redirect href="/(app)/(tabs)/terminal" />;

  // Sidebar layout — iPad landscape/portrait and web
  if (isLargeScreen) {
    return (
      <View style={styles.shell}>
        <View style={[styles.sidebar, { paddingTop: insets.top + spacing.lg }]}>
          <View style={styles.brandBlock}>
            <BrandMark variant="wordmark" theme="light" size={22} />
            <Text style={styles.brandTag}>Cabina de mando</Text>
          </View>
          <NavContent
            pathname={pathname}
            router={router}
            profile={profile}
            roles={roles as string[]}
            signOut={signOut}
          />
        </View>
        <View style={styles.content}>
          <Slot />
        </View>
      </View>
    );
  }

  // Mobile layout — iPhone
  return (
    <View style={styles.fill}>
      <MobileHeader
        sectionLabel={sectionLabel}
        onMenu={() => setDrawerOpen(true)}
        onBack={() => router.replace('/(app)/(tabs)/terminal')}
      />
      <View style={styles.content}>
        <Slot />
      </View>
      <NavDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        pathname={pathname}
        router={router}
        profile={profile}
        roles={roles as string[]}
        signOut={signOut}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream[50] },
  fill: { flex: 1, backgroundColor: colors.cream[50] },
  shell: { flex: 1, flexDirection: 'row', backgroundColor: colors.cream[50], minHeight: '100%' as any },

  // Sidebar (large screens)
  sidebar: {
    width: 248,
    backgroundColor: colors.burgundy[900],
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    borderRightWidth: 1,
    borderRightColor: colors.burgundy[800],
  },
  brandBlock: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    gap: 6,
  },
  brandTag: {
    fontFamily: fonts.support,
    color: colors.gold[400],
    fontSize: 10,
    letterSpacing: 4,
    textTransform: 'uppercase' as any,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    marginBottom: 2,
  },
  navItemActive: { backgroundColor: colors.burgundy[700] },
  navLabel: { fontFamily: fonts.bodyMedium, color: colors.cream[200], fontSize: fontSize.sm },
  navLabelActive: { color: colors.cream[100] },
  userBlock: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  userName: { fontFamily: fonts.bodySemibold, color: colors.cream[100], fontSize: fontSize.sm },
  userRole: { fontFamily: fonts.support, color: colors.gold[400], fontSize: 10, marginTop: 2, letterSpacing: 1 },
  signOut: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm },
  signOutText: { fontFamily: fonts.body, color: colors.cream[200], fontSize: fontSize.xs },
  content: { flex: 1, backgroundColor: colors.cream[50] },

  // Mobile header
  mobileHeader: {
    backgroundColor: colors.burgundy[900],
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(175,137,86,0.25)',
  },
  mobileHeaderBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileHeaderTitle: {
    flex: 1,
    fontFamily: fonts.bodySemibold,
    color: colors.cream[100],
    fontSize: fontSize.base,
    textAlign: 'center',
  },

  // Nav drawer (mobile)
  drawerOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(48,5,14,0.55)',
  },
  drawerBackdrop: { flex: 1 },
  drawer: {
    width: 280,
    backgroundColor: colors.burgundy[900],
    paddingHorizontal: spacing.md,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    marginBottom: 4,
  },
  drawerClose: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
