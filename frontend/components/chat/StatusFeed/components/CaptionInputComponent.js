import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS } from '../../../../constants';
import styles from '../StatusFeed.styles';

const CaptionInputComponent = ({ onPost, onCancel, colors }) => {
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState('');

  return (
    <ScrollView style={styles.captionInputScroll}>
      <View style={styles.captionInputContainer}>
        <Text style={[styles.captionLabel, { color: colors.text }]}>Caption</Text>
        <TextInput
          style={[styles.captionInput, { backgroundColor: colors.inputBackground || colors.surface, color: colors.text, borderColor: colors.divider }]}
          placeholder="Write a caption..."
          placeholderTextColor={colors.textSecondary}
          value={caption}
          onChangeText={setCaption}
          multiline
          maxLength={500}
        />
        <Text style={[styles.captionCharCount, { color: colors.textSecondary }]}>
          {caption.length}/500
        </Text>
      </View>

      <View style={styles.captionInputContainer}>
        <Text style={[styles.captionLabel, { color: colors.text }]}>Tags (comma-separated)</Text>
        <TextInput
          style={[styles.captionInput, { backgroundColor: colors.inputBackground || colors.surface, color: colors.text, borderColor: colors.divider }]}
          placeholder="e.g., nature, photography, travel"
          placeholderTextColor={colors.textSecondary}
          value={tags}
          onChangeText={setTags}
          maxLength={200}
        />
        <Text style={[styles.captionCharCount, { color: colors.textSecondary }]}>
          {tags.length}/200
        </Text>
      </View>

      <View style={styles.captionButtonContainer}>
        <TouchableOpacity
          style={[styles.captionPostButton, { backgroundColor: colors.primary }]}
          onPress={() => onPost(caption, tags)}
        >
          <Text style={[styles.captionPostButtonText, { color: COLORS.white }]}>Post</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default CaptionInputComponent;

