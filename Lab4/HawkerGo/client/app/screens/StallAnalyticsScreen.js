import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Card, Icon } from 'react-native-elements';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { API_BASE_URL } from '../constants/api';

const StallAnalyticsScreen = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, token } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchAnalytics = async () => {
      let stallIdToUse = user?.stallId;

      // If the user doesn't have stallId, fetch the stall details of the current owner
      if (!stallIdToUse) {
        try {
          const stallRes = await axios.get(`${API_BASE_URL}/api/stalls/owner/me`, {
            headers: { 'x-auth-token': token },
          });
          if (stallRes.data && stallRes.data.length > 0) {
            stallIdToUse = stallRes.data[0]._id;
          } else {
            setError('No stall associated with your account.');
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error('Error fetching stall details:', err.message);
          setError('Error fetching stall details.');
          setLoading(false);
          return;
        }
      }

      // Fetch analytics using the determined stallId
      try {
        const res = await axios.get(`${API_BASE_URL}/api/stalls/${stallIdToUse}/analytics`, {
          headers: { 'x-auth-token': token },
        });
        setAnalytics(res.data);
      } catch (err) {
        console.error('Error fetching analytics:', err.message);
        setError('Failed to load analytics. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user, token]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e67e22" />
        <Text style={styles.loadingText}>Loading stall analytics...</Text>
      </View>
    );
  }

  if (error || !analytics) {
    return (
      <View style={styles.loadingContainer}>
        <Icon name="warning" color="#e74c3c" size={36} />
        <Text style={[styles.loadingText, { marginTop: 10 }]}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Stall Analytics</Text>

      <Card containerStyle={styles.card}>
        <Icon name="bar-chart" type="font-awesome" color="#e67e22" size={20} />
        <Text style={styles.metricLabel}>Total Visits</Text>
        <Text style={styles.metricValue}>{analytics.totalVisits || 0}</Text>
      </Card>

      <Card containerStyle={styles.card}>
        <Icon name="money" type="font-awesome" color="#27ae60" size={20} />
        <Text style={styles.metricLabel}>Total Revenue</Text>
        <Text style={styles.metricValue}>${(analytics.totalRevenue || 0).toFixed(2)}</Text>
      </Card>

      <Card containerStyle={styles.card}>
        <Icon name="star" color="#f1c40f" />
        <Text style={styles.metricLabel}>Average Rating</Text>
        <Text style={styles.metricValue}>{analytics.rating || 0} ⭐️</Text>
      </Card>

      <Card containerStyle={styles.card}>
        <Icon name="comments" type="font-awesome" color="#2980b9" />
        <Text style={styles.metricLabel}>Total Reviews</Text>
        <Text style={styles.metricValue}>{analytics.reviewCount || 0}</Text>
      </Card>

      <Card containerStyle={styles.card}>
        <Icon name="cutlery" type="font-awesome" color="#9b59b6" />
        <Text style={styles.metricLabel}>Menu Items</Text>
        <Text style={styles.metricValue}>{analytics.menuItemCount || 0}</Text>
      </Card>

      <Card containerStyle={styles.card}>
        <Icon name="calendar" type="font-awesome" color="#34495e" />
        <Text style={styles.metricLabel}>Operating Days</Text>
        <Text style={styles.metricValue}>{analytics.operatingDays || 0} / 7</Text>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#f9f9f9',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 15,
    textAlign: 'center',
  },
  card: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 5,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#7f8c8d',
    textAlign: 'center',
  },
});

export default StallAnalyticsScreen;
