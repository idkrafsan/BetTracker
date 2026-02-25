import React, { useState, useEffect } from 'react';
import { 
  View, Text, ScrollView, StyleSheet, 
  TouchableOpacity, RefreshControl 
} from 'react-native';
import { db } from '../firebase/config';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

export default function DashboardScreen({ navigation }) {
  const [bets, setBets] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalBets: 0,
    wonBets: 0,
    lostBets: 0,
    totalStake: 0,
    totalProfit: 0,
    roi: 0,
    successRate: 0
  });

  useEffect(() => {
    // Listen to real-time updates from Firebase
    const q = query(collection(db, 'bets'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const betsData = [];
      querySnapshot.forEach((doc) => {
        betsData.push({ id: doc.id, ...doc.data() });
      });
      setBets(betsData);
      calculateStats(betsData);
    });

    return () => unsubscribe();
  }, []);

  const calculateStats = (betsData) => {
    const total = betsData.length;
    const won = betsData.filter(b => b.status === 'won').length;
    const lost = betsData.filter(b => b.status === 'lost').length;
    const totalStake = betsData.reduce((sum, b) => sum + (b.stake || 0), 0);
    const totalProfit = betsData.reduce((sum, b) => {
      if (b.status === 'won') {
        return sum + (b.stake * (b.odds - 1));
      } else if (b.status === 'lost') {
        return sum - b.stake;
      }
      return sum;
    }, 0);

    setStats({
      totalBets: total,
      wonBets: won,
      lostBets: lost,
      totalStake,
      totalProfit,
      successRate: total > 0 ? (won / total * 100).toFixed(2) : 0,
      roi: totalStake > 0 ? ((totalProfit / totalStake) * 100).toFixed(2) : 0
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Data will auto-refresh via onSnapshot
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Prepare chart data
  const chartData = {
    labels: bets.slice(-7).map((_, i) => `Day ${i+1}`),
    datasets: [{
      data: bets.slice(-7).map(b => b.stake * (b.odds - 1) || 0)
    }]
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header Stats */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Betting Dashboard</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AddBet')}
        >
          <Text style={styles.addButtonText}>+ Add Bet</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Stats Cards - Like your screenshot */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalBets}</Text>
          <Text style={styles.statLabel}>Total Bets</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>€{stats.totalProfit.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Profit</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.roi}%</Text>
          <Text style={styles.statLabel}>ROI</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.successRate}%</Text>
          <Text style={styles.statLabel}>Success</Text>
        </View>
      </View>

      {/* Chart - Like your screenshot */}
      {bets.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Profit Progression</Text>
          <LineChart
            data={chartData}
            width={Dimensions.get('window').width - 40}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
              style: {
                borderRadius: 16
              }
            }}
            bezier
            style={styles.chart}
          />
        </View>
      )}

      {/* Detailed Stats - Like your first screenshot */}
      <View style={styles.detailedStats}>
        <Text style={styles.sectionTitle}>Statistics</Text>
        
        <View style={styles.statRow}>
          <Text style={styles.statRowLabel}>Winning Bets</Text>
          <Text style={styles.statRowValue}>{stats.wonBets}</Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statRowLabel}>Losing Bets</Text>
          <Text style={styles.statRowValue}>{stats.lostBets}</Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statRowLabel}>Total Stake</Text>
          <Text style={styles.statRowValue}>€{stats.totalStake.toFixed(2)}</Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statRowLabel}>Average Stake</Text>
          <Text style={styles.statRowValue}>
            €{stats.totalBets > 0 ? (stats.totalStake / stats.totalBets).toFixed(2) : 0}
          </Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statRowLabel}>Average Odds</Text>
          <Text style={styles.statRowValue}>
            {bets.length > 0 
              ? (bets.reduce((sum, b) => sum + b.odds, 0) / bets.length).toFixed(3)
              : 0}
          </Text>
        </View>
      </View>

      {/* Recent Bets */}
      <View style={styles.recentBets}>
        <Text style={styles.sectionTitle}>Recent Bets</Text>
        {bets.slice(-5).reverse().map(bet => (
          <View key={bet.id} style={styles.betItem}>
            <View style={styles.betInfo}>
              <Text style={styles.betMatch}>{bet.match}</Text>
              <Text style={styles.betDate}>
                {new Date(bet.date).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.betDetails}>
              <Text style={styles.betStake}>€{bet.stake}</Text>
              <Text style={styles.betOdds}>@{bet.odds}</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: 
                  bet.status === 'won' ? '#4CAF50' : 
                  bet.status === 'lost' ? '#f44336' : '#ff9800'
                }
              ]}>
                <Text style={styles.statusText}>{bet.status}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    margin: '1%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  chartContainer: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  detailedStats: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statRowLabel: {
    fontSize: 16,
    color: '#666',
  },
  statRowValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  recentBets: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  betItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  betInfo: {
    flex: 1,
  },
  betMatch: {
    fontSize: 16,
    fontWeight: '500',
  },
  betDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  betDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  betStake: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
  },
  betOdds: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
});