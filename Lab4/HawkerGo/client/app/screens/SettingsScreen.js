import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Card, Button, Input } from 'react-native-elements';
import { updateUserSettings, changePassword } from '../store/slices/authSlice';

const SettingsScreen = () => {
  const dispatch = useDispatch();
  const { user, isLoading, isError, errorMessage } = useSelector((state) => state.auth);

  const [name, setName] = React.useState(user?.name || '');
  const [email, setEmail] = React.useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  const handleSaveProfileSettings = async () => {
    try {
      const updateData = {};
      if (name !== user?.name) updateData.name = name;
      if (email !== user?.email) updateData.email = email;

      await dispatch(updateUserSettings(updateData)).unwrap();

      Alert.alert('Success', 'Profile settings updated successfully.');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update settings');
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }

    try {
      await dispatch(changePassword({
        currentPassword,
        newPassword
      })).unwrap();

      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      Alert.alert('Success', 'Password changed successfully.');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to change password');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card containerStyle={styles.card}>
        <Card.Title>Profile Settings</Card.Title>
        <Card.Divider />

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Name</Text>
          <Input
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <Input
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <Button
          title="Save Profile"
          buttonStyle={styles.saveButton}
          onPress={handleSaveProfileSettings}
          loading={isLoading}
        />
      </Card>

      <Card containerStyle={styles.card}>
        <Card.Title>Change Password</Card.Title>
        <Card.Divider />

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Current Password</Text>
          <Input
            placeholder="Enter current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>New Password</Text>
          <Input
            placeholder="Enter new password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm New Password</Text>
          <Input
            placeholder="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>

        <Button
          title="Change Password"
          buttonStyle={styles.changePasswordButton}
          onPress={handleChangePassword}
          loading={isLoading}
        />
      </Card>

      {isError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8'
  },
  card: {
    borderRadius: 10,
    marginHorizontal: 10,
    marginVertical: 10
  },
  inputContainer: {
    marginBottom: 15
  },
  label: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5
  },
  saveButton: {
    backgroundColor: '#e67e22',
    borderRadius: 8,
    marginTop: 10
  },
  changePasswordButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    marginTop: 10
  },
  errorContainer: {
    backgroundColor: '#f8d7da',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 10,
    marginTop: 10
  },
  errorText: {
    color: '#721c24',
    textAlign: 'center'
  }
});

export default SettingsScreen;