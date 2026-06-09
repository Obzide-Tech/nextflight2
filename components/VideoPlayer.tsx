import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Lock,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  VideoOff,
  Volume2,
  VolumeX,
} from 'lucide-react-native';
import { getSignedLessonUrl, savePositionSeconds } from '@/lib/data';
import { useAuth } from '@/contexts/AuthContext';
import { colors, fonts, fontSize, radius, spacing } from '@/theme/tokens';

interface Props {
  lessonId: string;
  videoExternalUrl?: string | null;
  onDurationLoaded?: (seconds: number) => void;
}

function fmtTime(s: number) {
  if (!isFinite(s) || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function VideoPlayer({ lessonId, videoExternalUrl, onDurationLoaded }: Props) {
  const { user } = useAuth();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoErr, setVideoErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  // Controls visibility
  const [showControls, setShowControls] = useState(true);
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Position save
  const positionSaveTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSavedPosition = useRef(0);

  const videoRef = useRef<any>(null);
  const progressRef = useRef<any>(null);
  const containerRef = useRef<any>(null);

  const persistPosition = useCallback((posSecs: number) => {
    if (!user || !lessonId) return;
    if (Math.abs(posSecs - lastSavedPosition.current) < 5) return;
    lastSavedPosition.current = posSecs;
    savePositionSeconds(user.id, lessonId, posSecs);
  }, [user, lessonId]);

  // Fetch video URL — use direct URL if provided, otherwise call Edge Function
  useEffect(() => {
    setLoading(true);
    setVideoUrl(null);
    setVideoErr(null);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    lastSavedPosition.current = 0;

    if (videoExternalUrl) {
      setVideoUrl(videoExternalUrl);
      setLoading(false);
      return;
    }

    getSignedLessonUrl(lessonId).then(({ url, error }) => {
      setLoading(false);
      if (error) {
        setVideoErr(error);
      } else {
        setVideoUrl(url);
      }
    });
  }, [lessonId, videoExternalUrl]);

  // Start/stop the 10-second position save interval
  useEffect(() => {
    if (isPlaying && user) {
      positionSaveTimer.current = setInterval(() => {
        const v = videoRef.current;
        if (v) persistPosition(v.currentTime ?? 0);
      }, 10000);
    } else {
      if (positionSaveTimer.current) {
        clearInterval(positionSaveTimer.current);
        positionSaveTimer.current = null;
      }
    }
    return () => {
      if (positionSaveTimer.current) {
        clearInterval(positionSaveTimer.current);
        positionSaveTimer.current = null;
      }
    };
  }, [isPlaying, user, persistPosition]);

  // Auto-hide controls after 3s of inactivity
  const resetHideTimer = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setShowControls(true);
    Animated.timing(controlsOpacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    hideTimer.current = setTimeout(() => {
      if (isPlaying) {
        Animated.timing(controlsOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() =>
          setShowControls(false)
        );
      }
    }, 3000);
  }, [isPlaying, controlsOpacity]);

  useEffect(() => {
    resetHideTimer();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, [isPlaying]);

  // -- Web-only handlers --
  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    if (v.buffered.length > 0) setBuffered(v.buffered.end(v.buffered.length - 1));
  };

  const onLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration);
    setIsBuffering(false);
    onDurationLoaded?.(Math.round(v.duration));
  };

  const onPlay = () => setIsPlaying(true);

  const onPause = () => {
    setIsPlaying(false);
    const v = videoRef.current;
    if (v) persistPosition(v.currentTime ?? 0);
  };

  const onWaiting = () => setIsBuffering(true);
  const onPlaying = () => setIsBuffering(false);

  const onEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (videoRef.current) videoRef.current.currentTime = 0;
    lastSavedPosition.current = 0;
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    resetHideTimer();
    if (v.paused) v.play();
    else v.pause();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
    resetHideTimer();
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    resetHideTimer();
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const seek = (e: any) => {
    if (!progressRef.current || !videoRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pct = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    videoRef.current.currentTime = pct * duration;
    resetHideTimer();
  };

  const retry = () => {
    setLoading(true);
    setVideoErr(null);
    setVideoUrl(null);
    if (videoExternalUrl) {
      setVideoUrl(videoExternalUrl);
      setLoading(false);
      return;
    }
    getSignedLessonUrl(lessonId).then(({ url, error }) => {
      setLoading(false);
      if (error) setVideoErr(error);
      else setVideoUrl(url);
    });
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;

  // ─── No Video ───────────────────────────────────────────────────────────────
  if (!loading && (videoErr === 'no_video' || (!videoUrl && !videoErr))) {
    return (
      <View style={styles.container}>
        <VideoOff size={36} color={colors.ink[300]} strokeWidth={1.5} />
        <Text style={styles.noVideoText}>Video próximamente</Text>
        <Text style={styles.noVideoSub}>El contenido de esta lección está disponible en la sección Resumen</Text>
      </View>
    );
  }

  // ─── Premium Lock ────────────────────────────────────────────────────────────
  if (!loading && videoErr === 'premium_required') {
    return (
      <View style={styles.container}>
        <Lock size={36} color={colors.gold[400]} strokeWidth={1.5} />
        <Text style={styles.noVideoText}>Lección premium</Text>
        <Text style={styles.noVideoSub}>Accede al programa desde La Aduana para ver esta leccion</Text>
      </View>
    );
  }

  // ─── Generic Error ───────────────────────────────────────────────────────────
  if (!loading && videoErr) {
    return (
      <View style={styles.container}>
        <VideoOff size={36} color={colors.state.error} strokeWidth={1.5} />
        <Text style={styles.noVideoText}>Error al cargar el video</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={retry}>
          <RotateCcw size={14} color={colors.ink[900]} strokeWidth={2} />
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.gold[400]} />
      </View>
    );
  }

  // ─── Web Player ──────────────────────────────────────────────────────────────
  if (Platform.OS === 'web') {
    return (
      <Pressable
        // @ts-ignore
        ref={containerRef}
        style={styles.playerContainer}
        onPress={() => { togglePlay(); resetHideTimer(); }}
        accessibilityRole="none"
      >
        {/* Video element */}
        {/* @ts-ignore */}
        <video
          ref={videoRef}
          src={videoUrl!}
          style={webStyles.video}
          playsInline
          preload="auto"
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoadedMetadata}
          onPlay={onPlay}
          onPause={onPause}
          onWaiting={onWaiting}
          onPlaying={onPlaying}
          onEnded={onEnded}
        />

        {/* Buffering spinner */}
        {isBuffering && (
          <View style={styles.bufferOverlay} pointerEvents="none">
            <View style={styles.bufferSpinnerBg}>
              <ActivityIndicator size="large" color={colors.gold[400]} />
            </View>
          </View>
        )}

        {/* Center play/pause flash */}
        {!isBuffering && (
          <View style={styles.centerIcon} pointerEvents="none">
            <View style={[styles.centerIconBg, { opacity: isPlaying ? 0 : 0.85 }]}>
              <Play size={32} color="#fff" strokeWidth={1.5} fill="#fff" />
            </View>
          </View>
        )}

        {/* Controls overlay */}
        <Animated.View style={[styles.controlsOverlay, { opacity: controlsOpacity }]} pointerEvents={showControls ? 'box-none' : 'none'}>
          {/* Progress bar row */}
          <View style={styles.controlsBottom}>
            {/* Progress track — clickable */}
            {/* @ts-ignore */}
            <View
              // @ts-ignore
              ref={progressRef}
              style={styles.progressTrack}
              onClick={(e: any) => { e.stopPropagation(); seek(e); }}
              accessibilityRole="none"
            >
              <View style={[styles.progressBuffered, { width: `${bufferedPct}%` as any }]} />
              <View style={[styles.progressFill, { width: `${progressPct}%` as any }]} />
              <View style={[styles.progressThumb, { left: `${progressPct}%` as any }]} />
            </View>

            {/* Bottom row: play, time, volume, fullscreen */}
            <View style={styles.controlsRow}>
              <TouchableOpacity
                onPress={(e: any) => { e.stopPropagation?.(); togglePlay(); }}
                style={styles.controlBtn}
                hitSlop={8}
              >
                {isPlaying
                  ? <Pause size={18} color="#fff" strokeWidth={2} fill="#fff" />
                  : <Play size={18} color="#fff" strokeWidth={2} fill="#fff" />
                }
              </TouchableOpacity>

              <Text style={styles.timeText}>
                {fmtTime(currentTime)} / {fmtTime(duration)}
              </Text>

              <View style={styles.controlsSpacer} />

              <TouchableOpacity
                onPress={(e: any) => { e.stopPropagation?.(); toggleMute(); }}
                style={styles.controlBtn}
                hitSlop={8}
              >
                {isMuted
                  ? <VolumeX size={18} color="#fff" strokeWidth={2} />
                  : <Volume2 size={18} color="#fff" strokeWidth={2} />
                }
              </TouchableOpacity>

              <TouchableOpacity
                onPress={(e: any) => { e.stopPropagation?.(); toggleFullscreen(); }}
                style={styles.controlBtn}
                hitSlop={8}
              >
                {isFullscreen
                  ? <Minimize size={18} color="#fff" strokeWidth={2} />
                  : <Maximize size={18} color="#fff" strokeWidth={2} />
                }
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    );
  }

  // ─── Native (non-web) fallback ────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.nativePlayBtn}>
        <Play size={36} color={colors.gold[400]} strokeWidth={1.5} fill={colors.gold[400]} />
      </View>
      <Text style={styles.noVideoSub}>Reproductor nativo · {fmtTime(duration)}</Text>
    </View>
  );
}

const webStyles = {
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'contain' as const,
    backgroundColor: '#000',
    display: 'block',
  } as any,
};

const styles = StyleSheet.create({
  container: {
    width: '100%' as any,
    aspectRatio: 16 / 9,
    backgroundColor: colors.ink[900],
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  playerContainer: {
    width: '100%' as any,
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    overflow: 'hidden',
    position: 'relative',
  },
  bufferOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  bufferSpinnerBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerIcon: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none' as any,
  },
  centerIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  controlsBottom: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 6,
    background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)' as any,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 2,
    position: 'relative',
    cursor: 'pointer' as any,
    marginBottom: 4,
  },
  progressBuffered: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%' as any,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 2,
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%' as any,
    backgroundColor: colors.gold[400],
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.gold[400],
    marginLeft: -6,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlBtn: {
    padding: 4,
  },
  timeText: {
    fontFamily: fonts.support,
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.3,
  },
  controlsSpacer: {
    flex: 1,
  },
  noVideoText: {
    fontFamily: fonts.bodySemibold,
    fontSize: fontSize.md,
    color: colors.cream[200],
    textAlign: 'center',
  },
  noVideoSub: {
    fontFamily: fonts.support,
    fontSize: fontSize.sm,
    color: colors.ink[300],
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.gold[400],
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    marginTop: 4,
  },
  retryText: {
    fontFamily: fonts.bodySemibold,
    fontSize: fontSize.sm,
    color: colors.ink[900],
  },
  nativePlayBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,251,224,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gold[500],
  },
});
