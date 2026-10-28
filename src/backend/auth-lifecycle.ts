import { AppState, type AppStateStatus } from 'react-native';
import { supabase } from './supabase';

let removeListener: (() => void) | null = null;

export function startAuthLifecycle(): () => void {
  const client = supabase;
  if (!client) return () => undefined;
  const update = (state: AppStateStatus) => {
    if (state === 'active') void client.auth.startAutoRefresh();
    else void client.auth.stopAutoRefresh();
  };
  update(AppState.currentState as AppStateStatus);
  const subscription = AppState.addEventListener('change', update);
  removeListener = () => subscription.remove();
  return () => {
    removeListener?.();
    removeListener = null;
    void client.auth.stopAutoRefresh();
  };
}
