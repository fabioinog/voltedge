/**
 * Home Screen - Main dashboard for VoltEdge
 * Displays overview of infrastructure status and prioritized interventions
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { executeQuery } from '../db/database';

/**
 * Home Screen Component
 */
const HomeScreen = () => {
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
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Infrastructure Status</Text>
        <Text style={styles.subtitle}>
          Real-time monitoring of water and power systems
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalAssets}</Text>
          <Text style={styles.statLabel}>Total Assets</Text>
        </View>

        <View style={[styles.statCard, styles.statCardFailed]}>
          <Text style={[styles.statValue, styles.statValueFailed]}>
            {stats.failedAssets}
          </Text>
          <Text style={styles.statLabel}>Failed</Text>
        </View>

        <View style={[styles.statCard, styles.statCardAtRisk]}>
          <Text style={[styles.statValue, styles.statValueAtRisk]}>
            {stats.atRiskAssets}
          </Text>
          <Text style={styles.statLabel}>At Risk</Text>
        </View>

        <View style={[styles.statCard, styles.statCardInterventions]}>
          <Text style={[styles.statValue, styles.statValueInterventions]}>
            {stats.pendingInterventions}
          </Text>
          <Text style={styles.statLabel}>Pending Actions</Text>
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Key Capabilities</Text>
        <View style={styles.capabilityList}>
          <Text style={styles.capabilityItem}>
            • Dependency-Aware City Map
          </Text>
          <Text style={styles.capabilityItem}>
            • Cascading Failure System
          </Text>
          <Text style={styles.capabilityItem}>
            • Intervention Ranking Engine
          </Text>
          <Text style={styles.capabilityItem}>
            • Minimum Survival Water Mode
          </Text>
          <Text style={styles.capabilityItem}>
            • Facility-Collapse Timers
          </Text>
          <Text style={styles.capabilityItem}>
            • Offline Functionality
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
