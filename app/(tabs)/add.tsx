import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { addDoc, collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  Alert, ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View
} from 'react-native';
import { db } from '../../utils/firebase';

export default function AddBet() {
  const [match, setMatch] = useState('');
  const [stake, setStake] = useState('');
  const [odds, setOdds] = useState('');
  const [status, setStatus] = useState('pending');

  const saveBet = async () => {
    if (!match || !stake || !odds) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (parseFloat(stake) <= 0 || parseFloat(odds) <= 1) {
      Alert.alert('Error', 'Stake must be > 0 and odds must be > 1');
      return;
    }

    try {
      await addDoc(collection(db, 'bets'), {
        match,
        stake: parseFloat(stake),
        odds: parseFloat(odds),
        status,
        date: new Date().toISOString(),
        createdAt: new Date()
      });

      if (status !== 'pending') {
        const accountRef = doc(db, 'account', 'main');
        const accountDoc = await getDoc(accountRef);
        
        if (accountDoc.exists()) {
          const accountData = accountDoc.data();
          let newBalance = accountData.balance || 0;
          
          const profitLoss = status === 'won' ? 
            parseFloat(stake) * (parseFloat(odds) - 1) : 
            -parseFloat(stake);
          
          newBalance += profitLoss;
          
          await updateDoc(accountRef, {
            balance: newBalance,
            updatedAt: new Date()
          });
        }
      }

      Alert.alert('Success', 'Bet saved successfully!', [
        { text: 'OK', onPress: () => {
          setMatch('');
          setStake('');
          setOdds('');
          setStatus('pending');
          router.push('/');
        }}
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save bet');
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Bet</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Match</Text>
            <TextInput
              style={styles.input}
              value={match}
              onChangeText={setMatch}
              placeholder="e.g., Real Madrid vs Barcelona"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.row2}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Stake (€)</Text>
              <TextInput
                style={styles.input}
                value={stake}
                onChangeText={setStake}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor="#666"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Odds</Text>
              <TextInput
                style={styles.input}
                value={odds}
                onChangeText={setOdds}
                keyboardType="numeric"
                placeholder="2.00"
                placeholderTextColor="#666"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusContainer}>
              <TouchableOpacity 
                style={[
                  styles.statusButton, 
                  status === 'pending' && styles.pendingStatus
                ]}
                onPress={() => setStatus('pending')}
              >
                <Text style={[
                  styles.statusText,
                  status === 'pending' && styles.activeStatusText
                ]}>⏳ Pending</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.statusButton, 
                  status === 'won' && styles.wonStatus
                ]}
                onPress={() => setStatus('won')}
              >
                <Text style={[
                  styles.statusText,
                  status === 'won' && styles.activeStatusText
                ]}>✅ Won</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.statusButton, 
                  status === 'lost' && styles.lostStatus
                ]}
                onPress={() => setStatus('lost')}
              >
                <Text style={[
                  styles.statusText,
                  status === 'lost' && styles.activeStatusText
                ]}>❌ Lost</Text>
              </TouchableOpacity>
            </View>
          </View>

          {stake && odds && (
            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>
                {status === 'won' ? 'You Won!' : 
                 status === 'lost' ? 'You Lost' : 
                 'Potential Returns'}
              </Text>
              <Text style={styles.previewAmount}>
                €{(parseFloat(stake) * parseFloat(odds)).toFixed(2)}
              </Text>
              <Text style={[
                styles.previewProfit,
                { color: status === 'won' ? '#4CAF50' : 
                        status === 'lost' ? '#f44336' : '#fff' }
              ]}>
                {status === 'won' ? 'Profit: ' : 
                 status === 'lost' ? 'Loss: ' : 
                 'Profit: '}
                €{(parseFloat(stake) * (parseFloat(odds) - 1)).toFixed(2)}
              </Text>
            </View>
          )}

          {/* SAVE BUTTON - RIGHT HERE, IN YOUR FACE */}
          <TouchableOpacity style={styles.saveButton} onPress={saveBet}>
            <Text style={styles.saveButtonText}> Save Bet</Text>
          </TouchableOpacity>

          {/* Extra padding at bottom */}
          <View style={{ height: 90 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  backButton: {
    padding: 5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  row2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
    color: '#fff',
  },
  input: {
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    fontSize: 16,
    color: '#fff',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    marginHorizontal: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  pendingStatus: {
    backgroundColor: '#FF9800',
    borderColor: '#FF9800',
  },
  wonStatus: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  lostStatus: {
    backgroundColor: '#f44336',
    borderColor: '#f44336',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  activeStatusText: {
    color: '#fff',
  },
  previewCard: {
    backgroundColor: '#1E1E1E',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#333',
  },
  previewTitle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 5,
  },
  previewAmount: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  previewProfit: {
    fontSize: 16,
    marginTop: 5,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});