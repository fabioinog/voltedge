/**
 * Intervention Ranking List - Shows prioritized facilities by intervention points
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
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
        return '#0066cc';
      case 'power':
        return '#ff9900';
      case 'shelter':
        return '#cc0000';
      case 'food':
        return '#00cc00';
      default:
        return '#666666';
    }
  };

  const renderFacility = ({ item, index }) => (
    <Pressable
      style={styles.facilityItem}
      onPress={() => onFacilitySelect(item)}
    >
      <View style={styles.rankBadge}>
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
    elevation: 8,
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
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
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
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
  },
  facilityType: {
    fontSize: 12,
    color: '#666666',
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
    color: '#0066cc',
  },
  pointsLabel: {
    fontSize: 10,
    color: '#666666',
  },
});

export default InterventionRankingList;
