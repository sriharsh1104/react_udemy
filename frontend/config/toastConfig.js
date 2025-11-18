import { View, Text, Platform } from 'react-native';

/**
 * Toast configuration for react-native-toast-message
 */
export const toastConfig = {
  success: (props) => (
    <View style={{
      backgroundColor: '#34C759',
      padding: 12,
      borderRadius: 8,
      marginHorizontal: 16,
      marginTop: 8,
      alignSelf: 'flex-end',
      maxWidth: '80%',
      ...(Platform.OS === 'web' ? {
        boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
      } : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      }),
    }}>
      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>
        {props.text1}
      </Text>
      {props.text2 && (
        <Text style={{ color: '#fff', fontSize: 12, marginTop: 4 }}>
          {typeof props.text2 === 'string' 
            ? props.text2 
            : (props.text2?.message || props.text2?.text || String(props.text2 || ''))}
        </Text>
      )}
    </View>
  ),
  error: (props) => (
    <View style={{
      backgroundColor: '#FF3B30',
      padding: 12,
      borderRadius: 8,
      marginHorizontal: 16,
      marginTop: 8,
      alignSelf: 'flex-end',
      maxWidth: '80%',
      ...(Platform.OS === 'web' ? {
        boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
      } : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      }),
    }}>
      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>
        {props.text1}
      </Text>
      {props.text2 && (
        <Text style={{ color: '#fff', fontSize: 12, marginTop: 4 }}>
          {typeof props.text2 === 'string' 
            ? props.text2 
            : (props.text2?.message || props.text2?.text || String(props.text2 || ''))}
        </Text>
      )}
    </View>
  ),
};

