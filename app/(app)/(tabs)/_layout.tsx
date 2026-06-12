import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform, Image } from 'react-native';
import { House, BookOpen, Users, User } from 'lucide-react-native';
import { colors, fonts } from '@/theme/tokens';
import { LOGO_PLANE_GOLD } from '@/constants/logos';
import { useAuth } from '@/contexts/AuthContext';

function PlaneTab({ focused }: { focused: boolean }) {
  return (
    <View style={styles.planePad}>
      <View style={[styles.planeCircle, focused && styles.planeCircleActive]}>
        <Image
          source={LOGO_PLANE_GOLD}
          style={{ width: 42, height: 42 }}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const { roles, loading } = useAuth();
  const isStudent = loading || roles.includes('student_free') || roles.includes('student_premium');
  const isAffiliate = loading || roles.includes('affiliate');
  const showCopilotos = isAffiliate || isStudent;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.gold[400],
        tabBarInactiveTintColor: 'rgba(175,137,86,0.45)',
        tabBarStyle: {
          backgroundColor: '#30050E',
          borderTopColor: 'rgba(175,137,86,0.2)',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.support,
          fontSize: 10,
          letterSpacing: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="terminal"
        options={{
          title: 'Terminal',
          tabBarIcon: ({ color, size }) => (
            <House size={size} color={color} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="cursos"
        options={{
          title: 'Lecciones',
          tabBarIcon: ({ color, size }) => (
            <BookOpen size={size} color={color} strokeWidth={1.5} />
          ),
          tabBarItemStyle: isStudent ? undefined : { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="bitacora"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => <PlaneTab focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="copilotos"
        options={{
          title: 'Copilotos',
          tabBarIcon: ({ color, size }) => (
            <Users size={size} color={color} strokeWidth={1.5} />
          ),
          tabBarItemStyle: showCopilotos ? undefined : { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="aduana"
        options={{
          title: isStudent ? 'Perfil' : 'Mi cuenta',
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} strokeWidth={1.5} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  planePad: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'ios' ? 20 : 14,
  },
  planeCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4D0C12',
    borderWidth: 2,
    borderColor: colors.gold[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Platform.OS === 'ios' ? -28 : -22,
    shadowColor: colors.gold[400],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  planeCircleActive: {
    backgroundColor: '#4D0C12',
    borderColor: colors.gold[400],
    borderWidth: 2.5,
    shadowOpacity: 0.55,
    shadowRadius: 16,
  },
});
