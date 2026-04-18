// Leaderboard removed — rewards system has been removed from Highlander Events
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function LeaderboardScreen() {
  const router = useRouter();
  useEffect(() => {
    router.back();
  }, []);
  return null;
}
