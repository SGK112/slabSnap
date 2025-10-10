import React, { useState, useRef, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { colors } from "../utils/colors";
import * as Haptics from "expo-haptics";

interface VoiceRecorderProps {
  onRecordingComplete: (uri: string, duration: number) => void;
  onCancel: () => void;
}

export function VoiceRecorder({ onRecordingComplete, onCancel }: VoiceRecorderProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [duration, setDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRecording) {
      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Start duration timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        alert("Permission to access microphone is required!");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();

    if (uri) {
      onRecordingComplete(uri, duration);
    }

    setRecording(null);
    setDuration(0);
  };

  const cancelRecording = async () => {
    if (recording) {
      await recording.stopAndUnloadAsync();
      setRecording(null);
    }
    setIsRecording(false);
    setDuration(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCancel();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    startRecording();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Cancel Button */}
        <Pressable onPress={cancelRecording} style={styles.cancelButton}>
          <Ionicons name="close" size={24} color={colors.text.tertiary} />
        </Pressable>

        {/* Recording Indicator */}
        <View style={styles.recordingInfo}>
          <Animated.View
            style={[
              styles.recordingDot,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
          <Text style={styles.recordingText}>Recording</Text>
          <Text style={styles.duration}>{formatTime(duration)}</Text>
        </View>

        {/* Send Button */}
        <Pressable onPress={stopRecording} style={styles.sendButton}>
          <Ionicons name="send" size={24} color="white" />
        </Pressable>
      </View>

      {/* Waveform Visualization Placeholder */}
      <View style={styles.waveform}>
        {[...Array(40)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.waveformBar,
              {
                height: Math.random() * 30 + 10,
                opacity: i < (duration % 40) ? 1 : 0.3,
              },
            ]}
          />
        ))}
      </View>

      <Text style={styles.hint}>Slide to cancel • Tap to send</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cancelButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  recordingInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#ef4444",
  },
  recordingText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text.primary,
  },
  duration: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.text.tertiary,
    fontVariant: ["tabular-nums"],
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[600],
    alignItems: "center",
    justifyContent: "center",
  },
  waveform: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    gap: 2,
    marginBottom: 8,
  },
  waveformBar: {
    width: 3,
    backgroundColor: colors.primary[600],
    borderRadius: 2,
  },
  hint: {
    fontSize: 12,
    color: colors.text.quaternary,
    textAlign: "center",
  },
});
