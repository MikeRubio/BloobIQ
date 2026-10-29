export const winterBaseballLeagues = [
  {
    key: 'lidom',
    name: 'LIDOM',
    officialName: 'Liga de Beisbol Dominicano',
    country: 'Dominican Republic',
    leagueId: 131,
    season: '2026/27',
    sourcePageUrl: 'https://lidom.com/estadisticas_v2-0/equipos/',
    teams: [
      ['aguilas-cibaenas', 667, 'Aguilas Cibaenas', 'Águilas Cibaeñas'],
      ['toros-del-este', 668, 'Toros del Este', 'Toros del Este'],
      ['estrellas-orientales', 669, 'Estrellas Orientales', 'Estrellas Orientales'],
      ['gigantes-del-cibao', 670, 'Gigantes del Cibao', 'Gigantes del Cibao'],
      ['leones-del-escogido', 671, 'Leones del Escogido', 'Leones del Escogido'],
      ['tigres-del-licey', 672, 'Tigres del Licey', 'Tigres del Licey'],
    ],
  },
  {
    key: 'lvbp',
    name: 'LVBP',
    officialName: 'Liga Venezuela Beisbol Profesional',
    country: 'Venezuela',
    leagueId: 135,
    season: '2026/27',
    sourcePageUrl: 'https://stats.lvbp.com/equipos.php',
    teams: [
      ['aguilas-del-zulia', 692, 'Aguilas del Zulia', 'Águilas del Zulia'],
      ['cardenales-de-lara', 693, 'Cardenales de Lara', 'Cardenales de Lara'],
      ['caribes-de-anzoategui', 694, 'Caribes de Anzoategui', 'Caribes de Anzoátegui'],
      ['leones-del-caracas', 695, 'Leones del Caracas', 'Leones del Caracas'],
      ['navegantes-del-magallanes', 696, 'Navegantes del Magallanes', 'Navegantes del Magallanes'],
      ['bravos-de-margarita', 697, 'Bravos de Margarita', 'Bravos de Margarita'],
      ['tiburones-de-la-guaira', 698, 'Tiburones de La Guaira', 'Tiburones de La Guaira'],
      ['tigres-de-aragua', 699, 'Tigres de Aragua', 'Tigres de Aragua'],
    ],
  },
  {
    key: 'lmp',
    name: 'Liga Mexicana del Pacífico',
    officialName: 'Liga Mexicana del Pacifico',
    country: 'Mexico',
    leagueId: 132,
    season: '2026/27',
    sourcePageUrl: 'https://www.lmp.mx/',
    teams: [
      ['aguilas-de-mexicali', 673, 'Aguilas de Mexicali', 'Águilas de Mexicali'],
      ['charros-de-jalisco', 674, 'Charros de Jalisco', 'Charros de Jalisco'],
      ['jaguares-de-nayarit', 6483, 'Jaguares de Nayarit', 'Jaguares de Nayarit'],
      ['caneros-de-los-mochis', 675, 'Caneros de los Mochis', 'Cañeros de Los Mochis'],
      ['mayos-de-navojoa', 676, 'Mayos de Navojoa', 'Mayos de Navojoa'],
      ['naranjeros-de-hermosillo', 677, 'Naranjeros de Hermosillo', 'Naranjeros de Hermosillo'],
      ['tomateros-de-culiacan', 678, 'Tomateros de Culiacan', 'Tomateros de Culiacán'],
      ['venados-de-mazatlan', 679, 'Venados de Mazatlan', 'Venados de Mazatlán'],
      ['yaquis-de-obregon', 680, 'Yaquis de Obregon', 'Yaquis de Obregón'],
      ['algodoneros-de-guasave', 5482, 'Algodoneros de Guasave', 'Algodoneros de Guasave'],
    ],
  },
];

export const winterBaseballTeams = winterBaseballLeagues.flatMap((league) =>
  league.teams.map(([slug, officialTeamId, apiName, displayName]) => ({
    slug,
    officialTeamId,
    apiName,
    displayName,
    leagueKey: league.key,
    league: league.name,
    officialLeagueName: league.officialName,
    leagueId: league.leagueId,
    country: league.country,
    season: league.season,
    sourcePageUrl: league.sourcePageUrl,
  })),
);

export function sameWinterLeagueDistractors(team) {
  return winterBaseballTeams
    .filter((candidate) => candidate.leagueKey === team.leagueKey && candidate.slug !== team.slug)
    .map((candidate) => `baseball-${candidate.leagueKey}-${candidate.slug}`);
}
