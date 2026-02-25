import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text, TextInput, TouchableOpacity,
    View
} from 'react-native';
import { db } from '../../utils/firebase'; // Note: path changed from '../../utils/firebase'

export default function BetDetails() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [match, setMatch] = useState('');
  const [stake, setStake] = useState('');
  const [odds, setOdds] = useState('');
  const [status, setStatus] = useState('pending');

  useEffect(() => {
    fetchBet();
  }, [id]);

  const fetchBet = async () => {
    try {
      const betDoc = await getDoc(doc(db, 'bets', id));
      if (betDoc.exists()) {
        const betData = betDoc.data();
        setMatch(betData.match || '');
        setStake(betData.stake?.toString() || '');
        setOdds(betData.odds?.toString() || '');
        setStatus(betData.status || 'pending');
      } else {
        Alert.alert(
          'Bet Not Found', 
          'This bet no longer exists.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
      setLoading(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to load bet');
      router.back();
    }
  };

const updateBet = async () => {
  if (!match || !stake || !odds) {
    Alert.alert('Error', 'Please fill all fields');
    return;
  }

  if (parseFloat(stake) <= 0 || parseFloat(odds) <= 1) {
    Alert.alert('Error', 'Stake must be > 0 and odds must be > 1');
    return;
  }

  setSaving(true);
  try {
    // Get the original bet to calculate balance change
    const originalBetDoc = await getDoc(doc(db, 'bets', id));
    const originalBet = originalBetDoc.data();
    
    // Update the bet
    await updateDoc(doc(db, 'bets', id), {
      match,
      stake: parseFloat(stake),
      odds: parseFloat(odds),
      status,
      updatedAt: new Date()
    });

    // Update account balance based on status change
    const accountRef = doc(db, 'account', 'main');
    const accountDoc = await getDoc(accountRef);
    
    if (accountDoc.exists()) {
      let balanceChange = 0;
      const accountData = accountDoc.data();
      let newBalance = accountData.balance || 0;
      
      // Calculate the difference between old and new bet outcome
      const oldProfit = originalBet.status === 'won' ? originalBet.stake * (originalBet.odds - 1) :
                       originalBet.status === 'lost' ? -originalBet.stake : 0;
      
      const newProfit = status === 'won' ? parseFloat(stake) * (parseFloat(odds) - 1) :
                       status === 'lost' ? -parseFloat(stake) : 0;
      
      balanceChange = newProfit - oldProfit;
      newBalance += balanceChange;
      
      await updateDoc(accountRef, {
        balance: newBalance,
        updatedAt: new Date()
      });
    }
    
    Alert.alert(
      'Success', 
      'Bet updated successfully!',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  } catch (error) {
    Alert.alert('Error', 'Failed to update bet');
    console.error(error);
  } finally {
    setSaving(false);
  }
};

  const deleteBet = () => {
    Alert.alert(
      'Delete Bet',
      'Are you sure you want to delete this bet?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'bets', id));
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete bet');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Bet</Text>
        <TouchableOpacity onPress={deleteBet} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

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

        <View style={styles.inputGroup}>
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

        <View style={styles.inputGroup}>
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

        {/* Preview Card */}
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

        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.savingButton]} 
          onPress={updateBet}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Update Bet'}
          </Text>
        </TouchableOpacity>
      </View>
      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
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
  deleteButton: {
    padding: 5,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
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
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  previewTitle: {
    color: '#888',
    fontSize: 16,
    marginBottom: 5,
  },
  previewAmount: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  previewProfit: {
    fontSize: 16,
    marginTop: 5,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#2196F3',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  savingButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});