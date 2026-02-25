import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { collection, doc, onSnapshot, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  RefreshControl,
  ScrollView, StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { db } from '../../utils/firebase';

export default function Dashboard() {
  const [bets, setBets] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('1m');
  const [accountBalance, setAccountBalance] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [stats, setStats] = useState({
    totalBets: 0,
    wonBets: 0,
    lostBets: 0,
    pendingBets: 0,
    totalStake: 0,
    roi: 0,
    successRate: 0,
    avgOdds: 0,
    biggestWin: 0,
    biggestLoss: 0
  });

useEffect(() => {
  // Load account balance with real-time updates
  const unsubscribeAccount = onSnapshot(doc(db, 'account', 'main'), (doc) => {
    if (doc.exists()) {
      setAccountBalance(doc.data().balance || 0);
    }
  });

  // Listen to bets
  const q = query(collection(db, 'bets'));
  const unsubscribeBets = onSnapshot(q, (querySnapshot) => {
    const betsData = [];
    querySnapshot.forEach((doc) => {
      betsData.push({ id: doc.id, ...doc.data() });
    });
    setBets(betsData);
    calculateStats(betsData);
  });

  return () => {
    unsubscribeAccount();
    unsubscribeBets();
  };
}, []);

  const calculateStats = (betsData) => {
    const activeBets = betsData.filter(b => b.status !== 'deleted');
    const total = activeBets.length;
    const won = activeBets.filter(b => b.status === 'won').length;
    const lost = activeBets.filter(b => b.status === 'lost').length;
    const pending = activeBets.filter(b => b.status === 'pending').length;
    const totalStake = activeBets.reduce((sum, b) => sum + (b.stake || 0), 0);
    
    let profit = 0;
    let biggestWin = 0;
    let biggestLoss = 0;
    
    activeBets.forEach(b => {
      if (b.status === 'won') {
        const betProfit = b.stake * (b.odds - 1);
        profit += betProfit;
        if (betProfit > biggestWin) biggestWin = betProfit;
      } else if (b.status === 'lost') {
        const betLoss = -b.stake;
        profit += betLoss;
        if (betLoss < biggestLoss) biggestLoss = betLoss;
      }
    });

    setTotalProfit(profit);

    const avgOdds = activeBets.length > 0 
      ? activeBets.reduce((sum, b) => sum + b.odds, 0) / activeBets.length 
      : 0;

    setStats({
      totalBets: total,
      wonBets: won,
      lostBets: lost,
      pendingBets: pending,
      totalStake,
      successRate: total > 0 ? ((won / total) * 100).toFixed(1) : 0,
      roi: totalStake > 0 ? ((profit / totalStake) * 100).toFixed(1) : 0,
      avgOdds: avgOdds.toFixed(2),
      biggestWin: biggestWin.toFixed(2),
      biggestLoss: Math.abs(biggestLoss).toFixed(2)
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getFilteredBets = () => {
    const now = new Date();
    return bets.filter(bet => {
      const betDate = new Date(bet.date);
      switch(selectedPeriod) {
        case '1d':
          return betDate.toDateString() === now.toDateString();
        case '1w':
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return betDate >= weekAgo;
        case '1m':
          const monthAgo = new Date(now);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return betDate >= monthAgo;
        default:
          return true;
      }
    });
  };

  const getChartData = () => {
    const filteredBets = getFilteredBets();
    
    // Get last 7 days
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      last7Days.push(date);
    }

    // Calculate profit for each day
    const dailyProfits = last7Days.map(day => {
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const daysBets = filteredBets.filter(bet => {
        const betDate = new Date(bet.date);
        return betDate >= day && betDate < nextDay;
      });

      return daysBets.reduce((sum, bet) => {
        if (bet.status === 'won') {
          return sum + (bet.stake * (bet.odds - 1));
        } else if (bet.status === 'lost') {
          return sum - bet.stake;
        }
        return sum;
      }, 0);
    });

    // Format labels (Mon, Tue, etc.)
    const labels = last7Days.map(date => 
      date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3)
    );

    return {
      labels,
      datasets: [{
        data: dailyProfits.length ? dailyProfits : [0, 0, 0, 0, 0, 0, 0],
        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
        strokeWidth: 2
      }],
      legend: ['Daily Profit']
    };
  };

  const navigateToBetDetails = (betId) => {
    router.push(`/bet/${betId}`);
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
      }
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back 👋</Text>
          <Text style={styles.headerTitle}>Grim BetStat</Text>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/account')}>
          <Ionicons name="person-circle-outline" size={40} color="#2196F3" />
        </TouchableOpacity>
      </View>

      {/* Capital Card */}
      <View style={styles.capitalCard}>
        <Text style={styles.capitalLabel}>Current Balance</Text>
        <Text style={styles.capitalAmount}>৳{accountBalance.toFixed(2)}</Text>
        <View style={styles.capitalChange}>
          <Ionicons 
            name={totalProfit >= 0 ? "trending-up" : "trending-down"} 
            size={20} 
            color={totalProfit >= 0 ? '#4CAF50' : '#f44336'} 
          />
          <Text style={[styles.changeText, { color: totalProfit >= 0 ? '#4CAF50' : '#f44336' }]}>
            Total P/L: {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)}€
          </Text>
        </View>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {['1d', '1w', '1m', 'All'].map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period.toLowerCase() && styles.periodButtonActive
            ]}
            onPress={() => setSelectedPeriod(period.toLowerCase())}
          >
            <Text style={[
              styles.periodText,
              selectedPeriod === period.toLowerCase() && styles.periodTextActive
            ]}>{period}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="receipt-outline" size={24} color="#2196F3" />
          <Text style={styles.statValue}>{stats.totalBets}</Text>
          <Text style={styles.statLabel}>Total Bets</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle-outline" size={24} color="#4CAF50" />
          <Text style={styles.statValue}>{stats.wonBets}</Text>
          <Text style={styles.statLabel}>Won</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="close-circle-outline" size={24} color="#f44336" />
          <Text style={styles.statValue}>{stats.lostBets}</Text>
          <Text style={styles.statLabel}>Lost</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="time-outline" size={24} color="#FF9800" />
          <Text style={styles.statValue}>{stats.pendingBets}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Profit Overview</Text>
          <Text style={styles.chartSubtitle}>Last 7 days</Text>
        </View>
        <LineChart
          data={getChartData()}
          width={Dimensions.get('window').width - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#1E1E1E',
            backgroundGradientFrom: '#1E1E1E',
            backgroundGradientTo: '#1E1E1E',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: '#2196F3'
            }
          }}
          bezier
          style={styles.chart}
          formatYLabel={(value) => `€${value}`}
        />
      </View>

      {/* Performance Metrics */}
      <View style={styles.metricsContainer}>
        <Text style={styles.sectionTitle}>Performance Metrics</Text>
        
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Success Rate</Text>
            <Text style={styles.metricValue}>{stats.successRate}%</Text>
            <View style={[styles.progressBar, { width: `${stats.successRate}%`, backgroundColor: '#4CAF50' }]} />
          </View>
          
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>ROI</Text>
            <Text style={[styles.metricValue, { color: totalProfit >= 0 ? '#4CAF50' : '#f44336' }]}>
              {stats.roi}%
            </Text>
            <View style={[styles.progressBar, { 
              width: `${Math.min(100, Math.abs(stats.roi))}%`, 
              backgroundColor: totalProfit >= 0 ? '#4CAF50' : '#f44336' 
            }]} />
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statItemLabel}>Avg Odds</Text>
            <Text style={styles.statItemValue}>{stats.avgOdds}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statItemLabel}>Total Stake</Text>
            <Text style={styles.statItemValue}>€{stats.totalStake.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statItemLabel}>Biggest Win</Text>
            <Text style={[styles.statItemValue, { color: '#4CAF50' }]}>+€{stats.biggestWin}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statItemLabel}>Biggest Loss</Text>
            <Text style={[styles.statItemValue, { color: '#f44336' }]}>-€{stats.biggestLoss}</Text>
          </View>
        </View>
      </View>

{/* Recent Bets */}
<View style={styles.recentBets}>
  <View style={styles.recentBetsHeader}>
    <Text style={styles.sectionTitle}>Recent Bets</Text>
    <TouchableOpacity onPress={() => router.push('/add')}>
      <Ionicons name="add-circle" size={24} color="#2196F3" />
    </TouchableOpacity>
  </View>
  
  {/* Sort bets by date - newest first */}
  {bets
    .filter(b => b.status !== 'deleted')
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)
    .map(bet => (
      <TouchableOpacity 
        key={bet.id} 
        style={styles.betItem}
        onPress={() => navigateToBetDetails(bet.id)}
      >
        <View style={styles.betInfo}>
          <Text style={styles.betMatch}>{bet.match}</Text>
          <Text style={styles.betDate}>
            {new Date(bet.date).toLocaleDateString()} {new Date(bet.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <View style={styles.betDetails}>
          <Text style={styles.betStake}>€{bet.stake}</Text>
          <Text style={styles.betOdds}>@{bet.odds}</Text>
          <View style={[
            styles.statusBadge,
            { 
              backgroundColor: 
                bet.status === 'won' ? '#4CAF50' : 
                bet.status === 'lost' ? '#f44336' : '#FF9800'
            }
          ]}>
            <Text style={styles.statusText}>
              {bet.status === 'won' ? '✅' : bet.status === 'lost' ? '❌' : '⏳'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    ))}
  
  {bets.filter(b => b.status !== 'deleted').length === 0 && (
    <View style={styles.emptyState}>
      <Ionicons name="football-outline" size={60} color="#333" />
      <Text style={styles.emptyStateText}>No bets yet</Text>
      <Text style={styles.emptyStateSubtext}>Tap the + button to add your first bet</Text>
    </View>
  )}
</View>

      {/* Extra padding at bottom for tab bar */}
<View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  contentContainer: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#1E1E1E',
  },
  greeting: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileButton: {
    padding: 5,
  },
  capitalCard: {
    backgroundColor: '#1E1E1E',
    margin: 20,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  capitalLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  capitalAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  capitalChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 16,
    marginLeft: 5,
    fontWeight: '600',
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  periodButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#1E1E1E',
  },
  periodButtonActive: {
    backgroundColor: '#2196F3',
  },
  periodText: {
    color: '#888',
    fontWeight: '600',
  },
  periodTextActive: {
    color: '#fff',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#1E1E1E',
    margin: '1%',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
  chartContainer: {
    backgroundColor: '#1E1E1E',
    margin: 20,
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#888',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  metricsContainer: {
    backgroundColor: '#1E1E1E',
    margin: 20,
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
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricItem: {
    flex: 1,
    marginHorizontal: 5,
  },
  metricLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 5,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  statItemLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 5,
  },
  statItemValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  recentBets: {
    backgroundColor: '#1E1E1E',
    margin: 20,
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  recentBetsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  betItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  betInfo: {
    flex: 1,
  },
  betMatch: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  betDate: {
    fontSize: 12,
    color: '#888',
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
    color: '#fff',
  },
  betOdds: {
    fontSize: 14,
    color: '#888',
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    minWidth: 40,
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
    textAlign: 'center',
  },
});