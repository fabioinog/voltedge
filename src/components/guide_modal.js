import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet, ScrollView } from 'react-native';

const GuideModal = ({ visible, onClose }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>VoltEdge User Guide</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>
          
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={true}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. Navigation & Simulation</Text>
              <Text style={styles.sectionText}>
                VoltEdge includes simulation features for testing and demonstration purposes:
              </Text>
              <View style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.bold}>Walking Simulation:</Text> Use the joystick control to simulate walking and navigate to facilities. This is for simulation purposes only and does not represent actual GPS tracking.
                </Text>
              </View>
              <View style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.bold}>Nearest Facility:</Text> The app will automatically identify and route you to the nearest facility based on your simulated location.
                </Text>
              </View>
              <View style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.bold}>Directions Panel:</Text> When navigating, you'll see turn-by-turn directions to help you reach your destination (Work in proress).
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. Points System & Priority</Text>
              <Text style={styles.sectionText}>
                Each facility has an intervention point value that determines its priority:
              </Text>
              <View style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.bold}>Point Calculation:</Text> Points are calculated using a simulated API that considers factors like facility type, population served, critical dependencies, and current status.
                </Text>
              </View>
              <View style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.bold}>Priority Ranking:</Text> Facilities with higher points appear at the top of the intervention ranking list. The top 5 priority facilities are highlighted with yellow connection lines on the map.
                </Text>
              </View>
              <View style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.bold}>Visual Indicators:</Text> Larger markers indicate higher point values. Green connection lines show operational facilities, yellow lines indicate top priority facilities, and red lines show failed facilities.
                </Text>
              </View>
              <View style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.bold}>Simulated API:</Text> The point system uses simulated data to demonstrate how real-world infrastructure data would be integrated. In production, this would connect to actual infrastructure monitoring systems.
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>3. Failure Simulation</Text>
              <Text style={styles.sectionText}>
                You can simulate facility failures to test the system's response:
              </Text>
              <View style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.bold}>Simulate Failure Button:</Text> Click the "Simulate Failure" button in the admin panel to select a facility and mark it as failed.
                </Text>
              </View>
              <View style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.bold}>Cascading Failures:</Text> When a facility fails, nearby facilities (within 50km) are marked as "at risk" and may be affected by the failure. Only the originally simulated facility becomes "failed" - others are marked as "at risk" to show potential impact.
                </Text>
              </View>
              <View style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.bold}>Visual Indicators:</Text> Failed facilities display with a red glow and pulsing animation. Connection lines to failed facilities turn red. At-risk facilities are shown in the failure display panel on the left side of the screen.
                </Text>
              </View>
              <View style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.bold}>Resolving Failures:</Text> Use the "Resolve Failure" button in the admin panel to select a failed facility and restore it to operational status. When a failed facility is resolved, nearby at-risk facilities are also restored if no other failed facilities are nearby.
                </Text>
              </View>
              
              <View style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.bold}>Alert Team:</Text> For each failed facility, you can send alerts to nearby teams using the "Alert Team" button in the failure display panel.
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tips</Text>
              <View style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>
                  Hover over facility icons on the map to see their names
                </Text>
              </View>
              <View style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>
                  Click on any facility to view detailed information and options
                </Text>
              </View>
              <View style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>
                  Use the intervention ranking list to see prioritized facilities
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: '90%',
    maxWidth: 600,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666666',
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
    lineHeight: 20,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingLeft: 8,
  },
  bullet: {
    fontSize: 16,
    color: '#0066cc',
    marginRight: 8,
    width: 20,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  bold: {
    fontWeight: 'bold',
    color: '#0066cc',
  },
});

export default GuideModal;
