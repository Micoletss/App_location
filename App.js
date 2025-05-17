import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Button, Card, Title, Paragraph } from 'react-native-paper';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE_URL = 'https://rdanarcon.site/admin/';

const App = () => {
  const [deviceId, setDeviceId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [lastLocation, setLastLocation] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [newDeviceId, setNewDeviceId] = useState('');

  // Load saved Device ID on app start
  useEffect(() => {
    const loadDeviceId = async () => {
      try {
        const savedDeviceId = await AsyncStorage.getItem('@device_id');
        if (savedDeviceId) {
          setDeviceId(savedDeviceId);
          setNewDeviceId(savedDeviceId);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load device ID.');
      } finally {
        setIsLoading(false);
      }
    };
    loadDeviceId();
  }, []);

  // Send location to the server
  const sendLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required.');
        setIsTracking(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      setLastLocation({ latitude, longitude });
      setLastUpdate(new Date().toLocaleTimeString());

      const response = await axios.post(`${API_BASE_URL}admin_updateGps.php`, {
        latitude,
        longitude,
        device_number: deviceId,
      });

      console.log('Location sent:', response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to send location.');
    }
  };

  // Start/Stop tracking
  useEffect(() => {
    let interval = null;

    if (isTracking) {
      sendLocation(); // Send immediately
      interval = setInterval(sendLocation, 60000); // Every 60 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking, deviceId]);

  const handleStartTracking = () => {
    if (!deviceId) {
      Alert.alert('Error', 'Please enter a Device ID.');
      return;
    }
    setIsTracking(true);
  };

  const handleStopTracking = () => {
    setIsTracking(false);
  };

  const handleUpdateDevice = async () => {
    if (!newDeviceId) {
      Alert.alert('Error', 'Device ID cannot be empty');
      return;
    }

    try {
      // Save to AsyncStorage
      await AsyncStorage.setItem('@device_id', newDeviceId);
      setDeviceId(newDeviceId);
      Alert.alert('Success', 'Device ID updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update device ID');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Location Tracker</Title>

          {!deviceId ? (
            <>
              <Paragraph>Enter Device ID:</Paragraph>
              <TextInput
                style={styles.input}
                value={deviceId}
                onChangeText={setDeviceId}
                placeholder="e.g., 12345"
                keyboardType="numeric"
              />
              <Button mode="contained" onPress={() => handleUpdateDevice()}>
                Save Device ID
              </Button>

              

            </>
          ) : (
            <>
              <Paragraph>Device ID: {deviceId}</Paragraph>

              {lastLocation && (
                <Card style={styles.locationCard}>
                  <Card.Content>
                    <Title>Last Location Sent</Title>
                    <Paragraph>Latitude: {lastLocation.latitude.toFixed(6)}</Paragraph>
                    <Paragraph>Longitude: {lastLocation.longitude.toFixed(6)}</Paragraph>
                    {lastUpdate && <Paragraph>Last Update: {lastUpdate}</Paragraph>}
                  </Card.Content>
                </Card>
              )}

              {isTracking ? (
                <Button mode="contained" color="red" onPress={handleStopTracking}>
                  Stop Tracking
                </Button>
              ) : (
                <Button mode="contained" onPress={handleStartTracking}>
                  Start Tracking
                </Button>
              )}
            </>
          )}
        </Card.Content>
      </Card>

      {deviceId && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Update Device ID</Title>
            <TextInput
              style={styles.input}
              value={newDeviceId}
              onChangeText={setNewDeviceId}
              placeholder="Enter new Device ID"
              keyboardType="numeric"
            />
            <Button 
              mode="contained" 
              onPress={handleUpdateDevice}
              style={styles.updateButton}
            >
              Update Device ID
            </Button>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#f0f0f0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
  },
  locationCard: {
    marginVertical: 16,
    backgroundColor: '#e3f2fd',
  },
  updateButton: {
    marginTop: 8,
  },
});

export default App;