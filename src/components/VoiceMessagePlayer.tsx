import React, { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { colors } from "../utils/colors";
import { VoiceMessage } from "../types/messaging";

interface VoiceMessagePlayerProps {
  voiceMessage: VoiceMessage;
  isOwnMessage: boolean;
}

export function VoiceMessagePlayer({ voiceMessage, isOwnMessage }: VoiceMessagePlayerProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(voiceMessage.duration);
  const [isSpeakerMode, setIsSpeakerMode] = useState(true); // Default to speaker

  useEffect(() => {
    // Set audio mode to play through speaker by default
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false, // Play through speaker
    });

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const toggleSpeakerMode = async () => {
    const newMode = !isSpeakerMode;
    setIsSpeakerMode(newMode);
    
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: !newMode, // True = earpiece, False = speaker
    });
  };

  const playSound = async () => {
    try {
      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          if (isPlaying) {
            // Pause
            await sound.pauseAsync();
            setIsPlaying(false);
          } else if (status.didJustFinish || status.positionMillis === status.durationMillis) {
            // Replay from beginning
            await sound.setPositionAsync(0);
            await sound.playAsync();
            setIsPlaying(true);
          } else {
            // Resume
            await sound.playAsync();
            setIsPlaying(true);
          }
        }
      } else {
        // Create new sound
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: voiceMessage.uri },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        );
        setSound(newSound);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis / 1000);
      setDuration(status.durationMillis ? status.durationMillis / 1000 : voiceMessage.duration);

      if (status.didJustFinish) {
        setIsPlaying(false);
        // Keep position at end so we can detect replay need
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <View style={[styles.container, isOwnMessage ? styles.ownMessage : styles.otherMessage]}>
      {/* Play Button */}
      <Pressable onPress={playSound} style={styles.playButton}>
        <Ionicons
          name={isPlaying ? "pause" : "play"}
          size={20}
          color={isOwnMessage ? "white" : colors.primary[600]}
        />
      </Pressable>

      {/* Waveform and Progress */}
      <View style={styles.waveformContainer}>
        <View style={styles.waveform}>
          {voiceMessage.waveform?.slice(0, 25).map((amplitude, index) => (
            <View
              key={index}
              style={[
                styles.waveformBar,
                {
                  height: Math.max(amplitude * 20, 4),
                  backgroundColor:
                    index < (progress / 100) * 25
                      ? isOwnMessage
                        ? "rgba(255, 255, 255, 0.9)"
                        : colors.primary[600]
                      : isOwnMessage
                      ? "rgba(255, 255, 255, 0.3)"
                      : colors.neutral[300],
                },
              ]}
            />
          )) ||
            // Fallback waveform if none provided
            [...Array(25)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.waveformBar,
                  {
                    height: Math.random() * 16 + 4,
                    backgroundColor:
                      i < (progress / 100) * 25
                        ? isOwnMessage
                          ? "rgba(255, 255, 255, 0.9)"
                          : colors.primary[600]
                        : isOwnMessage
                        ? "rgba(255, 255, 255, 0.3)"
                        : colors.neutral[300],
                  },
                ]}
              />
            ))}
        </View>

        {/* Duration */}
        <Text style={[styles.duration, isOwnMessage && styles.durationOwn]}>
          {isPlaying ? formatTime(position) : formatTime(duration)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
    gap: 10,
    minWidth: 200,
    maxWidth: 280,
  },
  ownMessage: {
    backgroundColor: colors.primary[600],
  },
  otherMessage: {
    backgroundColor: colors.background.secondary,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  waveformContainer: {
    flex: 1,
    gap: 6,
  },
  waveform: {
    flexDirection: "row",
    alignItems: "center",
    height: 20,
    gap: 2,
  },
  waveformBar: {
    flex: 1,
    borderRadius: 2,
  },
  duration: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.text.tertiary,
    fontVariant: ["tabular-nums"],
  },
  durationOwn: {
    color: "rgba(255, 255, 255, 0.8)",
  },
});
