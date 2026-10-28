import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Image, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getQuizAssetUrl } from '@/backend/supabase';
import type { FriendMember } from '@/backend/types';
import { BubbleBackground } from '@/components/bubble-background';
import { GameButton } from '@/components/game-button';
import { projectFriendPhase } from '@/friends/timing';
import { preloadFriendCategory, type PreloadProgress } from '@/services/startup-preload';
import { useFriendsStore } from '@/store/friends-store';
import { useProfileStore } from '@/store/profile-store';
import { colors, radius, shadow, spacing, type } from '@/theme/tokens';

function MemberRow({ member }: { member: FriendMember }) {
  return <View style={styles.member}>
    <View style={[styles.avatar, { backgroundColor: member.avatarColor }]}><Text style={styles.avatarText}>{member.avatar}</Text></View>
    <View style={styles.memberCopy}><Text style={styles.memberName}>{member.displayName}{member.isCurrentPlayer ? ' (you)' : ''}</Text><Text style={styles.memberMeta}>{member.isHost ? 'HOST' : member.isConnected ? 'CONNECTED' : 'RECONNECTING'}</Text></View>
    <Text style={[styles.ready, member.isReady && styles.readyYes]}>{member.isReady ? 'READY ✓' : 'WAITING'}</Text>
  </View>;
}

export default function FriendRoomScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const profile = useProfileStore((state) => state.profile);
  const snapshot = useFriendsStore((state) => state.snapshot);
  const connection = useFriendsStore((state) => state.connection);
  const loading = useFriendsStore((state) => state.loading);
  const message = useFriendsStore((state) => state.message);
  const connect = useFriendsStore((state) => state.connect);
  const disconnect = useFriendsStore((state) => state.disconnect);
  const refresh = useFriendsStore((state) => state.refresh);
  const setReady = useFriendsStore((state) => state.setReady);
  const start = useFriendsStore((state) => state.start);
  const answer = useFriendsStore((state) => state.answer);
  const leave = useFriendsStore((state) => state.leave);
  const [tick, setTick] = useState(0);
  const [preload, setPreload] = useState<PreloadProgress | null>(null);
  const [assetsReady, setAssetsReady] = useState(false);
  const payload = useMemo(() => ({ name: profile.name, avatar: profile.avatar, color: profile.color }), [profile]);
  const preloadCategory = snapshot?.categoryId;
  const preloadRoomId = snapshot?.roomId;
  const roomStatus = snapshot?.status;

  useEffect(() => { if (roomId) void connect(payload, roomId); return disconnect; }, [connect, disconnect, payload, roomId]);
  useEffect(() => { const timer = setInterval(() => setTick(Date.now()), 200); return () => clearInterval(timer); }, []);
  useEffect(() => {
    if (!preloadCategory || roomStatus !== 'lobby') return;
    let active = true;
    void preloadFriendCategory(preloadCategory, (next) => { if (active) { setAssetsReady(false); setPreload(next); } }).then(() => { if (active) setAssetsReady(true); });
    return () => { active = false; };
  }, [preloadCategory, preloadRoomId, roomStatus]);

  const projected = snapshot ? projectFriendPhase(snapshot, tick) : null;
  useEffect(() => {
    if (!snapshot || !projected || snapshot.status !== 'playing') return;
    if (projected.phase !== snapshot.phase || (projected.questionIndex !== null && projected.questionIndex !== snapshot.questionIndex)) void refresh();
  }, [projected, refresh, snapshot]);

  if (!snapshot || snapshot.roomId !== roomId) return <RoomShell><Text style={styles.loading}>Connecting to room…</Text></RoomShell>;
  const me = snapshot.members.find((member) => member.isCurrentPlayer);
  const allReady = snapshot.members.length >= 2 && snapshot.members.every((member) => member.isReady);
  const leaveRoom = async () => { await leave(); router.replace('/'); };

  if (snapshot.status === 'lobby') return <RoomShell>
    <Connection state={connection} /><Text style={styles.eyebrow}>{snapshot.categoryId === 'flags' ? '🌍 FLAGS' : '⚽ FOOTBALL'}</Text><Text style={styles.heading}>Lobby</Text>
    <View style={[styles.codeCard, shadow.card]}><Text style={styles.codeLabel}>ROOM CODE</Text><Text selectable style={styles.code}>{snapshot.code}</Text><View style={styles.codeActions}>
      <Pressable onPress={() => void Clipboard.setStringAsync(snapshot.code)} style={styles.smallAction}><Text style={styles.smallActionText}>Copy</Text></Pressable>
      <Pressable onPress={() => void Share.share({ message: `Join my BloopIQ game! Open Play with Friends and enter code ${snapshot.code}.` })} style={styles.smallAction}><Text style={styles.smallActionText}>Share</Text></Pressable>
    </View></View>
    <View style={styles.playersHeader}><Text style={styles.sectionTitle}>Players</Text><Text style={styles.count}>{snapshot.members.length}/8</Text></View>
    <View style={[styles.list, shadow.card]}>{snapshot.members.map((member) => <MemberRow key={member.userId} member={member} />)}</View>
    {!assetsReady ? <View style={styles.preload}><Text style={styles.preloadText}>Preparing quiz images… {preload?.total ? Math.round((preload.completed / preload.total) * 100) : 0}%</Text><View style={styles.track}><View style={[styles.fill, { width: `${preload?.total ? (preload.completed / preload.total) * 100 : 0}%` }]} /></View></View> : null}
    <GameButton disabled={loading || !assetsReady} label={!assetsReady ? 'Preparing assets…' : me?.isReady ? 'Not ready' : 'I’m ready'} onPress={() => void setReady(!me?.isReady)} variant={me?.isReady ? 'ghost' : 'mint'} />
    {snapshot.isHost ? <GameButton disabled={loading || !allReady} label={allReady ? 'Start match' : snapshot.members.length < 2 ? 'Waiting for a friend' : 'Waiting for everyone'} onPress={() => void start()} variant="yellow" /> : <Text style={styles.hostHint}>The host starts when everyone is ready.</Text>}
    <Notice message={message} /><GameButton compact label="Leave room" onPress={() => void leaveRoom()} variant="ghost" />
  </RoomShell>;

  if (projected?.phase === 'countdown') return <RoomShell><Connection state={connection} /><Text style={styles.eyebrow}>GET READY</Text><Text style={styles.countdown}>{Math.max(1, Math.ceil(projected.remainingMs / 1000))}</Text><Text style={styles.centerCopy}>The match starts for everyone at the same time.</Text></RoomShell>;
  if (projected?.phase === 'results' || snapshot.status === 'results') return <Results onLeave={leaveRoom} />;

  const round = snapshot.round;
  const waiting = !round || round.index !== projected?.questionIndex;
  const revealed = projected?.phase === 'reveal';
  return <RoomShell><Connection state={connection} />
    <View style={styles.matchTop}><Text style={styles.progress}>QUESTION {(projected?.questionIndex ?? 0) + 1} / 10</Text><Text style={[styles.timer, revealed && styles.timerReveal]}>{Math.max(0, Math.ceil((projected?.remainingMs ?? 0) / 1000))}</Text></View>
    <Text style={styles.answerCount}>{snapshot.answerCount}/{snapshot.members.length} answers locked</Text>
    {waiting ? <Text style={styles.loading}>Syncing the next question…</Text> : <>
      <View style={[styles.imageStage, shadow.card]}>{round.assetPath ? <Image resizeMode="contain" source={{ uri: getQuizAssetUrl(round.assetPath) ?? undefined }} style={styles.quizImage} /> : null}</View>
      <Text style={styles.prompt}>{revealed ? 'Answer revealed' : 'What is this?'}</Text>
      <View style={styles.answers}>{round.options.map((option) => {
        const selected = snapshot.myAnswer?.choiceId === option.id;
        const correct = revealed && round.correctChoiceId === option.id;
        return <Pressable disabled={revealed || Boolean(snapshot.myAnswer)} key={option.id} onPress={() => void answer(option.id)} style={[styles.answer, selected && styles.selectedAnswer, correct && styles.correctAnswer]}><Text style={styles.answerText}>{option.label}</Text><Text style={styles.answerMark}>{correct ? '✓' : selected ? 'LOCKED' : ''}</Text></Pressable>;
      })}</View>
      {snapshot.myAnswer && !revealed ? <Text style={styles.locked}>Answer locked · waiting for reveal</Text> : null}
    </>}
    <Notice message={message} />
  </RoomShell>;
}

function Results({ onLeave }: { onLeave: () => Promise<void> }) {
  const { snapshot, loading, rematch } = useFriendsStore();
  if (!snapshot) return null;
  return <RoomShell><Text style={styles.eyebrow}>FINAL RESULTS</Text><Text style={styles.heading}>Podium</Text>
    <View style={styles.podium}>{snapshot.standings?.slice(0, 3).map((s) => <View key={s.userId} style={[styles.podiumCard, s.rank === 1 && styles.winner]}><Text style={styles.medal}>{s.rank === 1 ? '🥇' : s.rank === 2 ? '🥈' : '🥉'}</Text><Text numberOfLines={1} style={styles.podiumName}>{s.displayName}</Text><Text style={styles.podiumScore}>{s.score.toLocaleString()}</Text></View>)}</View>
    <View style={[styles.list, shadow.card]}>{snapshot.standings?.map((s) => <View key={s.userId} style={[styles.standing, s.isCurrentPlayer && styles.currentStanding]}><Text style={styles.rank}>#{s.rank}</Text><Text style={styles.standingAvatar}>{s.avatar}</Text><View style={styles.memberCopy}><Text style={styles.memberName}>{s.displayName}{s.isCurrentPlayer ? ' (you)' : ''}</Text><Text style={styles.memberMeta}>{s.correctCount}/10 correct · {(s.durationMs / 1000).toFixed(1)}s</Text></View><Text style={styles.score}>{s.score.toLocaleString()}</Text></View>)}</View>
    {snapshot.isHost ? <GameButton disabled={loading} label="Play again" onPress={() => void rematch()} variant="yellow" /> : <Text style={styles.hostHint}>Waiting for the host to choose a rematch.</Text>}
    <GameButton compact label="Leave room" onPress={() => void onLeave()} variant="ghost" />
  </RoomShell>;
}

function Connection({ state }: { state: string }) { return <View style={styles.connection}><View style={[styles.dot, state === 'live' ? styles.dotLive : styles.dotRecovering]} /><Text style={styles.connectionText}>{state === 'live' ? 'LIVE ROOM' : 'RECONNECTING'}</Text></View>; }
function Notice({ message }: { message: string | null }) { return message ? <Text accessibilityRole="alert" style={styles.error}>{message}</Text> : null; }
function RoomShell({ children }: { children: ReactNode }) { return <View style={styles.root}><BubbleBackground /><SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content}>{children}</ScrollView></SafeAreaView></View>; }

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface }, safe: { flex: 1 }, content: { width: '100%', maxWidth: 620, alignSelf: 'center', padding: spacing.xl, paddingBottom: 48, gap: spacing.md }, loading: { ...type.heading, color: colors.inkSoft, textAlign: 'center', marginTop: 100 },
  connection: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', gap: 6 }, dot: { width: 8, height: 8, borderRadius: 8 }, dotLive: { backgroundColor: colors.mintDark }, dotRecovering: { backgroundColor: colors.yellowDark }, connectionText: { ...type.heading, fontSize: 10, color: colors.inkSoft, letterSpacing: .8 },
  eyebrow: { ...type.heading, color: colors.skyDark, fontSize: 12, letterSpacing: 1, textAlign: 'center', marginTop: spacing.lg }, heading: { ...type.display, fontSize: 31, textAlign: 'center' }, codeCard: { backgroundColor: colors.sky, borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center' }, codeLabel: { ...type.heading, color: '#EAF8FF', fontSize: 11, letterSpacing: 1 }, code: { ...type.display, color: colors.white, fontSize: 38, letterSpacing: 8, marginLeft: 8 }, codeActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }, smallAction: { minHeight: 44, backgroundColor: 'rgba(255,255,255,.2)', borderRadius: radius.md, paddingHorizontal: spacing.lg, alignItems: 'center', justifyContent: 'center' }, smallActionText: { ...type.heading, color: colors.white },
  playersHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, sectionTitle: { ...type.display, fontSize: 20 }, count: { ...type.heading, color: colors.inkSoft }, list: { backgroundColor: colors.white, borderWidth: 2, borderColor: colors.border, borderRadius: radius.lg, overflow: 'hidden' }, member: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }, avatar: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' }, avatarText: { fontSize: 23 }, memberCopy: { flex: 1, minWidth: 0 }, memberName: { ...type.heading, fontSize: 14 }, memberMeta: { ...type.heading, color: colors.inkSoft, fontSize: 8, letterSpacing: .5, marginTop: 2 }, ready: { ...type.heading, color: colors.inkSoft, fontSize: 9 }, readyYes: { color: colors.mintDark },
  preload: { gap: spacing.sm }, preloadText: { ...type.regular, textAlign: 'center', color: colors.inkSoft, fontSize: 12 }, track: { height: 8, backgroundColor: colors.border, borderRadius: radius.round, overflow: 'hidden' }, fill: { height: '100%', backgroundColor: colors.mint, borderRadius: radius.round }, hostHint: { ...type.body, color: colors.inkSoft, textAlign: 'center' }, error: { ...type.body, color: colors.coralDark, backgroundColor: colors.dangerPale, padding: spacing.md, borderRadius: radius.md, textAlign: 'center' },
  countdown: { ...type.display, color: colors.coral, fontSize: 112, lineHeight: 124, textAlign: 'center', marginTop: 80 }, centerCopy: { ...type.body, color: colors.inkSoft, textAlign: 'center' }, matchTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, progress: { ...type.heading, color: colors.skyDark, fontSize: 12, letterSpacing: .7 }, timer: { ...type.display, color: colors.coral, fontSize: 26 }, timerReveal: { color: colors.sky }, answerCount: { ...type.regular, color: colors.inkSoft, textAlign: 'right', fontSize: 11 },
  imageStage: { height: 235, backgroundColor: colors.flagStage, borderWidth: 2, borderColor: colors.flagStageBorder, borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center', justifyContent: 'center' }, quizImage: { width: '100%', height: '100%' }, prompt: { ...type.display, fontSize: 24, textAlign: 'center' }, answers: { gap: spacing.sm }, answer: { minHeight: 58, borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.border, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center' }, selectedAnswer: { borderColor: colors.sky, backgroundColor: colors.skyPale }, correctAnswer: { borderColor: colors.mintDark, backgroundColor: colors.successPale }, answerText: { ...type.heading, fontSize: 15, flex: 1 }, answerMark: { ...type.heading, fontSize: 10, color: colors.mintDark }, locked: { ...type.body, color: colors.skyDark, textAlign: 'center' },
  podium: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm }, podiumCard: { flex: 1, minWidth: 0, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center' }, winner: { minHeight: 142, borderColor: colors.yellow, backgroundColor: colors.surfaceWarm }, medal: { fontSize: 29 }, podiumName: { ...type.heading, fontSize: 11, width: '100%', textAlign: 'center' }, podiumScore: { ...type.display, fontSize: 17 }, standing: { minHeight: 64, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }, currentStanding: { backgroundColor: colors.skyPale }, rank: { ...type.display, width: 35, fontSize: 16 }, standingAvatar: { fontSize: 23 }, score: { ...type.display, fontSize: 15 },
});
