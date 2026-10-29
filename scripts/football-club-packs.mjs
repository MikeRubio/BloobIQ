const premierLeaguePage = 'https://www.premierleague.com/en/clubs?se=8';
const laLigaPage = 'https://www.laliga.com/laliga-easports/clubes';
const mlsPage = 'https://www.mlssoccer.com/clubs/';
const bundesligaPage = 'https://www.bundesliga.com/de/bundesliga/clubs?firsttab=kader';

const premierLeague = [
  ['arsenal', 'Arsenal', 3],
  ['aston-villa', 'Aston Villa', 7],
  ['afc-bournemouth', 'AFC Bournemouth', 91, 'Bournemouth'],
  ['brentford', 'Brentford', 94],
  ['brighton-and-hove-albion', 'Brighton & Hove Albion', 36, 'Brighton and Hove Albion'],
  ['chelsea', 'Chelsea', 8],
  ['coventry-city', 'Coventry City', 9],
  ['crystal-palace', 'Crystal Palace', 31],
  ['everton', 'Everton', 11],
  ['fulham', 'Fulham', 54],
  ['hull-city', 'Hull City', 88],
  ['ipswich-town', 'Ipswich Town', 40],
  ['leeds-united', 'Leeds United', 2],
  ['liverpool', 'Liverpool', 14],
  ['manchester-city', 'Manchester City', 43],
  ['manchester-united', 'Manchester United', 1],
  ['newcastle-united', 'Newcastle United', 4],
  ['nottingham-forest', 'Nottingham Forest', 17],
  ['sunderland', 'Sunderland', 56],
  ['tottenham-hotspur', 'Tottenham Hotspur', 6],
].map(([slug, displayName, id, directoryName = displayName]) => ({
  slug,
  displayName,
  directoryName,
  officialTeamId: String(id),
  competition: 'Premier League',
  competitionKey: 'premier-league',
  season: '2026/27',
  sourcePageUrl: premierLeaguePage,
  sourceAssetUrl: `https://resources.premierleague.com/premierleague25/badges/${id}.svg`,
}));

const laLiga = [
  ['athletic-club', 'Athletic Club', 'https://assets.laliga.com/assets/2019/06/07/xlarge/athletic.png'],
  ['atletico-de-madrid', 'Atlético de Madrid', 'https://assets.laliga.com/assets/2024/06/17/xlarge/cbc5c8cc8c3e8abd0e175c00ee53b723.png'],
  ['ca-osasuna', 'CA Osasuna', 'https://assets.laliga.com/assets/2019/06/07/xlarge/osasuna.png'],
  ['celta', 'Celta', 'https://assets.laliga.com/assets/2025/07/11/xlarge/0a796827f9e758d7d750db805adde7c5.png'],
  ['deportivo-alaves', 'Deportivo Alavés', 'https://assets.laliga.com/assets/2020/09/01/xlarge/27002754a98bf535807fe49a24cc63ea.png'],
  ['elche-cf', 'Elche CF', 'https://assets.laliga.com/assets/2019/06/07/xlarge/elche.png'],
  ['fc-barcelona', 'FC Barcelona', 'https://assets.laliga.com/assets/2019/06/07/xlarge/barcelona.png'],
  ['getafe-cf', 'Getafe CF', 'https://assets.laliga.com/assets/2023/05/12/xlarge/dc59645c96bc2c9010341c16dd6d4bfa.png'],
  ['levante-ud', 'Levante UD', 'https://assets.laliga.com/assets/2019/06/07/xlarge/levante.png'],
  ['malaga-cf', 'Málaga CF', 'https://assets.laliga.com/assets/2019/06/07/xlarge/malaga.png'],
  ['racing-santander', 'R. Racing Club', 'https://assets.laliga.com/assets/2019/06/07/xlarge/racing.png'],
  ['rayo-vallecano', 'Rayo Vallecano', 'https://assets.laliga.com/assets/2023/04/27/xlarge/57d9950a8745ead226c04d37235c0786.png'],
  ['rc-deportivo', 'RC Deportivo', 'https://assets.laliga.com/assets/2026/06/24/xlarge/6b88661529a2c06840c8bf6bddd90970.png'],
  ['rcd-espanyol', 'RCD Espanyol de Barcelona', 'https://assets.laliga.com/assets/2025/07/02/xlarge/e9177f6edd72c6360602adbca85e442f.png'],
  ['real-betis', 'Real Betis', 'https://assets.laliga.com/assets/2022/09/15/xlarge/e4a09419d3bd115b8f3dab73d480e146.png'],
  ['real-madrid', 'Real Madrid', 'https://assets.laliga.com/assets/2019/06/07/xlarge/real-madrid.png'],
  ['real-sociedad', 'Real Sociedad', 'https://assets.laliga.com/assets/2019/06/07/xlarge/real-sociedad.png'],
  ['sevilla-fc', 'Sevilla FC', 'https://assets.laliga.com/assets/2019/06/07/xlarge/sevilla.png'],
  ['valencia-cf', 'Valencia CF', 'https://assets.laliga.com/assets/2019/06/07/xlarge/valencia.png'],
  ['villarreal-cf', 'Villarreal CF', 'https://assets.laliga.com/assets/2019/06/07/xlarge/villarreal.png'],
].map(([slug, displayName, sourceAssetUrl]) => ({
  slug,
  displayName,
  directoryName: displayName,
  competition: 'La Liga',
  competitionKey: 'la-liga',
  season: '2026/27',
  sourcePageUrl: laLigaPage,
  sourceAssetUrl,
}));

const mls = [
  ['atlanta-united', 'Atlanta United', 'https://images.mlssoccer.com/image/upload/t_club_logo_medium/v1775849066/assets/mnp/Club_Logo-Atlanta_ugeyc3_hw47tg.png'],
  ['austin-fc', 'Austin FC', 'https://images.mlssoccer.com/image/upload/t_club_logo_medium/v1747499975/assets/logos/mls-clubs/Club_Logo-Austin_pa9xtu.png'],
  ['charlotte-fc', 'Charlotte FC', 'https://images.mlssoccer.com/image/upload/t_club_logo_medium/v1747500045/assets/logos/mls-clubs/Club_Logo-Charlotte_p7sznf.png'],
  ['chicago-fire-fc', 'Chicago Fire FC', 'https://images.mlssoccer.com/image/upload/t_club_logo_medium/v1747500178/assets/logos/mls-clubs/Club_Logo-Chicago_jm2yev.png'],
  ['fc-cincinnati', 'FC Cincinnati', 'https://images.mlssoccer.com/image/upload/t_club_logo_medium/v1747500249/assets/logos/mls-clubs/Club_Logo-Cincinnati_jwgkps.png'],
  ['colorado-rapids', 'Colorado Rapids', 'https://images.mlssoccer.com/image/upload/t_club_logo_medium/v1789610429/assets/mnp/club-logos/Club_Logo-Colorado_n5kpss_gctwls.png'],
  ['columbus-crew', 'Columbus Crew', 'https://images.mlssoccer.com/image/upload/t_club_logo_medium/v1789610472/assets/mnp/club-logos/Club_Logo-Columbus_light_z3eq8l_riisbt.png'],
  ['dc-united', 'D.C. United', 'https://images.mlssoccer.com/image/upload/t_club_logo_medium/v1747500504/assets/logos/mls-clubs/Club_Logo-D.C_t03ekm.png'],
  ['fc-dallas', 'FC Dallas', 'https://images.mlssoccer.com/image/upload/t_club_logo_medium/v1747500567/assets/logos/mls-clubs/Club_Logo-Dallas_sysmtj.png'],
  ['houston-dynamo-fc', 'Houston Dynamo FC', 'https://images.mlssoccer.com/image/upload/t_club_logo_medium/v1747500939/assets/logos/mls-clubs/Club_Logo-Houston_oifm77.png'],
  ['sporting-kansas-city', 'Sporting Kansas City', 'https://images.mlssoccer.com/image/upload/t_club_logo_medium/v1747754918/assets/logos/mls-clubs/Club_Logo-Kansas_City_cnhd75.png'],
  ['la-galaxy', 'LA Galaxy', 'https://images.mlssoccer.com/image/upload/t_club_logo_medium/v1747755165/assets/logos/mls-clubs/Club_Logo-LA_Galaxy_fg0wjp.png'],
  ['los-angeles-fc', 'Los Angeles Football Club', 'https://images.mlssoccer.com/image/upload/t_club_logo_medium/v1747755309/assets/logos/mls-clubs/Club_Logo-LAFC_djrhru.png'],
  ['inter-miami-cf', 'Inter Miami CF', 'https://images.mlssoccer.com/image/upload/t_club_logo_medium/v1747755405/assets/logos/mls-clubs/Club_Logo-Miami_tyqe64.png'],
  ['minnesota-united-fc', 'Minnesota United FC', 'https://images.mlssoccer.com/image/upload/t_club_logo_medium/v1747754826/assets/logos/mls-clubs/Club_Logo-Minnesota_ftweor.png'],
  ['cf-montreal', 'CF Montréal', 'https://images.mlssoccer.com/image/upload/t_club_logo_medium/v1747755806/assets/logos/mls-clubs/Club_Logo-Montreal_beeqnh.png'],
  ['nashville-sc', 'Nashville SC', 'https://images.mlssoccer.com/image/upload/t_club_logo_medium/v1747755999/assets/logos/mls-clubs/Club_Logo-Nashville_rb9vwu.png'],
  ['new-england-revolution', 'New England Revolution', 'https://images.mlssoccer.com/image/upload/t_club_logo_medium/v1766020750/assets/NE_Logo_PRI_FC_RGB_480x480_fdx2us.png'],
  ['red-bull-new-york', 'Red Bull New York', 'https://images.mlssoccer.com/image/upload/t_club_logo_medium/v1779382319/assets/logos/mls-clubs/RBNY_Logo_v7jpkq.png'],
  ['new-york-city-fc', 'New York City Football Club', 'https://images.mlssoccer.com/image/upload/t_club_logo_medium/v1747756306/assets/logos/mls-clubs/Club_Logo-New_York_City_xu6vax.png'],
  ['orlando-city', 'Orlando City', 'https://images.mlssoccer.com/image/upload/t_club_logo_medium/v1747769281/assets/logos/mls-clubs/Club_Logo-Orlando_ryyn7a.png'],
  ['philadelphia-union', 'Philadelphia Union', 'https://images.mlssoccer.com/image/upload/t_club_logo_medium/v1747769446/assets/logos/mls-clubs/Club_Logo-Philadelphia_im7pqg.png'],
  ['portland-timbers', 'Portland Timbers', 'https://images.mlssoccer.com/image/upload/t_club_logo_medium/v1747769540/assets/logos/mls-clubs/Club_Logo-Portland_qihpaz.png'],
  ['real-salt-lake', 'Real Salt Lake', 'https://images.mlssoccer.com/image/upload/t_club_logo_medium/v1747776403/assets/logos/mls-clubs/Club_Logo-Salt_Lake_City_hpvde5.png'],
  ['san-diego-fc', 'San Diego FC', 'https://images.mlssoccer.com/image/upload/t_club_logo_medium/v1748261519/assets/logos/mls-clubs/Club_Logo-San_Diego_nwpyul.png'],
  ['san-jose-earthquakes', 'San Jose Earthquakes', 'https://images.mlssoccer.com/image/upload/t_club_logo_medium/v1748262048/assets/logos/mls-clubs/Club_Logo-San_Jose_opzlmo.png'],
  ['seattle-sounders-fc', 'Seattle Sounders FC', 'https://images.mlssoccer.com/image/upload/t_club_logo_medium/v1748265125/assets/logos/mls-clubs/Club_Logo-Seattle_e6jk2x.png'],
  ['st-louis-city-sc', 'St. Louis CITY SC', 'https://images.mlssoccer.com/image/upload/t_club_logo_medium/v1747771858/assets/logos/mls-clubs/Club_Logo-Saint_Louis_guz12c.png'],
  ['toronto-fc', 'Toronto FC', 'https://images.mlssoccer.com/image/upload/t_club_logo_medium/v1748265251/assets/logos/mls-clubs/Club_Logo-Toronto_vz6hao.png'],
  ['vancouver-whitecaps-fc', 'Vancouver Whitecaps FC', 'https://images.mlssoccer.com/image/upload/t_club_logo_medium/v1748265547/assets/logos/mls-clubs/Club_Logo-Vancouver_ao9phl.png'],
].map(([slug, displayName, directoryAssetUrl]) => ({
  slug,
  displayName,
  directoryName: displayName,
  competition: 'Major League Soccer',
  competitionKey: 'mls',
  season: '2026',
  sourcePageUrl: mlsPage,
  directoryAssetUrl,
  sourceAssetUrl: directoryAssetUrl.replace('/image/upload/t_club_logo_medium/', '/image/upload/f_png,w_1000/'),
}));

const bundesliga = [
  ['fc-augsburg', 'FC Augsburg', 'DFL-CLU-000010'],
  ['union-berlin', '1. FC Union Berlin', 'DFL-CLU-00000V'],
  ['werder-bremen', 'SV Werder Bremen', 'DFL-CLU-00000E'],
  ['borussia-dortmund', 'Borussia Dortmund', 'DFL-CLU-000007'],
  ['sv-elversberg', 'SV Elversberg', 'DFL-CLU-000N6L'],
  ['eintracht-frankfurt', 'Eintracht Frankfurt', 'DFL-CLU-00000F'],
  ['sc-freiburg', 'Sport-Club Freiburg', 'DFL-CLU-00000A'],
  ['hamburger-sv', 'Hamburger SV', 'DFL-CLU-00000C'],
  ['tsg-hoffenheim', 'TSG Hoffenheim', 'DFL-CLU-000002'],
  ['fc-koln', '1. FC Köln', 'DFL-CLU-000008'],
  ['rb-leipzig', 'RB Leipzig', 'DFL-CLU-000017'],
  ['bayer-leverkusen', 'Bayer 04 Leverkusen', 'DFL-CLU-00000B'],
  ['mainz-05', '1. FSV Mainz 05', 'DFL-CLU-000006'],
  ['borussia-monchengladbach', 'Borussia Mönchengladbach', 'DFL-CLU-000004'],
  ['bayern-munich', 'FC Bayern München', 'DFL-CLU-00000G'],
  ['sc-paderborn-07', 'SC Paderborn 07', 'DFL-CLU-00000L'],
  ['schalke-04', 'FC Schalke 04', 'DFL-CLU-000009'],
  ['vfb-stuttgart', 'VfB Stuttgart', 'DFL-CLU-00000D'],
].map(([slug, displayName, id]) => ({
  slug,
  displayName,
  directoryName: displayName,
  officialTeamId: id,
  competition: 'Bundesliga',
  competitionKey: 'bundesliga',
  season: '2026/27',
  sourcePageUrl: bundesligaPage,
  sourceAssetUrl: `https://www.bundesliga.com/assets/clublogo/${id}.svg`,
}));

export const footballClubTeams = [...premierLeague, ...laLiga, ...mls, ...bundesliga];

export const footballClubCounts = {
  'premier-league': premierLeague.length,
  'la-liga': laLiga.length,
  mls: mls.length,
  bundesliga: bundesliga.length,
};

const footballClubsByKey = new Map(footballClubTeams.map((team) => [`${team.competitionKey}/${team.slug}`, team]));

export const footballClubVariants = [
  ['premier-league', 'brighton-and-hove-albion', [0.18, 0.28, 0.64, 0.44], 'Crop to the seagull symbol inside the club-name ring.'],
  ['premier-league', 'chelsea', [0.25, 0.2, 0.5, 0.6], 'Crop to the central lion, staff, and ball symbol inside the club-name ring.'],
  ['premier-league', 'manchester-city', [0.23, 0.25, 0.54, 0.5], 'Crop to the ship and red-rose symbol inside the club-name ring.'],
  ['premier-league', 'nottingham-forest', [0.1, 0.02, 0.8, 0.68], 'Crop to the tree and river symbol above the FOREST wordmark.'],
  ['premier-league', 'tottenham-hotspur', [0.1, 0, 0.8, 0.72], 'Crop to the cockerel above the football containing THFC initials.'],

  ['la-liga', 'atletico-de-madrid', [0, 0, 1, 1], 'Use the official bear, tree, stars, and stripes crest, which contains no club wordmark.'],
  ['la-liga', 'celta', [0.05, 0, 0.9, 1], 'Keep the cross-and-shield symbol while trimming transparent margins.'],
  ['la-liga', 'fc-barcelona', [0.25, 0.6, 0.5, 0.32], 'Crop to the ball and blaugrana stripes below the FCB initials.'],
  ['la-liga', 'real-sociedad', [0, 0.05, 1, 0.9], 'Use the official crowned ball-and-flag crest, which contains no club wordmark.'],
  ['la-liga', 'valencia-cf', [0.15, 0, 0.7, 0.3], 'Crop to the black bat above the VALENCIA C.F. banner.'],

  ['mls', 'austin-fc', [0.2, 0.25, 0.6, 0.34], 'Crop to the green oak-tree symbol between the AUSTIN and FC lettering.'],
  ['mls', 'minnesota-united-fc', [0.18, 0.14, 0.64, 0.62], 'Crop to the loon and wing symbol above the MNUFC wordmark.'],
  ['mls', 'orlando-city', [0.18, 0.1, 0.64, 0.55], 'Crop to the gold lion-and-sun symbol above the ORLANDO CITY wordmark.'],
  ['mls', 'portland-timbers', [0, 0, 1, 1], 'Use the official axe-and-chevrons crest, which contains no club wordmark.'],
  ['mls', 'seattle-sounders-fc', [0, 0, 1, 1], 'Use the official Space Needle shield, which contains no club wordmark or initials.'],

  ['bundesliga', 'fc-augsburg', [0.25, 0.48, 0.5, 0.28], 'Crop to the pinecone symbol between the FCA and 1907 lettering.'],
  ['bundesliga', 'sc-freiburg', [0, 0, 0.58, 0.58], 'Crop to the griffin-head symbol above the SCF initials.'],
  ['bundesliga', 'rb-leipzig', [0.03, 0, 0.94, 0.48], 'Crop to the two bulls and football above the RB LEIPZIG wordmark.'],
  ['bundesliga', 'bayern-munich', [0.36, 0.36, 0.28, 0.28], 'Crop to the blue-and-white lozenge field inside the club-name ring.'],
  ['bundesliga', 'vfb-stuttgart', [0.12, 0.64, 0.76, 0.32], 'Crop to the red-and-black antler shield below the VfB and 1893 lettering.'],
].map(([competitionKey, slug, crop, editRecipe]) => {
  const team = footballClubsByKey.get(`${competitionKey}/${slug}`);
  if (!team) throw new Error(`Unknown Football club variant ${competitionKey}/${slug}`);
  return { ...team, crop, editRecipe };
});

export function sameCompetitionDistractors(team, candidates = footballClubVariants) {
  return candidates
    .filter((candidate) => candidate.competitionKey === team.competitionKey && candidate.slug !== team.slug)
    .map((candidate) => `football-club-${candidate.competitionKey}-${candidate.slug}`);
}
