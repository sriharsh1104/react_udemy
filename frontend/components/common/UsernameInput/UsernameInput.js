import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Platform, Alert, KeyboardAvoidingView } from 'react-native';
import styles from './UsernameInput.styles';

const UsernameInput = ({ onJoin }) => {
  const [username, setUsername] = React.useState('');

  const handleJoin = () => {
    if (username.trim() && username.trim().length >= 2) {
      onJoin(username.trim());
    } else {
      Alert.alert('Invalid Username', 'Please enter a username (at least 2 characters)');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.icon}>
            <Text style={styles.iconText}>💬</Text>
          </View>
        </View>
        
        {/* <Text style={styles.title}>Welcome to Chat</Text> */}
        <Text style={styles.subtitle}>Enter your name to start chatting</Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor="#B0C4DE"
            value={username}
            onChangeText={setUsername}
            onSubmitEditing={handleJoin}
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={20}
            returnKeyType="go"
          />
        </View>
        
        <TouchableOpacity 
          style={[styles.button, !username.trim() && styles.buttonDisabled]} 
          onPress={handleJoin}
          disabled={!username.trim()}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default UsernameInput;

