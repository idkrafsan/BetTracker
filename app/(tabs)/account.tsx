import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    Alert, KeyboardAvoidingView, Platform,
    ScrollView,
    StyleSheet,
    Text, TextInput, TouchableOpacity,
    View
} from 'react-native';
import { db } from '../../utils/firebase';

export default function Account() {
  const [username, setUsername] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [balance, setBalance] = useState(0);
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [totalWithdrawals, setTotalWithdrawals] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAccountData();
  }, []);

  const loadAccountData = async () => {
    try {
      const accountDoc = await getDoc(doc(db, 'account', 'main'));
      if (accountDoc.exists()) {
        const data = accountDoc.data();
        setUsername(data.username || '');
        setBalance(data.balance || 0);
        setTotalDeposits(data.totalDeposits || 0);
        setTotalWithdrawals(data.totalWithdrawals || 0);
      }
    } catch (error) {
      console.error('Error loading account:', error);
    }
  };

  const saveUsername = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    setLoading(true);
    try {
      await setDoc(doc(db, 'account', 'main'), {
        username: username.trim(),
        balance,
        totalDeposits,
        totalWithdrawals,
        updatedAt: new Date()
      }, { merge: true });
      Alert.alert('Success', 'Username saved!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save username');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const amount = parseFloat(depositAmount);
    const newBalance = balance + amount;
    const newTotalDeposits = totalDeposits + amount;

    setLoading(true);
    try {
      await setDoc(doc(db, 'account', 'main'), {
        username,
        balance: newBalance,
        totalDeposits: newTotalDeposits,
        totalWithdrawals,
        lastTransaction: {
          type: 'deposit',
          amount,
          date: new Date()
        },
        updatedAt: new Date()
      }, { merge: true });

      setBalance(newBalance);
      setTotalDeposits(newTotalDeposits);
      setDepositAmount('');
      Alert.alert('Success', `€${amount} deposited successfully!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to process deposit');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    
    if (amount > balance) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    const newBalance = balance - amount;
    const newTotalWithdrawals = totalWithdrawals + amount;

    setLoading(true);
    try {
      await setDoc(doc(db, 'account', 'main'), {
        username,
        balance: newBalance,
        totalDeposits,
        totalWithdrawals: newTotalWithdrawals,
        lastTransaction: {
          type: 'withdrawal',
          amount,
          date: new Date()
        },
        updatedAt: new Date()
      }, { merge: true });

      setBalance(newBalance);
      setTotalWithdrawals(newTotalWithdrawals);
      setWithdrawAmount('');
      Alert.alert('Success', `€${amount} withdrawn successfully!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to process withdrawal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Account</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>€{balance.toFixed(2)}</Text>
          <View style={styles.balanceStats}>
            <View style={styles.balanceStat}>
              <Ionicons name="arrow-down-circle" size={20} color="#4CAF50" />
              <Text style={styles.balanceStatLabel}>Deposits</Text>
              <Text style={styles.balanceStatValue}>€{totalDeposits.toFixed(2)}</Text>
            </View>
            <View style={styles.balanceStat}>
              <Ionicons name="arrow-up-circle" size={20} color="#f44336" />
              <Text style={styles.balanceStatLabel}>Withdrawals</Text>
              <Text style={styles.balanceStatValue}>€{totalWithdrawals.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Username Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter username"
                placeholderTextColor="#666"
              />
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={saveUsername}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Deposit Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deposit Funds</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount (€)</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={depositAmount}
                onChangeText={setDepositAmount}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor="#666"
              />
              <TouchableOpacity 
                style={[styles.actionButton, styles.depositButton]}
                onPress={handleDeposit}
                disabled={loading}
              >
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Withdraw Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Withdraw Funds</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount (€)</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor="#666"
              />
              <TouchableOpacity 
                style={[styles.actionButton, styles.withdrawButton]}
                onPress={handleWithdraw}
                disabled={loading}
              >
                <Ionicons name="remove-circle" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Withdraw</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Transaction History Note */}
        <View style={styles.noteCard}>
          <Ionicons name="information-circle" size={24} color="#2196F3" />
          <Text style={styles.noteText}>
            Your balance updates automatically when you add winning/losing bets
          </Text>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  balanceCard: {
    backgroundColor: '#2196F3',
    margin: 20,
    padding: 25,
    borderRadius: 20,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  balanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 15,
  },
  balanceStat: {
    alignItems: 'center',
  },
  balanceStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  balanceStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 2,
  },
  section: {
    backgroundColor: '#1E1E1E',
    margin: 20,
    marginTop: 0,
    marginBottom: 20,
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2A2A2A',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    fontSize: 16,
    color: '#fff',
    marginRight: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
    gap: 5,
  },
  depositButton: {
    backgroundColor: '#4CAF50',
  },
  withdrawButton: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    margin: 20,
    marginTop: 0,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2196F3',
    gap: 10,
  },
  noteText: {
    flex: 1,
    color: '#888',
    fontSize: 14,
  },
});