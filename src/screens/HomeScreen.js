/**
 * Home Screen - Main dashboard for VoltEdge
 * Displays overview of infrastructure status and prioritized interventions
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { executeQuery } from '../db/database';

/**
 * Home Screen Component
 */
const HomeScreen = () => {
  const navigation = useNavigation();
  // Translation helper - returns English text directly
  const t = (key) => {
    const translations = {
      loading: 'Loading...',
      infrastructureStatus: 'Infrastructure Status',
      realTimeMonitoring: 'Real-time monitoring of critical systems',
      totalAssets: 'Total Assets',
      failed: 'Failed',
      atRisk: 'At Risk',
      pendingActions: 'Pending Actions',
      viewMap: 'View Map',
      keyCapabilities: 'Key Capabilities',
      dependencyAwareMap: 'Dependency-Aware City Map',
      cascadingFailure: 'Cascading Failure System',
      interventionRanking: 'Intervention Ranking Engine',
      survivalWaterMode: 'Minimum Survival Water Mode',
      facilityTimers: 'Facility-Collapse Timers',
      offlineFunctionality: 'Offline Functionality',
    };
    return translations[key] || key;
  };
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAssets: 0,
    failedAssets: 0,
    atRiskAssets: 0,
    pendingInterventions: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  /**
   * Load dashboard statistics from database
   */
  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Get total assets
      const totalAssetsResult = await executeQuery(
        'SELECT COUNT(*) as count FROM infrastructure_assets'
      );
      const totalAssets = totalAssetsResult[0]?.count || 0;

      // Get failed assets
      const failedAssetsResult = await executeQuery(
        'SELECT COUNT(*) as count FROM infrastructure_assets WHERE status = ?',
        ['failed']
      );
      const failedAssets = failedAssetsResult[0]?.count || 0;

      // Get at-risk assets
      const atRiskAssetsResult = await executeQuery(
        'SELECT COUNT(*) as count FROM infrastructure_assets WHERE status = ?',
        ['at_risk']
      );
      const atRiskAssets = atRiskAssetsResult[0]?.count || 0;

      // Get pending interventions
      const pendingInterventionsResult = await executeQuery(
        'SELECT COUNT(*) as count FROM interventions WHERE status = ?',
        ['pending']
      );
      const pendingInterventions = pendingInterventionsResult[0]?.count || 0;

      setStats({
        totalAssets,
        failedAssets,
        atRiskAssets,
        pendingInterventions,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('infrastructureStatus')}</Text>
        <Text style={styles.subtitle}>
          {t('realTimeMonitoring')}
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalAssets}</Text>
          <Text style={styles.statLabel}>{t('totalAssets')}</Text>
        </View>

        <View style={[styles.statCard, styles.statCardFailed]}>
          <Text style={[styles.statValue, styles.statValueFailed]}>
            {stats.failedAssets}
          </Text>
          <Text style={styles.statLabel}>{t('failed')}</Text>
        </View>

        <View style={[styles.statCard, styles.statCardAtRisk]}>
          <Text style={[styles.statValue, styles.statValueAtRisk]}>
            {stats.atRiskAssets}
          </Text>
          <Text style={styles.statLabel}>{t('atRisk')}</Text>
        </View>

        <View style={[styles.statCard, styles.statCardInterventions]}>
          <Text style={[styles.statValue, styles.statValueInterventions]}>
            {stats.pendingInterventions}
          </Text>
          <Text style={styles.statLabel}>{t('pendingActions')}</Text>
        </View>
      </View>

      <Pressable
        style={styles.mapButton}
        onPress={() => navigation.navigate('Map')}
      >
        <Text style={styles.mapButtonText}>{t('viewMap')}</Text>
      </Pressable>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>{t('keyCapabilities')}</Text>
        <View style={styles.capabilityList}>
          <Text style={styles.capabilityItem}>
            • {t('dependencyAwareMap')}
          </Text>
          <Text style={styles.capabilityItem}>
            • {t('cascadingFailure')}
          </Text>
          <Text style={styles.capabilityItem}>
            • {t('interventionRanking')}
          </Text>
          <Text style={styles.capabilityItem}>
            • {t('survivalWaterMode')}
          </Text>
          <Text style={styles.capabilityItem}>
            • {t('facilityTimers')}
          </Text>
          <Text style={styles.capabilityItem}>
            • {t('offlineFunctionality')}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statCardFailed: {
    borderLeftWidth: 4,
    borderLeftColor: '#cc0000',
  },
  statCardAtRisk: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff9900',
  },
  statCardInterventions: {
    borderLeftWidth: 4,
    borderLeftColor: '#0066cc',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  statValueFailed: {
    color: '#cc0000',
  },
  statValueAtRisk: {
    color: '#ff9900',
  },
  statValueInterventions: {
    color: '#0066cc',
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  mapButton: {
    backgroundColor: '#0066cc',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  mapButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  capabilityList: {
    gap: 8,
  },
  capabilityItem: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
  },
});

export default HomeScreen;
