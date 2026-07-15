import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from "react-native";
import { Image } from "expo-image";
import { useTheme } from "./ThemeContext";
import { SPACING, RADIUS, TYPE, TIMING } from "../constants/tokens";

// Global toast (B6 rules: plain text + optional action; Otto appears ONLY as
// the one first-save Excited card — never in routine toasts).
// useToast().show({ message, actionLabel?, onAction?, ottoImage?, duration? })

const ToastContext = createContext({ show: () => {} });

export const ToastProvider = ({ children }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [toast, setToast] = useState(null);
  const timer = useRef(null);
  const opacity = useRef(new Animated.Value(0)).current;

  // RN Animated (not reanimated layout animations — those are unreliable on
  // web); 200ms fade satisfies the reduced-motion fallback rule by itself.
  useEffect(() => {
    Animated.timing(opacity, {
      toValue: toast ? 1 : 0,
      duration: TIMING.fade,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [toast, opacity]);

  const dismiss = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setToast(null);
  }, []);

  const show = useCallback(
  ({ message, actionLabel, onAction, ottoImage, duration }) => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ message, actionLabel, onAction, ottoImage });
      timer.current = setTimeout(() => setToast(null), duration || (actionLabel ? 5000 : 2500));
    },
    []
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <Animated.View style={[styles.wrap, { opacity }]} pointerEvents="box-none">
          <View style={styles.toast}>
            {toast.ottoImage && (
              <Image source={toast.ottoImage} style={styles.otto} contentFit="contain" />
            )}
            <Text style={styles.message} numberOfLines={2}>
              {toast.message}
            </Text>
            {toast.actionLabel && (
              <TouchableOpacity
                onPress={() => {
                  toast.onAction?.();
                  dismiss();
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
              >
                <Text style={styles.action}>{toast.actionLabel}</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

const createStyles = (colors) =>
  StyleSheet.create({
    wrap: {
      position: "absolute",
      left: SPACING.lg,
      right: SPACING.lg,
      bottom: 96, // above the tab bar
      alignItems: "center",
    },
    toast: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
      backgroundColor: colors.ink,
      borderRadius: RADIUS.button,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      maxWidth: 480,
      shadowColor: colors.shadow,
      shadowOpacity: 0.2,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    otto: {
      width: 36,
      height: 36,
    },
    message: {
      ...TYPE.body,
      color: colors.surface,
      flexShrink: 1,
    },
    action: {
      ...TYPE.body,
      fontWeight: "700",
      color: colors.gold,
    },
  });
