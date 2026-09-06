import React, { useEffect, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { router } from "expo-router";

const BACKEND_URL =
  (typeof process !== "undefined" && process.env.EXPO_PUBLIC_BACKEND_URL) ||
  "http://localhost:5000";

export default function AdminDashboard() {
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isSimulation, setIsSimulation] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/dashboard-stats`);
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setIsSimulation(!!data.stats.isSimulationMode);
      }
    } catch (err) {
      console.error("Erreur chargement stats admin:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleToggleSimulation = async (value: boolean) => {
    setUpdating(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/toggle-simulation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enable: value,
          adminEmail: "superadmin@vora.cm",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsSimulation(data.isSimulation);
        Alert.alert(
          "Mode Simulation CamerPay",
          `Mode simulation ${data.isSimulation ? "ACTIVÉ — paiements simulés sans débit réel." : "DÉSACTIVÉ — clés API CamerPay réelles actives."}`
        );
      }
    } catch {
      Alert.alert("Erreur", "Impossible de mettre à jour le mode simulation.");
    } finally {
      setUpdating(false);
    }
  };

  const StatCard = ({
    label,
    value,
    sub,
    accent,
  }: {
    label: string;
    value: string | number;
    sub?: string;
    accent?: boolean;
  }) => (
    <View style={[styles.statCard, isWide && styles.statCardWide]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, accent && styles.statValueAccent]}>
        {value}
      </Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          isWide && { maxWidth: 1100, alignSelf: "center", width: "100%" },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchStats();
            }}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerBadgeRow}>
            <TouchableOpacity
              style={styles.backAppBtn}
              onPress={() => router.replace("/(root)/(tabs)/profile")}
              activeOpacity={0.8}
            >
              <Text style={styles.backAppBtnText}>← Retour App</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoText}>VORA</Text>
              </View>
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>SUPER ADMIN</Text>
              </View>
            </View>
          </View>
          <Text style={styles.headerTitle}>Administration VORA</Text>
          <Text style={styles.headerSub}>
            Gestion de la plateforme, paiements et sécurité
          </Text>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => router.replace("/(auth)/sign-in")}
            activeOpacity={0.85}
          >
            <Text style={styles.logoutBtnText}>Déconnexion Admin</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {/* Simulation CamerPay Toggle */}
          <View
            style={[
              styles.simulCard,
              {
                borderColor: isSimulation
                  ? "rgba(14, 165, 233, 0.4)"
                  : "rgba(239, 68, 68, 0.3)",
              },
            ]}
          >
            <View style={styles.simulRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.simulLabel}>PAIEMENTS CAMERPAY</Text>
                <Text style={styles.simulTitle}>Mode Simulation</Text>
              </View>
              <Switch
                value={isSimulation}
                onValueChange={handleToggleSimulation}
                disabled={updating}
                trackColor={{ false: "#CBD5E1", true: "#0EA5E9" }}
                thumbColor={isSimulation ? "#FFFFFF" : "#F1F5F9"}
              />
            </View>

            <View
              style={[
                styles.simulInfoBox,
                {
                  backgroundColor: isSimulation ? "#F0F9FF" : "#FFFBEB",
                  borderColor: isSimulation ? "#BAE6FD" : "#FDE68A",
                },
              ]}
            >
              <Text
                style={[
                  styles.simulInfoText,
                  { color: isSimulation ? "#0369A1" : "#92400E" },
                ]}
              >
                {isSimulation
                  ? "SIMULATION ACTIVÉE — Les transactions MTN & Orange Money réussiront automatiquement pour les tests de validation."
                  : "MODE RÉEL — Les transactions feront des requêtes en direct vers l'API CamerPay."}
              </Text>
            </View>
          </View>

          {/* Stats Grid */}
          <Text style={styles.sectionTitle}>Aperçu de la Plateforme</Text>

          {loading ? (
            <View style={styles.loadingRow}>
              <Text style={styles.loadingText}>Chargement des statistiques...</Text>
            </View>
          ) : (
            <View style={[styles.statsGrid, isWide && styles.statsGridWide]}>
              <StatCard
                label="UTILISATEURS"
                value={stats?.totalUsers ?? 0}
                sub="Comptes inscrits"
              />
              <StatCard
                label="CHAUFFEURS"
                value={stats?.totalDrivers ?? 0}
                sub={`${stats?.onlineDrivers ?? 0} actuellement en ligne`}
                accent
              />
              <StatCard
                label="COURSES EFFECTUÉES"
                value={stats?.completedRides ?? 0}
                sub={`sur ${stats?.totalRides ?? 0} demandées`}
              />
              <StatCard
                label="REVENUS CUMULÉS"
                value={`${(stats?.totalRevenueFcfa ?? 0).toLocaleString()} FCFA`}
                sub="Volume de la plateforme"
                accent
              />
            </View>
          )}

          {/* Quick Actions */}
          <Text style={styles.sectionTitle}>Actions Rapides</Text>
          <View style={[styles.actionsGrid, isWide && styles.actionsGridWide]}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push("/(root)/(tabs)/home")}
              activeOpacity={0.8}
            >
              <Text style={styles.actionCardTitle}>App Passager</Text>
              <Text style={styles.actionCardSub}>Voir l'interface utilisateur</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push("/(driver)/dashboard" as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.actionCardTitle}>Espace Chauffeur</Text>
              <Text style={styles.actionCardSub}>Tableau de bord chauffeur</Text>
            </TouchableOpacity>
          </View>

          {/* Security Notice */}
          <View style={styles.securityNotice}>
            <Text style={styles.securityNoticeText}>
              Accès admin journalisé. Toute action est enregistrée avec un horodatage et l'IP d'origine pour des raisons de sécurité.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  // Header
  header: {
    backgroundColor: "#0284C7",
    paddingHorizontal: 24,
    paddingTop: 52,
    paddingBottom: 32,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  logoBadge: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  logoText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0284C7",
    letterSpacing: 1,
  },
  adminBadge: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: -0.4,
  },
  headerSub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "500",
    marginTop: 4,
    marginBottom: 20,
  },
  backAppBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  backAppBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#38BDF8",
  },
  logoutBtn: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },
  // Body
  body: {
    padding: 20,
  },
  // Simulation Card
  simulCard: {
    backgroundColor: "#1E293B",
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
  },
  simulRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  simulLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0EA5E9",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  simulTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#F1F5F9",
  },
  simulInfoBox: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  simulInfoText: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  // Stats
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#F1F5F9",
    marginBottom: 12,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 28,
  },
  statsGridWide: {
    flexWrap: "nowrap",
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  statCardWide: {
    minWidth: 0,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 26,
    fontWeight: "900",
    color: "#F1F5F9",
  },
  statValueAccent: {
    color: "#0EA5E9",
  },
  statSub: {
    fontSize: 12,
    color: "#475569",
    marginTop: 4,
    fontWeight: "500",
  },
  loadingRow: {
    alignItems: "center",
    paddingVertical: 24,
  },
  loadingText: {
    color: "#64748B",
    fontSize: 14,
  },
  // Actions
  actionsGrid: {
    flexDirection: "column",
    gap: 12,
    marginBottom: 28,
  },
  actionsGridWide: {
    flexDirection: "row",
  },
  actionCard: {
    flex: 1,
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#334155",
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#F1F5F9",
    marginBottom: 4,
  },
  actionCardSub: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  // Security notice
  securityNotice: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  securityNoticeText: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 18,
    textAlign: "center",
  },
});
