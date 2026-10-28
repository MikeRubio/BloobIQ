alter table private.friend_rate_events
  add column id bigint generated always as identity primary key;

create index friend_answers_round_fk_idx
  on private.friend_answers (match_id, question_index);
create index friend_matches_category_idx
  on private.friend_matches (category_id);
create index friend_rooms_category_idx
  on private.friend_rooms (category_id);
create index friend_rooms_current_match_idx
  on private.friend_rooms (current_match_id) where current_match_id is not null;
create index friend_rooms_host_idx
  on private.friend_rooms (host_user_id);
