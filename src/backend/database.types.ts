export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: {
      sync_guest_profile: { Args: { p_display_name: string; p_avatar: string; p_avatar_color: string }; Returns: Json };
      get_daily_state: { Args: { p_category_id?: string }; Returns: Json };
      start_daily_attempt: { Args: { p_category_id?: string }; Returns: Json };
      submit_daily_answer: {
        Args: { p_attempt_id: string; p_question_index: number; p_choice_id: string | null; p_request_id: string };
        Returns: Json;
      };
      get_leaderboard: { Args: { p_category_id?: string; p_period?: string; p_limit?: number }; Returns: Json };
      create_friend_room: { Args: { p_category_id: string }; Returns: Json };
      join_friend_room: { Args: { p_code: string }; Returns: Json };
      get_friend_room_state: { Args: { p_room_id: string }; Returns: Json };
      set_friend_ready: { Args: { p_room_id: string; p_ready: boolean }; Returns: Json };
      start_friend_match: { Args: { p_room_id: string }; Returns: Json };
      submit_friend_answer: {
        Args: { p_room_id: string; p_match_id: string; p_question_index: number; p_choice_id: string | null; p_request_id: string };
        Returns: Json;
      };
      leave_friend_room: { Args: { p_room_id: string }; Returns: Json };
      rematch_friend_room: { Args: { p_room_id: string }; Returns: Json };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
