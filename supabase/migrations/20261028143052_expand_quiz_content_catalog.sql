-- Expand BloopIQ content to a 195-country Flags pack and a versioned Football
-- identity pack. Assets are stored in the public quiz-assets Storage bucket;
-- metadata and answer keys remain in the private schema.

alter table private.flag_content enable row level security;
alter table private.daily_challenge_rounds enable row level security;

alter table public.categories add column current_content_version text;

insert into public.categories (id, display_name, is_active, current_content_version)
values ('football', 'Football', true, 'football-v1')
on conflict (id) do update set
  display_name = excluded.display_name,
  is_active = excluded.is_active,
  current_content_version = excluded.current_content_version;

update public.categories
set current_content_version = 'flags-195-v1'
where id = 'flags';

alter table public.categories alter column current_content_version set not null;

create table private.quiz_content (
  category_id text not null references public.categories(id) on delete restrict,
  content_version text not null,
  item_id text not null,
  display_name text not null,
  asset_path text not null,
  asset_sha256 text not null,
  source_page_url text not null,
  source_asset_url text not null,
  rights_status text not null,
  attribution text not null,
  difficulty text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (content_version, item_id),
  unique (content_version, asset_path),
  constraint quiz_content_item_id_format check (item_id ~ '^[a-z0-9][a-z0-9-]{1,79}$'),
  constraint quiz_content_asset_path_format check (asset_path ~ '^[a-z0-9][a-z0-9._/-]{1,199}$'),
  constraint quiz_content_sha256_format check (asset_sha256 ~ '^[0-9a-f]{64}$'),
  constraint quiz_content_source_page_https check (source_page_url ~ '^https://'),
  constraint quiz_content_source_asset_https check (source_asset_url ~ '^https://'),
  constraint quiz_content_rights_status check (rights_status in ('public_domain_national_symbol', 'trademark_review_required')),
  constraint quiz_content_difficulty check (difficulty in ('easy', 'medium', 'hard')),
  constraint quiz_content_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create index quiz_content_category_version_idx
  on private.quiz_content (category_id, content_version);

alter table private.quiz_content enable row level security;
revoke all on table private.quiz_content from public, anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('quiz-assets', 'quiz-assets', true, 2000000, array['image/png', 'image/jpeg'])
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- GENERATED_CONTENT_START
insert into private.quiz_content
  (category_id, content_version, item_id, display_name, asset_path, asset_sha256, source_page_url, source_asset_url, rights_status, attribution, difficulty, metadata)
values
  ('flags', 'flags-195-v1', 'flag-ad', 'Andorra', 'flags-195-v1/ad.png', 'b48117c722cafbe9857ad302f8fba3f0891236608ad5bc19a41fe71b36750791', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/ad.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'hard', '{"iso2":"AD","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-ae', 'United Arab Emirates', 'flags-195-v1/ae.png', 'ef5e50816629b1a574f60e5950482abac17ca7d87214628f7b3f90f70e5a6924', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/ae.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"AE","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-af', 'Afghanistan', 'flags-195-v1/af.png', '92cd9b87a142744cef76c0495771d0366bc320bf752118b2db476867e03e68ea', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/af.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"AF","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-ag', 'Antigua and Barbuda', 'flags-195-v1/ag.png', 'b0b7a4a388879597254f19a860fb9478e0d5af5d0f96bfa8f69dc608318c6f47', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/ag.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'hard', '{"iso2":"AG","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-al', 'Albania', 'flags-195-v1/al.png', '881570cd81e84ce848abb1eae5d2ca701026ca0c13f401ea972aceed6b9ae1c2', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/al.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"AL","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-am', 'Armenia', 'flags-195-v1/am.png', 'de9b67feeb7c0f4aaf6b64298e153b8c1b632c8b43ecdb20dfabea81431a4fa2', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/am.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"AM","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-ao', 'Angola', 'flags-195-v1/ao.png', 'f47b74075db3c9c8f82b99ac9494cd2be0c62316cda82b032369657112c9fb78', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/ao.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"AO","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-ar', 'Argentina', 'flags-195-v1/ar.png', '9c07fb6f1448bea9ea2847619abf959c77840789b38a904984adb294b73deb83', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/ar.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'easy', '{"iso2":"AR","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-at', 'Austria', 'flags-195-v1/at.png', 'f0902cd1e864f06ea2ac1fce008e8d8a0423bb1caf5cbc74928bcbb8afb5ef21', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/at.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'easy', '{"iso2":"AT","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-au', 'Australia', 'flags-195-v1/au.png', '568609b19db05c84aba7014bf422654df867ac2cd7007b0e8486411d5510d4b1', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/au.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'easy', '{"iso2":"AU","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-az', 'Azerbaijan', 'flags-195-v1/az.png', '189104fcc06738d9f6c0f98c7ccd4fae416b8996e4200746fc373100aa4211a1', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/az.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"AZ","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-ba', 'Bosnia and Herzegovina', 'flags-195-v1/ba.png', '7cda7a5c3f708ae778b0fffaca60b7a173f103c33efc6570c86c7a8889d91b05', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/ba.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"BA","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-bb', 'Barbados', 'flags-195-v1/bb.png', '916d681022f41d4601730114a47e06d520124652dc2c2ddb4d4330e4061d4d24', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/bb.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'hard', '{"iso2":"BB","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-bd', 'Bangladesh', 'flags-195-v1/bd.png', '801f7b0170e31c155b6469d35b63ac7a68791587d015f3de2ac86b682298f26b', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/bd.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"BD","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-be', 'Belgium', 'flags-195-v1/be.png', '850a2e2b94a27d673036266215e5127599c6c18f0372eaf7aa6c52487a929c63', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/be.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'easy', '{"iso2":"BE","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-bf', 'Burkina Faso', 'flags-195-v1/bf.png', '4be08e64f00fa45aa74e47a9f9003fda29dfae8d138a6b50f34200667478bac6', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/bf.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"BF","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-bg', 'Bulgaria', 'flags-195-v1/bg.png', '81ce0834db80ea530e022d2c1e539b56cc87927564d742aa1a65a445bf1f0094', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/bg.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"BG","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-bh', 'Bahrain', 'flags-195-v1/bh.png', '97e41f2eb000731f648e4251c01b6de01e366c302e10b9666adb31d35d82f071', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/bh.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"BH","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-bi', 'Burundi', 'flags-195-v1/bi.png', 'b9af18620de3853c9c26137bbda81bc18ee3c62b0f3d730e353600ff5518bc69', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/bi.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"BI","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-bj', 'Benin', 'flags-195-v1/bj.png', 'f8ce9f7ea5010417d389f9aa8f8a59bd3560d4c5a13b77de626ba14f6b93ca5f', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/bj.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"BJ","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-bn', 'Brunei Darussalam', 'flags-195-v1/bn.png', 'df329e3b9eb3b40de21e689a02e116316da59b87d747f9a887113fdf71993650', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/bn.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"BN","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-bo', 'Bolivia', 'flags-195-v1/bo.png', 'd4b4c3ec55b9b3240b29f6cf3a4ab2538eee01dd7df858b97e40b2e0ae8d70d9', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/bo.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"BO","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-br', 'Brazil', 'flags-195-v1/br.png', 'f0156420e2eb2380e1ed031e1567da3f5aa34347d59549e5efefa72f704f16bf', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/br.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'easy', '{"iso2":"BR","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-bs', 'Bahamas', 'flags-195-v1/bs.png', '42d895e42d0a32702d3644c3665dd827a252ac6ce213f6ef68f705c041a32808', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/bs.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"BS","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-bt', 'Bhutan', 'flags-195-v1/bt.png', '3d3383132a4d3369ea483745538da677de59e861afddd5c6ea0cecd4894137f5', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/bt.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'hard', '{"iso2":"BT","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-bw', 'Botswana', 'flags-195-v1/bw.png', 'a0c5279ebdbfde1f50b8e21599671af4d3380cd5b6991db52d5b66ae4df2be96', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/bw.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"BW","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-by', 'Belarus', 'flags-195-v1/by.png', '36d67d27b7a09985adccedb2167a93db551560adaeb4c31826825bd283108ed3', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/by.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"BY","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-bz', 'Belize', 'flags-195-v1/bz.png', '83d94cccc384378427937a4ed172684762231cc73ea028fe3711d6d204b9b4cf', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/bz.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'hard', '{"iso2":"BZ","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-ca', 'Canada', 'flags-195-v1/ca.png', '5f0afe13fa7524372fc9b404d00a15764a36cd54daf591c9aff4c270f066c1bc', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/ca.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'easy', '{"iso2":"CA","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-cd', 'Democratic Republic of the Congo', 'flags-195-v1/cd.png', '2cb173ef71174f7d8b1078f77e74c8d8679c8edb5d4cf95182cba652d6f93fdd', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/cd.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"CD","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-cf', 'Central African Republic', 'flags-195-v1/cf.png', '7f7c9a5a230474eb15fbae08229e9cd644c2ebb4213534cb28d32761f60fac80', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/cf.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"CF","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-cg', 'Republic of the Congo', 'flags-195-v1/cg.png', '39e0e695bee8b65b5b488c67a6d13edda163f59e32ef32c3f1724fdb6ac69b4b', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/cg.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"CG","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-ch', 'Switzerland', 'flags-195-v1/ch.png', '082c7a7b9e3b0df530b3eea779d8a23013f625ed5dd6fa8fc2bc5937b6e00e2c', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/ch.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'easy', '{"iso2":"CH","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-ci', 'Côte d''Ivoire', 'flags-195-v1/ci.png', '9753952bfb100dd683c167ec498c33d6e1514a45521a8520d1df6a5540ce013e', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/ci.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"CI","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-cl', 'Chile', 'flags-195-v1/cl.png', 'd84bd811e5211937fa930b3cb5697ed34714a3b0c9a3cf7f69bfc98b67136335', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/cl.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"CL","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-cm', 'Cameroon', 'flags-195-v1/cm.png', '87f099c8ec5192334c206612dcc48f8a8656a6ff68b4bb60130085449b04c61f', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/cm.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"CM","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-cn', 'China', 'flags-195-v1/cn.png', 'c9aa86d45441f3525cf1acb4f7aecd4d9d7d45fa81c12aad7e9ced80a668215a', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/cn.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'easy', '{"iso2":"CN","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-co', 'Colombia', 'flags-195-v1/co.png', '9d264312fe2e19d8949beaba177d45fee0eda329d6c8e4543ee620ae6ea8c069', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/co.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"CO","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-cr', 'Costa Rica', 'flags-195-v1/cr.png', '8f8211e2985b8633c2ab67c69f353b9e5ea6def91c7bebbe8e1ed3bcb942c3c4', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/cr.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"CR","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-cu', 'Cuba', 'flags-195-v1/cu.png', 'ee328c44cd0a898d1ea290487d883af373c526dec4a59a72b04616c241eca2db', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/cu.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"CU","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-cv', 'Cabo Verde', 'flags-195-v1/cv.png', '9e820bf7431d016be4387475dadb0942da2c6fbb97681607edafcc55c95f2528', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/cv.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'hard', '{"iso2":"CV","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-cy', 'Cyprus', 'flags-195-v1/cy.png', '4f7e838e4e383d4d949f88052afc4a7b5ceb5865f268c15a241cf16ffe7ac178', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/cy.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"CY","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-cz', 'Czechia', 'flags-195-v1/cz.png', 'c995fb91d0bfc90c4d08f7e445a71e10741b783c6c566df1af4ed89b8f1df9bc', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/cz.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"CZ","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-de', 'Germany', 'flags-195-v1/de.png', '8551510a2206f01bcdc9e99a8f2366210d48010890f2fc548a7bf408b691fccd', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/de.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'easy', '{"iso2":"DE","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-dj', 'Djibouti', 'flags-195-v1/dj.png', '59f84a118b381495617175496482836b820d5c4d3fae36b2f11442f52bbb73b1', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/dj.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"DJ","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-dk', 'Denmark', 'flags-195-v1/dk.png', '9a056b57739303b8b97afd9b86be589d60d295c1fe22518ad06dcacf8258f2f5', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/dk.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'easy', '{"iso2":"DK","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-dm', 'Dominica', 'flags-195-v1/dm.png', 'ae85fa466e56b1f56d724d18638387ed7f69e7558754cb94428113496a83d909', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/dm.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'hard', '{"iso2":"DM","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-do', 'Dominican Republic', 'flags-195-v1/do.png', '353b73f8cb22345dbec6a2dffadcc2c8e348cd03c4bf20de47ec35ac2a875df8', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/do.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"DO","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-dz', 'Algeria', 'flags-195-v1/dz.png', 'ee96a8e4fec844793bb0503190d67c8c28f635b5e2a2f2a765c49d3c4ec44f7f', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/dz.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"DZ","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-ec', 'Ecuador', 'flags-195-v1/ec.png', 'e84ae20ea230a3f901140f45520a5332d7bf4c7ec05b537d34e1bbc904106be7', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/ec.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"EC","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-ee', 'Estonia', 'flags-195-v1/ee.png', 'b437752278291529c243cad4cb83fb316126d2eee19ecb9422547b8529c9e542', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/ee.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"EE","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-eg', 'Egypt', 'flags-195-v1/eg.png', '5f5b73b300192c3530f212bfda83dceaf8ea2d1b2b9b8584760ff528504ac9ec', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/eg.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'easy', '{"iso2":"EG","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-er', 'Eritrea', 'flags-195-v1/er.png', '543538ee7d70f0b5540756c751d4b089716ba5ab6a395267adfec5239818db4c', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/er.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"ER","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-es', 'Spain', 'flags-195-v1/es.png', '3a4b06e853aab4c9aa2999bcd736671a9083b5d6c26b8f5a82c9b59e8c97dece', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/es.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'easy', '{"iso2":"ES","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-et', 'Ethiopia', 'flags-195-v1/et.png', '93edf038a7706cd78e8e69bcace61a063c7991e00d03d2989299762adad743f1', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/et.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"ET","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-fi', 'Finland', 'flags-195-v1/fi.png', 'acc2845b300d86d2174dafd2eb2b735bb356105df5e6baaee2e34ec9f4858fe7', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/fi.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'easy', '{"iso2":"FI","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-fj', 'Fiji', 'flags-195-v1/fj.png', '380e9926286c32a78e2ed02f01d73a0fa619fa3b8187df5b019a20eead35e8dd', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/fj.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'hard', '{"iso2":"FJ","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-fm', 'Micronesia', 'flags-195-v1/fm.png', '3f55c03868ccb4c1a8db595e280f1558d59f7030d497883e2ddaad9413ae0a0d', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/fm.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'hard', '{"iso2":"FM","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-fr', 'France', 'flags-195-v1/fr.png', '591395fc4c3495664b3466cafc4095d98103f0c97f461467af15c405c069399b', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/fr.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'easy', '{"iso2":"FR","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-ga', 'Gabon', 'flags-195-v1/ga.png', '3b5f02e6594ec32bff95a6acd74d76d57663228289eb5b6e08d073d85915c572', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/ga.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"GA","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-gb', 'United Kingdom', 'flags-195-v1/gb.png', 'dda1fb99d092110451681339f6b3dbca0dd80c9e033baf198b454fb6770bc708', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/gb.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'easy', '{"iso2":"GB","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-gd', 'Grenada', 'flags-195-v1/gd.png', '4b5830ed52dce92208ac59961cf1c07f05c71000fe3f5d21a52ef527fa6242e1', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/gd.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'hard', '{"iso2":"GD","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-ge', 'Georgia', 'flags-195-v1/ge.png', '03a2a2a24c1e886e6b4cb888b0735a7a3b3b98e8551c35a2fccfb386730aba53', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/ge.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"GE","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-gh', 'Ghana', 'flags-195-v1/gh.png', 'e19394b4a0a0a1ac4c8d226dabac7d5f406c6b9a6a3064ea13cf210838e91fe0', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/gh.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"GH","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-gm', 'Gambia', 'flags-195-v1/gm.png', '5f621ac92ef6ebc75cba38d1c79b8a67387dd7621023ce3830e34fb568c22c57', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/gm.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"GM","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-gn', 'Guinea', 'flags-195-v1/gn.png', '6882b6ebc22883bd1f8c0d1f021ea18dba1548451d9d4030b2d7160e3a5a6e03', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/gn.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"GN","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-gq', 'Equatorial Guinea', 'flags-195-v1/gq.png', 'b00e1d3d568a60e011abd74121be43bc189dbb90619d692a804637028fc1c8cf', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/gq.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"GQ","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-gr', 'Greece', 'flags-195-v1/gr.png', '04cd13e63000e03375d99e07c0e0e28f692e16c8535f5abd2c4ad9c39528e418', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/gr.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'easy', '{"iso2":"GR","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-gt', 'Guatemala', 'flags-195-v1/gt.png', '49ed30272fe1709bd5b5cea3479337ca1b39df433cc7e0c8f06e498e7244b547', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/gt.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"GT","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-gw', 'Guinea-Bissau', 'flags-195-v1/gw.png', '541d9d76ed0edd0ec7d26e375c78d2cebbb40692da7b502728395304102ff8be', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/gw.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'hard', '{"iso2":"GW","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-gy', 'Guyana', 'flags-195-v1/gy.png', '63a4ac2bd931e52de97ccd6b0d8b99c310a279fefd5067ecbbf2761f2aaa0503', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/gy.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"GY","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-hn', 'Honduras', 'flags-195-v1/hn.png', '255f11fe2cfdccc950f536bd1beef984291d894abae49a7566e4debfa376513a', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/hn.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"HN","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-hr', 'Croatia', 'flags-195-v1/hr.png', '1ea94a159d523111e2c87cafb3025326a50b454e934bce8929661d895463cc0a', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/hr.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"HR","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-ht', 'Haiti', 'flags-195-v1/ht.png', 'a39ef2bf28c3fd32883a19e52a157f1113a59e0765b4a9712780ea079e42e536', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/ht.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"HT","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-hu', 'Hungary', 'flags-195-v1/hu.png', '9ab6e7ebe3002d7627fce9c265a9f58c16cd4a9e9b5cb474d98c3a5187f90e78', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/hu.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"HU","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-id', 'Indonesia', 'flags-195-v1/id.png', '87ef9322a7285f8757d91a028a6a5c484d965aa2af162fe7a4ba1095b5d3ab25', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/id.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"ID","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-ie', 'Ireland', 'flags-195-v1/ie.png', 'd09d1908e81e35b3491d004d66b601b98829b5f49993c1be5db8d11307ec921a', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/ie.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'easy', '{"iso2":"IE","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-il', 'Israel', 'flags-195-v1/il.png', 'b791b73c7f3ae564dc9da0a05e71195f015ea3d943e08a7562b66b14cc98125b', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/il.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'easy', '{"iso2":"IL","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-in', 'India', 'flags-195-v1/in.png', 'b735625ab60c14b5208677d848900d06aa2229cac80006c368e6dbce86a89ca0', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/in.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'easy', '{"iso2":"IN","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-iq', 'Iraq', 'flags-195-v1/iq.png', '7f780c5c47b779e04676bbc13099ed1d20398efc1e28354faaa1dbc24ecef6b6', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/iq.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"IQ","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-ir', 'Iran', 'flags-195-v1/ir.png', '2f004c2de825e87a7be0cdb7691e1f979ea08c0b8c233ce7aa95b9480c7ee875', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/ir.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"IR","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-is', 'Iceland', 'flags-195-v1/is.png', 'bf3eaa9d915be05555bf4b89e6117d2516d7eeb6517fb695601067c4af6f02d1', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/is.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"IS","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-it', 'Italy', 'flags-195-v1/it.png', '9f2f26f85d7621b83508156924708dfda81b01bdf1152686a9e636186afa61d7', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/it.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'easy', '{"iso2":"IT","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-jm', 'Jamaica', 'flags-195-v1/jm.png', '1677e111fc96aab812fb3d8f668f91c3eee0cc0a6ee2d11711ad0c50ba91ba5e', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/jm.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"JM","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-jo', 'Jordan', 'flags-195-v1/jo.png', 'f80c256f08f05720467dce3afce528e5cd98ade57be564f310fed279078c40df', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/jo.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"JO","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-jp', 'Japan', 'flags-195-v1/jp.png', 'c18f9200bee9ab71f984af59e4f01089b1306c449ff275174cd8cf0725595952', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/jp.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'easy', '{"iso2":"JP","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-ke', 'Kenya', 'flags-195-v1/ke.png', 'd953ca536ebd5572878507fd0d415721842aad84c4474d8ae41b634b452b5f4f', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/ke.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"KE","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-kg', 'Kyrgyzstan', 'flags-195-v1/kg.png', 'b930852a96f54417dc9bbc299f2173f28dc1b558490678b2e714a6129f61675d', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/kg.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"KG","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-kh', 'Cambodia', 'flags-195-v1/kh.png', '295553a50f49c178246dc4f3bd0cfb89144cfd1612d1d3d4f6ea93837adaaccc', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/kh.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"KH","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-ki', 'Kiribati', 'flags-195-v1/ki.png', 'fba9bd6ae46f6eb45000184d4f7d6892f7b1dbc85e1199ffdd92ab7dd57f076c', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/ki.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'hard', '{"iso2":"KI","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-km', 'Comoros', 'flags-195-v1/km.png', '398db0c07afb4cc66112399fefc11808baa439a6892052665e78c1940d8d51f8', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/km.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'hard', '{"iso2":"KM","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-kn', 'Saint Kitts and Nevis', 'flags-195-v1/kn.png', '64c4d52a4020b8f30e998d60f7a524739785a96aa423bac71e5402fc76bd3229', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/kn.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'hard', '{"iso2":"KN","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-kp', 'North Korea', 'flags-195-v1/kp.png', '839ebdfb7bbb6cc9a554b2f4aa4d2077612e931d11b7238c84c6ac7a49d72eee', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/kp.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"KP","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-kr', 'South Korea', 'flags-195-v1/kr.png', '39f877b6028a09da1f811cfeabe3b008d142ccb70d0995d4130d91c7001634e2', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/kr.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'easy', '{"iso2":"KR","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-kw', 'Kuwait', 'flags-195-v1/kw.png', '4d816d0e7fdc025b1389f225c9532ff9e94ba85f558309cbabbe39deb6228c66', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/kw.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"KW","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-kz', 'Kazakhstan', 'flags-195-v1/kz.png', '51c276afe419389310f724ad62c7234385963c6bcc4e17effd33619d48e9b86b', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/kz.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"KZ","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-la', 'Laos', 'flags-195-v1/la.png', '018a796fdd4b6038bd7ff773c461e79c521c9e98acb52788805ce68ce61fba9d', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/la.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"LA","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-lb', 'Lebanon', 'flags-195-v1/lb.png', '08ad29bb32eeb2141e5860da21af5cd48cff1852163126e03d10971a907fafa1', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/lb.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"LB","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-lc', 'Saint Lucia', 'flags-195-v1/lc.png', 'ff0e28c5099bb394e90cb90e8782fdaceafa73a99053dd4fae8adcedf9b00825', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/lc.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'hard', '{"iso2":"LC","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-li', 'Liechtenstein', 'flags-195-v1/li.png', '3926567d8d2f35c4632992e268e43e320e31c6e2fc29ae67639039398890c7ca', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/li.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'hard', '{"iso2":"LI","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-lk', 'Sri Lanka', 'flags-195-v1/lk.png', '986b5365a6bae5e3b93677b0b888eec54521fe1136dbd816dca496197ec08977', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/lk.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"LK","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-lr', 'Liberia', 'flags-195-v1/lr.png', '3f7dc9030f2a0f178a1a6bdfa79b3a3e1fa79fa60305016c8a5fd0ec79fb12cd', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/lr.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"LR","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-ls', 'Lesotho', 'flags-195-v1/ls.png', '98740ea4b052c9a1870f3f587ec8aeb8543086ba80d85cc9fd2aa3974ceb8afd', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/ls.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"LS","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-lt', 'Lithuania', 'flags-195-v1/lt.png', '120153f54f1c4f1efb5612a7eb04d63f7e3ea506f695a8d37248fe450a71c8d6', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/lt.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"LT","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-lu', 'Luxembourg', 'flags-195-v1/lu.png', '42459bad4fbe7e6c7b5999dc73042b1530e648463f0dc3d229f34b2038461108', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/lu.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"LU","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-lv', 'Latvia', 'flags-195-v1/lv.png', '8262fbbb4419beb5a59bf23b8b415d7d0c2b07210b7f2fe070ed73c681ad6502', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/lv.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"LV","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-ly', 'Libya', 'flags-195-v1/ly.png', 'bb71bd8d27b1e5f78c438ecaf0f987c168e11e53240c997e17e6537503dfc33e', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/ly.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"LY","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-ma', 'Morocco', 'flags-195-v1/ma.png', '63bf579a74ddf432be8bd1f0520a5a6f1eab91729a0bbf1b33363e8da8ff8fb9', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/ma.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"MA","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-mc', 'Monaco', 'flags-195-v1/mc.png', '7ff745bb0469e7074e644f9c579e660fb8913b3f832b9319aba58f9159fa203f', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/mc.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'hard', '{"iso2":"MC","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-md', 'Moldova', 'flags-195-v1/md.png', '231bec3c62134784c84b5b02053842e61995be80f94e0461b658d6fb279ae72f', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/md.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"MD","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-me', 'Montenegro', 'flags-195-v1/me.png', '6b2069c42928f7a43b0d1f4cf1c25c0037940e5b483d2558ac234982648111b6', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/me.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"ME","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-mg', 'Madagascar', 'flags-195-v1/mg.png', '4b6b04a66875c9c1ef9c6cf08958d64bc3874a7d72b00fa255ec6cd69005e386', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/mg.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"MG","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-mh', 'Marshall Islands', 'flags-195-v1/mh.png', 'c471e5ba035cfa0f8be9704265ada351b70a02946637fbb5ef40b1cad0a41912', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/mh.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'hard', '{"iso2":"MH","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-mk', 'North Macedonia', 'flags-195-v1/mk.png', 'eefea9eef675657ae0b42a8054c491b1f49d6186ea49fe7effe67e9cb1294630', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/mk.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"MK","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-ml', 'Mali', 'flags-195-v1/ml.png', '43fb6f2b06b9b41c2d3a9f70e43dc876c163236386e95c6489d95a5b32ee1db8', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/ml.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"ML","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-mm', 'Myanmar', 'flags-195-v1/mm.png', 'f8f7580f79bd9f302341dff3632cdd0d6179f88a16c0f82a45174052435e18ea', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/mm.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"MM","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-mn', 'Mongolia', 'flags-195-v1/mn.png', 'a652afb9b7031498fb1506bd32e20689383eaf0d370ea2e30f50174d7f9a2805', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/mn.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"MN","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-mr', 'Mauritania', 'flags-195-v1/mr.png', 'cdd3c601a8270cfc9ddc8363976168c681621a97856cec5a43102ddca908c4b3', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/mr.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"MR","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-mt', 'Malta', 'flags-195-v1/mt.png', 'e620783c017afb34c2aea9e5bfda6d4810705e7db11d6743f3fe791f8a1ec829', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/mt.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"MT","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-mu', 'Mauritius', 'flags-195-v1/mu.png', '886273ad53028411fb8aa71aaecc97a199adc86b951dd34775b30c836d6027e4', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/mu.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"MU","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-mv', 'Maldives', 'flags-195-v1/mv.png', '37ed981672ddcba1f12eaf786e735790a4ca5e84f6176daf41e2b3860531c53f', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/mv.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"MV","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-mw', 'Malawi', 'flags-195-v1/mw.png', 'c32f3262934157cabef40efdf1c51ae8dab1bdc71eec7fc5330e0dab78ccec3a', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/mw.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"MW","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-mx', 'Mexico', 'flags-195-v1/mx.png', 'f864d12b22264eda49b16035f5a0e9ab90d2da1954fac1bce8d236688fa71d03', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/mx.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'easy', '{"iso2":"MX","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-my', 'Malaysia', 'flags-195-v1/my.png', 'c5f5fc4baee0e1ed6fe6d43e540b390a5f3e2669c05838a49710eb5a8ea1e74c', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/my.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"MY","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-mz', 'Mozambique', 'flags-195-v1/mz.png', 'bf4feb7952a3f094898ebf9595057be7ba0e813dc10848cecbadb79ad1a59d97', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/mz.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"MZ","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-na', 'Namibia', 'flags-195-v1/na.png', '3ea0f4187b3aedda0bfae9a4d60b2a122d7eec80bcd8c328d8c9a3f2274a846e', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/na.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"NA","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-ne', 'Niger', 'flags-195-v1/ne.png', '451d57f095ff4d707b7f9dd9e98beb04db2f08228a3a778c49e1f876248bd10f', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/ne.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"NE","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-ng', 'Nigeria', 'flags-195-v1/ng.png', 'e906b06383f375b08d7cc3628ac9f724bfd45305a13e747e34689d2ce2b2a0f6', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/ng.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"NG","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-ni', 'Nicaragua', 'flags-195-v1/ni.png', 'a2582379aca56d1ec188141571b0024d19eb52527b439b831c4864048033d017', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/ni.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"NI","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-nl', 'Netherlands', 'flags-195-v1/nl.png', 'f88977dc62bf5c395e61030d5ca063d92e647d7d2ee2417be0948d5ca730093d', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/nl.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'easy', '{"iso2":"NL","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-no', 'Norway', 'flags-195-v1/no.png', 'c82386961fded0d9947ad3320b7ff4c066eea989d082b6409a0815ce0f9a6eb5', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/no.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'easy', '{"iso2":"NO","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-np', 'Nepal', 'flags-195-v1/np.png', 'bdb67489c04447d895e533722b355b2156f83e886cf6f1990e2f74fa92b004fa', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/np.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"NP","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-nr', 'Nauru', 'flags-195-v1/nr.png', '027a68d4e4dd57cc28954da05056a96952deeb5bdae2bd909d45b6b1c21422fa', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/nr.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'hard', '{"iso2":"NR","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-nz', 'New Zealand', 'flags-195-v1/nz.png', '6c12e0fef61ffb57ed4c0818f3e97979ccd82945bb8e1fd9be35aaa5694c2aa1', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/nz.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'easy', '{"iso2":"NZ","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-om', 'Oman', 'flags-195-v1/om.png', 'a20e761c2a913a4635953f18da790e31b6e3dc0fb2cc170cbbd8c40f186088fa', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/om.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"OM","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-pa', 'Panama', 'flags-195-v1/pa.png', '6604bbe3db3b6f334776e30151b0db00ee0588277b936e368779ffabd521800b', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/pa.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"PA","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-pe', 'Peru', 'flags-195-v1/pe.png', '6a1c127a82ed2140bf652903cc1a5dce2acb65ca4ea8a35b5c87a7acdb620765', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/pe.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"PE","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-pg', 'Papua New Guinea', 'flags-195-v1/pg.png', '9b3c54c81695cdcf5ee5b4ad87b68d25ec72f3bf03e63fc89a062a57579c040d', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/pg.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"PG","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-ph', 'Philippines', 'flags-195-v1/ph.png', '9dee1ec70005b721e5dcf0fd101445cc5a93235c45428e688bac4652066029ca', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/ph.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"PH","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-pk', 'Pakistan', 'flags-195-v1/pk.png', '5350bb4f9a830720d788eba5360cafb339ce05fc1d73dd1aeec695d71da0d2b2', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/pk.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"PK","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-pl', 'Poland', 'flags-195-v1/pl.png', '4509085ffc1724a0e2e4e0f5358817395e0a67e6f60e9fab4f44a0c343964f9d', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/pl.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'easy', '{"iso2":"PL","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-ps', 'Palestine', 'flags-195-v1/ps.png', 'b93fc618a32fbf3e77968f31cc8396b318aa203654fbd6ebc3f096f98ae9ad8b', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/ps.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"PS","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-pt', 'Portugal', 'flags-195-v1/pt.png', '82fd05649b3b7db8ebd263fa4bdbfd6140914c1f58a9dd283e653793e9883572', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/pt.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'easy', '{"iso2":"PT","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-pw', 'Palau', 'flags-195-v1/pw.png', 'ccdaef6caccde412b5c2b82cdf6dd452419ef08da381886302faa86ef41057b5', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/pw.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'hard', '{"iso2":"PW","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-py', 'Paraguay', 'flags-195-v1/py.png', 'aeb3fdc3a50d111d078c6597c223c3cbdb57c017c6b40a40d9ffd998830be803', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/py.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"PY","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-qa', 'Qatar', 'flags-195-v1/qa.png', '2fe9499a96d7c19ae2b1f3d0c8f03640d7d5e91605baba4e16571ce014280a27', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/qa.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"QA","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-ro', 'Romania', 'flags-195-v1/ro.png', '32bef8f643c0e915fbff9dfc638318e36f2482bcd519158ebe7493f2aada1550', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/ro.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"RO","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-rs', 'Serbia', 'flags-195-v1/rs.png', '1f595d7030209ad3f6ec740a56fc13fd6260143f84cfd24c7acb223715e8f730', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/rs.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"RS","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-ru', 'Russian Federation', 'flags-195-v1/ru.png', 'c9e652f098f304060fa236956fba8a7126f9b9cd1e57e0fb890670dfc9761caa', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/ru.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'easy', '{"iso2":"RU","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-rw', 'Rwanda', 'flags-195-v1/rw.png', '210682a8a10e4fb4ace1c59d29bbf929f4ca5c40bb56db6fc9a247e4619aa6ec', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/rw.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"RW","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-sa', 'Saudi Arabia', 'flags-195-v1/sa.png', '5c6d98ee715c3133032c3ae0cb861d0d0586c2dd9bcaf9244ab6849bdf087e71', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/sa.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'easy', '{"iso2":"SA","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-sb', 'Solomon Islands', 'flags-195-v1/sb.png', '356157b35e9f3d5bbf50dd8264b8ef7e55b35717fd185a702570d3a74b36d324', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/sb.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'hard', '{"iso2":"SB","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-sc', 'Seychelles', 'flags-195-v1/sc.png', 'd010464e2efdcc62b39db3c32ebd7448adbaca42b986048a3c5f23ccab2dad92', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/sc.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'hard', '{"iso2":"SC","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-sd', 'Sudan', 'flags-195-v1/sd.png', '2144d0c3fdd699b488236892fa9141d0167a2858da00d4dc0fd4eccd54751142', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/sd.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"SD","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-se', 'Sweden', 'flags-195-v1/se.png', 'e03a4bfd3c5b2815760190b840cb17739dc00a8afc57bd8dc77457a382ad7a86', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/se.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'easy', '{"iso2":"SE","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-sg', 'Singapore', 'flags-195-v1/sg.png', 'a8d945087ed73e8b35f50042cd20b6b642152dec88dca08272043b51c66dc381', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/sg.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"SG","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-si', 'Slovenia', 'flags-195-v1/si.png', '99c7810d0894ce75faf5a87ad3cb154ab161c86962b243f28616d48a57b876db', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/si.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"SI","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-sk', 'Slovakia', 'flags-195-v1/sk.png', 'c8baff2fc3766230abc0f24d21a5f3265b238b419f05efec152a8de7ebfa1290', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/sk.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"SK","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-sl', 'Sierra Leone', 'flags-195-v1/sl.png', 'bbce5007efaf8f9a572641626b0030519cc9541bd62bb39262817c766bd139bf', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/sl.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"SL","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-sm', 'San Marino', 'flags-195-v1/sm.png', '123d7bdecef619573fdcac4a2a37f316c0c89e6fe1a3b81fcdb1577eba2c0dea', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/sm.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'hard', '{"iso2":"SM","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-sn', 'Senegal', 'flags-195-v1/sn.png', 'dac7514c01963f48c0cdf3e6d784a35abe0b6bc95b3e81c072cc30189503aec8', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/sn.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"SN","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-so', 'Somalia', 'flags-195-v1/so.png', 'b8eaebee5085cc5563c682058ad8ef727971e641d848da7511ff8fd654811642', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/so.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"SO","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-sr', 'Suriname', 'flags-195-v1/sr.png', '66b9958b049c9d3aa2834f2507a4e33bb33b6bcfad60919fc1f5c70fc66f8436', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/sr.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'hard', '{"iso2":"SR","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-ss', 'South Sudan', 'flags-195-v1/ss.png', '4a6461a6c801ffdc4979ce6012568111b37a1b7ba96d4cbd65730ccbd5419157', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/ss.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"SS","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-st', 'Sao Tome and Principe', 'flags-195-v1/st.png', '2d98024c428cde364b6f96fe319516d148a51ee7ccc0baa0fd48a7fae2905a39', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/st.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'hard', '{"iso2":"ST","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-sv', 'El Salvador', 'flags-195-v1/sv.png', '01e897c30cae92143089c105c7a0c97653fadd0be2613ca98224e3ed1c14330c', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/sv.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"SV","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-sy', 'Syria', 'flags-195-v1/sy.png', 'afecd1cc88707abdefc2cdc7550f45428428e11e1ab96bc19fdb654b254e418e', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/sy.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"SY","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-sz', 'Eswatini', 'flags-195-v1/sz.png', 'd54ec9c1677936cc99ebff3678b7e7426011abc4f7bcc2d4c2f08070b21ed73d', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/sz.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'hard', '{"iso2":"SZ","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-td', 'Chad', 'flags-195-v1/td.png', '883b0dfc4e4edb300f2c608af2bb1cab4176153d029d790eb6973a2604eb6113', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/td.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"TD","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-tg', 'Togo', 'flags-195-v1/tg.png', 'a349f122d2ed895ca8b267e4a48fd41ec0fc3e4b449a25418e06369a00661500', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/tg.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"TG","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-th', 'Thailand', 'flags-195-v1/th.png', '8d3c537835922613e2d819b00180469157282944d096bdf213b122ede468c3d7', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/th.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"TH","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-tj', 'Tajikistan', 'flags-195-v1/tj.png', 'bda8e3f8d3e5cac2072b8202c9de43905d23ffaf772f517361976cb5b61ddf71', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/tj.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"TJ","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-tl', 'Timor-Leste', 'flags-195-v1/tl.png', 'e6dd6a2054b5b68ae29eaf2247bf916c7dc5bfb0da39c62f279de36757b97482', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/tl.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'hard', '{"iso2":"TL","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-tm', 'Turkmenistan', 'flags-195-v1/tm.png', '687649f4e55bb30d636625f8dbeef8079636b52778189a6ce9c029c626ef4936', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/tm.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"TM","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-tn', 'Tunisia', 'flags-195-v1/tn.png', 'cf70064c62898827092bc7bfbd9fa67a65da7e06c9e1bd75e30756dc5fd4442d', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/tn.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"TN","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-to', 'Tonga', 'flags-195-v1/to.png', 'bbfefd6a92cd364874d191f8e64c59882db70b4bec8586d8849f7f8993aa801d', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/to.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'hard', '{"iso2":"TO","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-tr', 'Türkiye', 'flags-195-v1/tr.png', 'f3db6a40259c1d00b8cf7e08d307015c58a1f4d85d1aca6cf3128352b168a152', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/tr.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'easy', '{"iso2":"TR","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-tt', 'Trinidad and Tobago', 'flags-195-v1/tt.png', '5bc782117d3d0b6f05029f3ea56d049970e40e55e56fbb0dd01343bb00bc5643', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/tt.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"TT","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-tv', 'Tuvalu', 'flags-195-v1/tv.png', 'e6f4e7b7cd18a6be063830e9087be0381911a2d992411bfb2e486ed74f09cad7', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/tv.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'hard', '{"iso2":"TV","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-tz', 'Tanzania', 'flags-195-v1/tz.png', 'ea0c1598a662f8b717073decb51c44f8f6e99097c252bf2b6c7a256a79fe59b4', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/tz.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"TZ","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-ua', 'Ukraine', 'flags-195-v1/ua.png', '2bc96fc8fb5cca920e5fb7236fe02d94a805242cdfc3a52fd822b5ce038dcce4', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/ua.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'easy', '{"iso2":"UA","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-ug', 'Uganda', 'flags-195-v1/ug.png', 'cc97b0cb7ed20029f859270d5cbfa1a839bf8720418f4174582fe1ddbab6182e', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/ug.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"UG","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-us', 'United States', 'flags-195-v1/us.png', '5b38ab13f52bc95184012a4b6afafa3eca7a6ac03c762515b4550b4337548ca7', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/us.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'easy', '{"iso2":"US","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-uy', 'Uruguay', 'flags-195-v1/uy.png', 'f81e4b358c556d4b2236b0de545b8faf5762f3ab4ed7fee95715c3fc9acd325c', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/uy.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"UY","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-uz', 'Uzbekistan', 'flags-195-v1/uz.png', '3b9e6dbad80e2fb71ee526ae0b6e3fbffc6b6e0a8926dd4e33af148bd2d7b867', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/uz.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"UZ","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-va', 'Vatican City', 'flags-195-v1/va.png', '24bfa683a9089fee9f00f3a9bc625689ea6f9fcf853a375ea4856c2706270cbf', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/va.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'hard', '{"iso2":"VA","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-vc', 'Saint Vincent and the Grenadines', 'flags-195-v1/vc.png', 'd23e4a917498f7c0f4214d2160939bd388ed1d1c4569c2381ae9984d67962a00', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/vc.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'hard', '{"iso2":"VC","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-ve', 'Venezuela', 'flags-195-v1/ve.png', '943e4b21979c686cda5a6fb5c9912794036a2f93346072e1a139896ca9aa0492', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/ve.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"VE","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-vn', 'Vietnam', 'flags-195-v1/vn.png', '5b4c6f0abe96cb2cfe690bdac3002599f5260ad203c8eaed30a699cd4feba3fb', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/vn.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"VN","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-vu', 'Vanuatu', 'flags-195-v1/vu.png', 'fabfc33c838a801b2d878ba0dff88720645c0fb49c788da46221e5c2e472fc34', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/vu.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'hard', '{"iso2":"VU","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-ws', 'Samoa', 'flags-195-v1/ws.png', 'a354530c6be8ddc0db51d823ea299a79159394043eca609be1c4db509704a9e1', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/ws.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'hard', '{"iso2":"WS","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-ye', 'Yemen', 'flags-195-v1/ye.png', 'b550e2d5ac0003087dd86c42082b5a46dd452816294e76ac62d3a4e93ad8e8e7', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/ye.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"YE","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-za', 'South Africa', 'flags-195-v1/za.png', 'c7c16e79659269734abdf7809d5f3184db140bbad82cbd3f6d5f9193f565a35a', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/za.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'easy', '{"iso2":"ZA","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-zm', 'Zambia', 'flags-195-v1/zm.png', 'cc063de34b78b71c9976c0a5a7f72166b6cd3f60ad980fd9307f02e4ff2d141a', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/zm.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"ZM","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('flags', 'flags-195-v1', 'flag-zw', 'Zimbabwe', 'flags-195-v1/zw.png', '827b17f96e2d9a04354423d7c52e390fb922ac1d4510ded926406777298f1573', 'https://github.com/hampusborgos/country-flags', 'https://unpkg.com/svg-country-flags@1.2.10/png250px/zw.png', 'public_domain_national_symbol', 'hampusborgos/country-flags 1.2.10 (PD)', 'medium', '{"iso2":"ZW","sourceCommit":"c09927e63705529bbf59ca6684cd9b23225dddad"}'::jsonb),
  ('football', 'football-v1', 'football-uefa', 'UEFA', 'football-v1/uefa.png', '6c4457053bae576f1b1c5e7a5c4272d3663189cb842dcc735b48206703b9d2e4', 'https://en.wikipedia.org/wiki/UEFA', 'https://thumb.wikimedia.org/wikipedia/en/thumb/9/9d/UEFA_full_logo.svg/330px-UEFA_full_logo.svg.png', 'trademark_review_required', 'Official identity; source page recorded for editorial quiz use', 'easy', '{"scope":"confederation"}'::jsonb),
  ('football', 'football-v1', 'football-caf', 'CAF', 'football-v1/caf.png', '3bae54dfaea729560439d5f612d78e4f858862155d5caa71dff365b5ebc3354b', 'https://en.wikipedia.org/wiki/Confederation_of_African_Football', 'https://thumb.wikimedia.org/wikipedia/en/thumb/7/72/Confederation_of_African_Football_logo.svg/330px-Confederation_of_African_Football_logo.svg.png', 'trademark_review_required', 'Official identity; source page recorded for editorial quiz use', 'medium', '{"scope":"confederation"}'::jsonb),
  ('football', 'football-v1', 'football-afc', 'AFC', 'football-v1/afc.png', 'b672215adc3fcd752f1c14d730404fba1fc0540b159aa66c94558c0be6fd9756', 'https://en.wikipedia.org/wiki/Asian_Football_Confederation', 'https://thumb.wikimedia.org/wikipedia/en/thumb/2/28/Asian_Football_Confederation_logo_2025.svg/500px-Asian_Football_Confederation_logo_2025.svg.png', 'trademark_review_required', 'Official identity; source page recorded for editorial quiz use', 'medium', '{"scope":"confederation"}'::jsonb),
  ('football', 'football-v1', 'football-concacaf', 'CONCACAF', 'football-v1/concacaf.png', 'c7db0794728da5aa9abd418fd19a053ac7a80de359e01061978b14a413fb1248', 'https://en.wikipedia.org/wiki/CONCACAF', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/87/Concacaf_logo.svg/500px-Concacaf_logo.svg.png', 'trademark_review_required', 'Official identity; source page recorded for editorial quiz use', 'medium', '{"scope":"confederation"}'::jsonb),
  ('football', 'football-v1', 'football-conmebol', 'CONMEBOL', 'football-v1/conmebol.png', '07dc7e3f8aa8f7eba9daba20577d3d1a3854bc5a08f8c0fa7e7f0b2e546fe2e2', 'https://en.wikipedia.org/wiki/CONMEBOL', 'https://thumb.wikimedia.org/wikipedia/en/thumb/a/a8/CONMEBOL_logo_%282017%29.svg/500px-CONMEBOL_logo_%282017%29.svg.png', 'trademark_review_required', 'Official identity; source page recorded for editorial quiz use', 'medium', '{"scope":"confederation"}'::jsonb),
  ('football', 'football-v1', 'football-ofc', 'OFC', 'football-v1/ofc.png', 'e8b6ae0a283b178a83a376a19cec6436356872c334bf67f65bbd3cc26daa6c7e', 'https://en.wikipedia.org/wiki/Oceania_Football_Confederation', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/93/Oceania_Football_Confederation_logo.svg/500px-Oceania_Football_Confederation_logo.svg.png', 'trademark_review_required', 'Official identity; source page recorded for editorial quiz use', 'hard', '{"scope":"confederation"}'::jsonb),
  ('football', 'football-v1', 'football-premier-league', 'English Premier League', 'football-v1/premier-league.png', 'e4c378af86fd34ae8f6e3acaeb5e9225332dc65202e9e4db92e9c84dd87433f0', 'https://en.wikipedia.org/wiki/Premier_League', 'https://thumb.wikimedia.org/wikipedia/en/thumb/f/f2/Premier_League_Logo.svg/500px-Premier_League_Logo.svg.png', 'trademark_review_required', 'Official identity; source page recorded for editorial quiz use', 'easy', '{"scope":"league"}'::jsonb),
  ('football', 'football-v1', 'football-la-liga', 'La Liga', 'football-v1/la-liga.png', '4bda5d49e4ce2556d7092b5bd49883a13bff18a824c78ee3fef41334f1e02541', 'https://en.wikipedia.org/wiki/La_Liga', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/54/LaLiga_EA_Sports_2023_Vertical_Logo.svg/500px-LaLiga_EA_Sports_2023_Vertical_Logo.svg.png', 'trademark_review_required', 'Official identity; source page recorded for editorial quiz use', 'easy', '{"scope":"league"}'::jsonb),
  ('football', 'football-v1', 'football-bundesliga', 'Bundesliga', 'football-v1/bundesliga.png', '623d1d9e873f0944acec2eb9293aa3d73f136d1bab3ff6320235bf620f94c504', 'https://en.wikipedia.org/wiki/Bundesliga', 'https://thumb.wikimedia.org/wikipedia/en/thumb/d/df/Bundesliga_logo_%282017%29.svg/500px-Bundesliga_logo_%282017%29.svg.png', 'trademark_review_required', 'Official identity; source page recorded for editorial quiz use', 'easy', '{"scope":"league"}'::jsonb),
  ('football', 'football-v1', 'football-serie-a', 'Serie A', 'football-v1/serie-a.png', '139a587c23e9549cd8d494900edbb8a62a478f1dd4260fff3e8972d9d8a7e032', 'https://en.wikipedia.org/wiki/Serie_A', 'https://thumb.wikimedia.org/wikipedia/en/thumb/a/ab/Serie_A_ENILIVE_logo.svg/500px-Serie_A_ENILIVE_logo.svg.png', 'trademark_review_required', 'Official identity; source page recorded for editorial quiz use', 'easy', '{"scope":"league"}'::jsonb),
  ('football', 'football-v1', 'football-ligue-1', 'Ligue 1', 'football-v1/ligue-1.png', 'af90bad6043c3b36a8fec67368fbdcd24dac5116bf55068cb5698b0f902c3660', 'https://en.wikipedia.org/wiki/Ligue_1', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7b/Logo_Ligue_1_McDonald%27s_2024.svg/500px-Logo_Ligue_1_McDonald%27s_2024.svg.png', 'trademark_review_required', 'Official identity; source page recorded for editorial quiz use', 'easy', '{"scope":"league"}'::jsonb),
  ('football', 'football-v1', 'football-major-league-soccer', 'Major League Soccer', 'football-v1/major-league-soccer.png', '22f86477526fd080391b998c886871489d3e1e0ec8514fec21246cf49a1ed2b9', 'https://en.wikipedia.org/wiki/Major_League_Soccer', 'https://thumb.wikimedia.org/wikipedia/en/thumb/c/c7/Major_League_Soccer_logo.svg/500px-Major_League_Soccer_logo.svg.png', 'trademark_review_required', 'Official identity; source page recorded for editorial quiz use', 'medium', '{"scope":"league"}'::jsonb),
  ('football', 'football-v1', 'football-liga-mx', 'Liga MX', 'football-v1/liga-mx.png', 'c1e0703a0f908f12c73b056d817df8ded553329f0b936dfb64548cb71a69717b', 'https://en.wikipedia.org/wiki/Liga_MX', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/22/Liga_MX_logo.svg/500px-Liga_MX_logo.svg.png', 'trademark_review_required', 'Official identity; source page recorded for editorial quiz use', 'medium', '{"scope":"league"}'::jsonb),
  ('football', 'football-v1', 'football-brasileirao-serie-a', 'Brasileirão Série A', 'football-v1/brasileirao-serie-a.png', '8b690ce2ec012f34248cfbffcd53e1bb0c1cf43e9fadb0833f2392ef59e00e79', 'https://en.wikipedia.org/wiki/Campeonato_Brasileiro_S%C3%A9rie_A', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2b/Campeonato_Brasileiro_S%C3%A9rie_A_logo_%282024%29.svg/500px-Campeonato_Brasileiro_S%C3%A9rie_A_logo_%282024%29.svg.png', 'trademark_review_required', 'Official identity; source page recorded for editorial quiz use', 'medium', '{"scope":"league"}'::jsonb),
  ('football', 'football-v1', 'football-j1-league', 'J1 League', 'football-v1/j1-league.jpg', '8abc00e4e2631ad5a56b398a565df78a9a93e0635c038909b3c74bfc2d4468a8', 'https://www.antlers.co.jp/blogs/news/260616v8d97u', 'https://www.antlers.co.jp/cdn/shop/articles/pickup_j1_rogo_5b23f6dc-d23b-4e17-bb11-ef5ab1102c24.jpg?v=1781657246&width=1200', 'trademark_review_required', 'Official identity; source page recorded for editorial quiz use', 'hard', '{"scope":"league"}'::jsonb),
  ('football', 'football-v1', 'football-k-league-1', 'K League 1', 'football-v1/k-league-1.png', 'eb42faf2a842ad585cb59b34825c3014124b3e5991695dc3fc23bd5b514af149', 'https://www.kleague.com/about/ci.do', 'https://pub-3bd35431294c47068cbf31a95d572166.r2.dev/logos/k-league-1-south-korea/k-league-1-south-korea-logo-footylogos.png', 'trademark_review_required', 'Official identity; source page recorded for editorial quiz use', 'hard', '{"scope":"league"}'::jsonb),
  ('football', 'football-v1', 'football-saudi-pro-league', 'Saudi Pro League', 'football-v1/saudi-pro-league.png', '3dfd2a32918b89a8ac28aeedd3b8aa2bc054e607c89eb963d70036416251f56e', 'https://commons.wikimedia.org/wiki/File:Saudi_Pro_League_Logo.svg', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/42/Saudi_Pro_League_Logo.svg/500px-Saudi_Pro_League_Logo.svg.png', 'trademark_review_required', 'Official identity; source page recorded for editorial quiz use', 'medium', '{"scope":"league"}'::jsonb)
on conflict (content_version, item_id) do update set
  display_name = excluded.display_name, asset_path = excluded.asset_path, asset_sha256 = excluded.asset_sha256,
  source_page_url = excluded.source_page_url, source_asset_url = excluded.source_asset_url,
  rights_status = excluded.rights_status, attribution = excluded.attribution, difficulty = excluded.difficulty, metadata = excluded.metadata;
-- GENERATED_CONTENT_END

insert into private.quiz_content
  (category_id, content_version, item_id, display_name, asset_path, asset_sha256,
   source_page_url, source_asset_url, rights_status, attribution, difficulty, metadata)
select
  'flags', f.content_version, f.question_id, f.display_name, current.asset_path,
  current.asset_sha256, current.source_page_url, current.source_asset_url,
  current.rights_status, current.attribution, f.difficulty, current.metadata
from private.flag_content f
join private.quiz_content current
  on current.content_version = 'flags-195-v1' and current.item_id = f.question_id
on conflict (content_version, item_id) do nothing;

do $$
begin
  if (select count(*) from private.quiz_content where content_version = 'flags-195-v1') <> 195 then
    raise exception 'flags-195-v1 must contain exactly 195 items';
  end if;
  if (select count(*) from private.quiz_content where content_version = 'football-v1') <> 17 then
    raise exception 'football-v1 must contain exactly 17 items';
  end if;
end;
$$;

alter table private.daily_challenge_rounds add column asset_path text;

update private.daily_challenge_rounds r
set asset_path = 'flags-195-v1/' || r.asset_key || '.png'
from public.daily_challenges c
where c.id = r.challenge_id and c.category_id = 'flags' and r.asset_path is null;

alter table private.daily_challenge_rounds alter column asset_path set not null;
alter table private.daily_challenge_rounds
  add constraint daily_round_asset_path_format check (asset_path ~ '^[a-z0-9][a-z0-9._/-]{1,199}$');

create or replace function private.ensure_daily_challenge(p_category_id text, p_date date)
returns bigint language plpgsql security definer set search_path = '' as $$
declare
  v_challenge_id bigint;
  v_content_version text;
  v_index smallint := 0;
  v_selected record;
  v_options jsonb;
  v_correct_choice uuid;
begin
  select current_content_version into v_content_version
  from public.categories
  where id = p_category_id and is_active;
  if not found then raise exception 'unsupported category'; end if;

  perform pg_advisory_xact_lock(hashtextextended('bloopiq:' || p_category_id || ':' || p_date::text, 0));

  insert into public.daily_challenges (category_id, challenge_date, content_version)
  values (p_category_id, p_date, v_content_version)
  on conflict (category_id, challenge_date) do nothing;

  select id, content_version into strict v_challenge_id, v_content_version
  from public.daily_challenges
  where category_id = p_category_id and challenge_date = p_date;

  if not exists (select 1 from private.daily_challenge_rounds where challenge_id = v_challenge_id) then
    for v_selected in
      select item_id, display_name, asset_path
      from private.quiz_content
      where category_id = p_category_id and content_version = v_content_version
      order by md5(p_date::text || ':' || item_id)
      limit 10
    loop
      with picked as (
        select item_id, display_name
        from private.quiz_content
        where content_version = v_content_version and item_id = v_selected.item_id
        union all
        select item_id, display_name
        from (
          select item_id, display_name
          from private.quiz_content
          where category_id = p_category_id and content_version = v_content_version
            and item_id <> v_selected.item_id
          order by md5(p_date::text || ':' || v_selected.item_id || ':' || item_id)
          limit 3
        ) distractors
      ), tokenized as (
        select item_id, display_name, extensions.gen_random_uuid() as choice_id
        from picked
      )
      select
        jsonb_agg(jsonb_build_object('id', choice_id, 'label', display_name)
          order by md5(p_date::text || ':option:' || v_selected.item_id || ':' || item_id)),
        (array_agg(choice_id) filter (where item_id = v_selected.item_id))[1]
      into v_options, v_correct_choice
      from tokenized;

      insert into private.daily_challenge_rounds
        (challenge_id, question_index, asset_key, asset_path, correct_choice_id, options)
      values (v_challenge_id, v_index, v_selected.item_id, v_selected.asset_path, v_correct_choice, v_options);
      v_index := v_index + 1;
    end loop;
    if v_index <> 10 then raise exception 'content pack must provide at least 10 items'; end if;
  end if;
  return v_challenge_id;
end;
$$;

create or replace function private.round_json(p_challenge_id bigint, p_index smallint)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'index', question_index,
    'roundId', round_id,
    'assetKey', asset_key,
    'assetPath', asset_path,
    'options', options
  )
  from private.daily_challenge_rounds
  where challenge_id = p_challenge_id and question_index = p_index
$$;

create or replace function private.practice_round_json(p_challenge_id bigint, p_index smallint)
returns jsonb language sql stable security definer set search_path = '' as $$
  select private.round_json(p_challenge_id, p_index) || jsonb_build_object(
    'correctChoiceId', correct_choice_id
  )
  from private.daily_challenge_rounds
  where challenge_id = p_challenge_id and question_index = p_index
$$;

create or replace function private.attempt_state(p_attempt_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_attempt public.daily_attempts%rowtype;
  v_challenge public.daily_challenges%rowtype;
  v_rank bigint;
  v_practice jsonb;
begin
  select * into strict v_attempt from public.daily_attempts where id = p_attempt_id;
  select * into strict v_challenge from public.daily_challenges where id = v_attempt.challenge_id;
  if v_attempt.status = 'completed' then
    select position into v_rank from (
      select user_id, rank() over (order by score desc, active_duration_ms asc) as position
      from public.daily_attempts where challenge_id = v_attempt.challenge_id and status = 'completed'
    ) ranked where user_id = v_attempt.user_id;
    select coalesce(jsonb_agg(private.practice_round_json(v_attempt.challenge_id, r.question_index) order by r.question_index), '[]'::jsonb)
      into v_practice from private.daily_challenge_rounds r where r.challenge_id = v_attempt.challenge_id;
  end if;
  return jsonb_build_object(
    'state', v_attempt.status,
    'attemptId', v_attempt.id,
    'categoryId', v_attempt.category_id,
    'challengeDate', v_challenge.challenge_date,
    'contentVersion', v_challenge.content_version,
    'serverNow', clock_timestamp(),
    'resetAt', private.next_utc_reset(),
    'expiresAt', v_attempt.expires_at,
    'questionIndex', v_attempt.current_index,
    'questionStartedAt', v_attempt.question_started_at,
    'questionDeadlineAt', v_attempt.question_started_at + interval '10 seconds',
    'score', v_attempt.score,
    'correctCount', v_attempt.correct_count,
    'answeredCount', v_attempt.current_index,
    'dailyStreak', private.daily_streak(v_attempt.user_id, v_attempt.category_id),
    'rank', v_rank,
    'currentRound', case when v_attempt.status = 'in_progress' then private.round_json(v_attempt.challenge_id, v_attempt.current_index) else null end,
    'practiceRounds', v_practice
  );
end;
$$;

create or replace function public.get_daily_state(p_category_id text default 'flags')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := private.require_user();
  v_challenge_id bigint;
  v_content_version text;
  v_attempt_id uuid;
begin
  v_challenge_id := private.ensure_daily_challenge(p_category_id, private.utc_today());
  select content_version into strict v_content_version from public.daily_challenges where id = v_challenge_id;
  select id into v_attempt_id from public.daily_attempts
  where user_id = v_user and category_id = p_category_id and status = 'in_progress'
  order by started_at desc limit 1 for update;
  if v_attempt_id is not null then
    perform private.advance_expired_question(v_attempt_id);
    if exists (select 1 from public.daily_attempts where id = v_attempt_id and status = 'in_progress') then
      return private.attempt_state(v_attempt_id);
    end if;
  end if;
  select id into v_attempt_id from public.daily_attempts
  where user_id = v_user and challenge_id = v_challenge_id;
  if v_attempt_id is not null then return private.attempt_state(v_attempt_id); end if;
  return jsonb_build_object(
    'state', 'not_started', 'categoryId', p_category_id,
    'challengeDate', private.utc_today(), 'contentVersion', v_content_version,
    'serverNow', clock_timestamp(), 'resetAt', private.next_utc_reset(),
    'score', 0, 'correctCount', 0, 'answeredCount', 0,
    'dailyStreak', private.daily_streak(v_user, p_category_id)
  );
end;
$$;

create or replace function public.submit_daily_answer(
  p_attempt_id uuid,
  p_question_index smallint,
  p_choice_id uuid,
  p_request_id uuid
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := private.require_user();
  v_attempt public.daily_attempts%rowtype;
  v_round private.daily_challenge_rounds%rowtype;
  v_existing public.daily_answers%rowtype;
  v_elapsed bigint;
  v_correct boolean;
  v_correct_label text;
begin
  if p_request_id is null then raise exception 'request id required'; end if;
  select * into strict v_attempt from public.daily_attempts
  where id = p_attempt_id and user_id = v_user for update;

  select * into v_existing from public.daily_answers
  where attempt_id = p_attempt_id and request_id = p_request_id;
  if found then
    select option->>'label' into v_correct_label
    from private.daily_challenge_rounds r, jsonb_array_elements(r.options) option
    where r.challenge_id = v_attempt.challenge_id and r.question_index = v_existing.question_index
      and (option->>'id')::uuid = r.correct_choice_id;
    return private.attempt_state(p_attempt_id) || jsonb_build_object(
      'lastAnswer', jsonb_build_object(
        'questionIndex', v_existing.question_index,
        'isCorrect', v_existing.is_correct,
        'points', v_existing.points,
        'correctChoiceId', (select correct_choice_id from private.daily_challenge_rounds where challenge_id = v_attempt.challenge_id and question_index = v_existing.question_index),
        'correctLabel', v_correct_label
      )
    );
  end if;
  if v_attempt.status <> 'in_progress' then return private.attempt_state(p_attempt_id); end if;
  if clock_timestamp() >= v_attempt.expires_at then
    update public.daily_attempts set status = 'expired', completed_at = clock_timestamp() where id = p_attempt_id;
    return private.attempt_state(p_attempt_id);
  end if;
  if p_question_index <> v_attempt.current_index then raise exception 'unexpected question index' using errcode = '22023'; end if;
  select * into strict v_round from private.daily_challenge_rounds
  where challenge_id = v_attempt.challenge_id and question_index = v_attempt.current_index;
  if p_choice_id is not null and not exists (
    select 1 from jsonb_array_elements(v_round.options) option where (option->>'id')::uuid = p_choice_id
  ) then raise exception 'invalid choice' using errcode = '22023'; end if;

  select option->>'label' into strict v_correct_label
  from jsonb_array_elements(v_round.options) option
  where (option->>'id')::uuid = v_round.correct_choice_id;
  v_elapsed := greatest(0, floor(extract(epoch from (clock_timestamp() - v_attempt.question_started_at)) * 1000)::bigint);
  v_correct := p_choice_id is not null and p_choice_id = v_round.correct_choice_id and v_elapsed <= 10000;

  insert into public.daily_answers
    (attempt_id, question_index, request_id, choice_id, is_correct, points, elapsed_ms)
  values (p_attempt_id, p_question_index, p_request_id, p_choice_id, v_correct,
    case when v_correct then 100 else 0 end, least(v_elapsed, 10000)::integer);

  if v_attempt.current_index = 9 then
    update public.daily_attempts set status = 'completed', current_index = 10,
      score = score + case when v_correct then 100 else 0 end,
      correct_count = correct_count + case when v_correct then 1 else 0 end,
      active_duration_ms = active_duration_ms + least(v_elapsed, 10000),
      completed_at = clock_timestamp()
    where id = p_attempt_id and status = 'in_progress';
  else
    update public.daily_attempts set current_index = current_index + 1,
      score = score + case when v_correct then 100 else 0 end,
      correct_count = correct_count + case when v_correct then 1 else 0 end,
      active_duration_ms = active_duration_ms + least(v_elapsed, 10000),
      question_started_at = clock_timestamp() + interval '750 milliseconds'
    where id = p_attempt_id and status = 'in_progress';
  end if;
  return private.attempt_state(p_attempt_id) || jsonb_build_object(
    'lastAnswer', jsonb_build_object(
      'questionIndex', p_question_index,
      'isCorrect', v_correct,
      'points', case when v_correct then 100 else 0 end,
      'correctChoiceId', v_round.correct_choice_id,
      'correctLabel', v_correct_label
    )
  );
end;
$$;

revoke all on all functions in schema private from public, anon, authenticated;
