/**
 * Intervention Ranking List - Shows prioritized facilities by intervention points
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { ACCENT_BLUE, transitionStyle } from '../theme';

/**
 * Intervention Ranking List Component
 */
const InterventionRankingList = ({ facilities, onFacilitySelect }) => {
  // Translation helper - returns English text directly
  const t = (key, params) => {
    const translations = {
      water: 'Water',
      power: 'Power',
      shelter: 'Shelter',
      food: 'Food',
      hospital: 'Hospital',
      pts: 'pts',
      interventionPriority: 'Intervention Priority',
      topFacilities: `Top ${params?.count || 0} Facilities`,
    };
    return translations[key] || key;
  };
  const sortedFacilities = [...facilities].sort(
    (a, b) => b.intervention_points - a.intervention_points
  );

  const getTypeColor = (type) => {
    switch (type) {
      case 'water':
        return ACCENT_BLUE;
      case 'power':
        return '#ff9900';
      case 'shelter':
        return '#cc0000';
      case 'food':
        return '#00cc00';
      case 'hospital':
        return '#cc00cc';
      default:
        return '#666666';
    }
  };

  const isFailed = (facility) => facility.status === 'failed';

  const renderFacility = ({ item, index }) => (
    <Pressable
      style={({ pressed }) => [
        styles.facilityItem,
        isFailed(item) && styles.facilityItemFailed,
        transitionStyle,
        { opacity: pressed ? 0.85 : 1 },
      ]}
      onPress={() => onFacilitySelect(item)}
    >
      <View style={[styles.rankBadge, isFailed(item) && styles.rankBadgeFailed]}>
        <Text style={styles.rankNumber}>{index + 1}</Text>
      </View>
      <View style={styles.facilityInfo}>
        <Text style={styles.facilityName}>{item.name}</Text>
        <Text style={styles.facilityType}>{t(item.type).toUpperCase()}</Text>
      </View>
      <View style={[styles.typeIndicator, { backgroundColor: getTypeColor(item.type) }]} />
      <View style={styles.pointsContainer}>
        <Text style={styles.pointsValue}>{item.intervention_points.toFixed(1)}</Text>
        <Text style={styles.pointsLabel}>{t('pts')}</Text>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('interventionPriority')}</Text>
        <Text style={styles.headerSubtitle}>
          {t('topFacilities', { count: sortedFacilities.length })}
        </Text>
      </View>
      <FlatList
        data={sortedFacilities}
        renderItem={renderFacility}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
    zIndex: 1100,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
    textAlign: 'left',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'left',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 8,
  },
  facilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
  },
  facilityItemFailed: {
    backgroundColor: '#ffe6e6',
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ACCENT_BLUE,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankBadgeFailed: {
    backgroundColor: '#cc0000',
  },
  rankNumber: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  facilityInfo: {
    flex: 1,
  },
  facilityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
    textAlign: 'left',
  },
  facilityType: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'left',
  },
  typeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  pointsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: ACCENT_BLUE,
  },
  pointsLabel: {
    fontSize: 10,
    color: '#666666',
    textAlign: 'right',
  },
});

export default InterventionRankingList;
