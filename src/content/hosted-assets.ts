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
