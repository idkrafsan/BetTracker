import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  StyleSheet, ScrollView, Alert 
} from 'react-native';
import { db } from '../firebase/config';
import { collection, addDoc } from 'firebase/firestore';

export default function AddBetScreen({ navigation }) {
  const [match, setMatch] = useState('');
  const [stake, setStake] = useState('');
  const [odds, setOdds] = useState('');
  const [status, setStatus] = useState('pending'); // pending, won, lost

  const saveBet = async () => {
    // Validate inputs
    if (!match || !stake || !odds) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      // Calculate potential/profit loss
      const potentialProfit = parseFloat(stake) * (parseFloat(odds) - 1);
      
      // Save to Firebase
      await addDoc(collection(db, 'bets'), {
        match,
        stake: parseFloat(stake),
        odds: parseFloat(odds),
        status,
        potentialProfit,
        date: new Date().toISOString(),
        createdAt: new Date()
      });

      Alert.alert('Success', 'Bet saved successfully!');
      
      // Clear form
      setMatch('');
      setStake('');
      setOdds('');
      
      // Go to dashboard
      navigation.navigate('Dashboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to save bet');
      console.error(error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add New Bet</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Match</Text>
        <TextInput
          style={styles.input}
          value={match}
          onChangeText={setMatch}
          placeholder="e.g., Team A vs Team B"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Stake (€)</Text>
        <TextInput
          style={styles.input}
          value={stake}
          onChangeText={setStake}
          keyboardType="numeric"
          placeholder="0.00"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Odds</Text>
        <TextInput
          style={styles.input}
          value={odds}
          onChangeText={setOdds}
          keyboardType="numeric"
          placeholder="2.00"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Status</Text>
        <View style={styles.statusContainer}>
          <TouchableOpacity 
            style={[styles.statusButton, status === 'pending' && styles.activeStatus]}
            onPress={() => setStatus('pending')}
          >
            <Text>Pending</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.statusButton, status === 'won' && styles.activeStatus]}
            onPress={() => setStatus('won')}
          >
            <Text>Won</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.statusButton, status === 'lost' && styles.activeStatus]}
            onPress={() => setStatus('lost')}
          >
            <Text>Lost</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={saveBet}>
        <Text style={styles.saveButtonText}>Save Bet</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    marginHorizontal: 5,
    borderRadius: 8,
  },
  activeStatus: {
    backgroundColor: '#4CAF50',
  },
  saveButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});