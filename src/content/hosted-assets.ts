export const footballAssetPaths = [
  'football-v1/afc.png',
  'football-v1/brasileirao-serie-a.png',
  'football-v1/bundesliga.png',
  'football-v1/caf.png',
  'football-v1/concacaf.png',
  'football-v1/conmebol.png',
  'football-v1/j1-league.jpg',
  'football-v1/k-league-1.png',
  'football-v1/la-liga.png',
  'football-v1/liga-mx.png',
  'football-v1/ligue-1.png',
  'football-v1/major-league-soccer.png',
  'football-v1/ofc.png',
  'football-v1/premier-league.png',
  'football-v1/saudi-pro-league.png',
  'football-v1/serie-a.png',
  'football-v1/uefa.png',
] as const;

export const baseballAssetPaths = [
  'baseball-mlb-v1/arizona-diamondbacks.svg',
  'baseball-mlb-v1/athletics.svg',
  'baseball-mlb-v1/atlanta-braves.svg',
  'baseball-mlb-v1/baltimore-orioles.svg',
  'baseball-mlb-v1/boston-red-sox.svg',
  'baseball-mlb-v1/chicago-cubs.svg',
  'baseball-mlb-v1/chicago-white-sox.svg',
  'baseball-mlb-v1/cincinnati-reds.svg',
  'baseball-mlb-v1/cleveland-guardians.svg',
  'baseball-mlb-v1/colorado-rockies.svg',
  'baseball-mlb-v1/detroit-tigers.svg',
  'baseball-mlb-v1/houston-astros.svg',
  'baseball-mlb-v1/kansas-city-royals.svg',
  'baseball-mlb-v1/los-angeles-angels.svg',
  'baseball-mlb-v1/los-angeles-dodgers.svg',
  'baseball-mlb-v1/miami-marlins.svg',
  'baseball-mlb-v1/milwaukee-brewers.svg',
  'baseball-mlb-v1/minnesota-twins.svg',
  'baseball-mlb-v1/new-york-mets.svg',
  'baseball-mlb-v1/new-york-yankees.svg',
  'baseball-mlb-v1/philadelphia-phillies.svg',
  'baseball-mlb-v1/pittsburgh-pirates.svg',
  'baseball-mlb-v1/san-diego-padres.svg',
  'baseball-mlb-v1/san-francisco-giants.svg',
  'baseball-mlb-v1/seattle-mariners.svg',
  'baseball-mlb-v1/st-louis-cardinals.svg',
  'baseball-mlb-v1/tampa-bay-rays.svg',
  'baseball-mlb-v1/texas-rangers.svg',
  'baseball-mlb-v1/toronto-blue-jays.svg',
  'baseball-mlb-v1/washington-nationals.svg',
] as const;

export const basketballAssetPaths = [
  'basketball-nba-v1/atlanta-hawks.svg',
  'basketball-nba-v1/boston-celtics.svg',
  'basketball-nba-v1/brooklyn-nets.svg',
  'basketball-nba-v1/charlotte-hornets.svg',
  'basketball-nba-v1/chicago-bulls.svg',
  'basketball-nba-v1/cleveland-cavaliers.svg',
  'basketball-nba-v1/dallas-mavericks.svg',
  'basketball-nba-v1/denver-nuggets.svg',
  'basketball-nba-v1/detroit-pistons.svg',
  'basketball-nba-v1/golden-state-warriors.svg',
  'basketball-nba-v1/houston-rockets.svg',
  'basketball-nba-v1/indiana-pacers.svg',
  'basketball-nba-v1/la-clippers.svg',
  'basketball-nba-v1/los-angeles-lakers.svg',
  'basketball-nba-v1/memphis-grizzlies.svg',
  'basketball-nba-v1/miami-heat.svg',
  'basketball-nba-v1/milwaukee-bucks.svg',
  'basketball-nba-v1/minnesota-timberwolves.svg',
  'basketball-nba-v1/new-orleans-pelicans.svg',
  'basketball-nba-v1/new-york-knicks.svg',
  'basketball-nba-v1/oklahoma-city-thunder.svg',
  'basketball-nba-v1/orlando-magic.svg',
  'basketball-nba-v1/philadelphia-76ers.svg',
  'basketball-nba-v1/phoenix-suns.svg',
  'basketball-nba-v1/portland-trail-blazers.svg',
  'basketball-nba-v1/sacramento-kings.svg',
  'basketball-nba-v1/san-antonio-spurs.svg',
  'basketball-nba-v1/toronto-raptors.svg',
  'basketball-nba-v1/utah-jazz.svg',
  'basketball-nba-v1/washington-wizards.svg',
] as const;

const flagCodes = `
AD AE AF AG AL AM AO AR AT AU AZ BA BB BD BE BF BG BH BI BJ BN BO BR BS BT BW BY BZ
CA CD CF CG CH CI CL CM CN CO CR CU CV CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ
FM FR GA GB GD GE GH GM GN GQ GR GT GW GY HN HR HT HU ID IE IL IN IQ IR IS IT JM JO JP
KE KG KH KI KM KN KP KR KW KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MH MK ML
MM MN MR MT MU MV MW MX MY MZ NA NE NG NI NL NO NP NR NZ OM PA PE PG PH PK PL PS PT PW
PY QA RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SY SZ TD TG TH TJ TL TM
TN TO TR TT TV TZ UA UG US UY UZ VA VC VE VN VU WS YE ZA ZM ZW
`.trim().toLowerCase().split(/\s+/);

export const flagAssetPaths = flagCodes.map((code) => `flags-195-v1/${code}.png`);

export const hostedAssetPathsByQuiz = {
  flags: flagAssetPaths,
  football: footballAssetPaths,
  baseball: baseballAssetPaths,
  basketball: basketballAssetPaths,
} as const;
