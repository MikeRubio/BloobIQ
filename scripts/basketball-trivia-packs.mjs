const mascotSource = 'https://www.nba.com/news/nba-team-mascots';
const arenaSource = 'https://www.nba.com/news/all-30-nba-arenas-by-team';

const mascots = [
  ['atlanta-hawks', 'Harry the Hawk'],
  ['boston-celtics', 'Lucky the Leprechaun'],
  ['charlotte-hornets', 'Hugo the Hornet'],
  ['chicago-bulls', 'Benny the Bull'],
  ['cleveland-cavaliers', 'Moondog'],
  ['denver-nuggets', 'Rocky'],
  ['houston-rockets', 'Clutch the Bear'],
  ['milwaukee-bucks', 'Bango'],
  ['oklahoma-city-thunder', 'Rumble the Bison'],
  ['orlando-magic', 'Stuff the Magic Dragon'],
  ['phoenix-suns', 'The Gorilla'],
  ['san-antonio-spurs', 'Coyote'],
];

const arenas = [
  ['atlanta-hawks', 'State Farm Arena'],
  ['boston-celtics', 'TD Garden'],
  ['brooklyn-nets', 'Barclays Center'],
  ['charlotte-hornets', 'Spectrum Center'],
  ['chicago-bulls', 'United Center'],
  ['dallas-mavericks', 'American Airlines Center'],
  ['denver-nuggets', 'Ball Arena'],
  ['golden-state-warriors', 'Chase Center'],
  ['houston-rockets', 'Toyota Center'],
  ['indiana-pacers', 'Gainbridge Fieldhouse'],
  ['la-clippers', 'Intuit Dome'],
  ['los-angeles-lakers', 'Crypto.com Arena'],
];

const retiredLegends = [
  ['boston-celtics', 'Larry Bird', 'No. 33'],
  ['chicago-bulls', 'Michael Jordan', 'No. 23'],
  ['dallas-mavericks', 'Dirk Nowitzki', 'No. 41'],
  ['denver-nuggets', 'Alex English', 'No. 2'],
  ['detroit-pistons', 'Isiah Thomas', 'No. 11'],
  ['houston-rockets', 'Hakeem Olajuwon', 'No. 34'],
  ['indiana-pacers', 'Reggie Miller', 'No. 31'],
  ['los-angeles-lakers', 'Kobe Bryant', 'No. 8'],
  ['miami-heat', 'Dwyane Wade', 'No. 3'],
  ['orlando-magic', "Shaquille O'Neal", 'No. 32'],
  ['philadelphia-76ers', 'Julius Erving', 'No. 6'],
  ['sacramento-kings', 'Chris Webber', 'No. 4'],
];

const teamPage = (officialTeamId) => `https://www.nba.com/team/${officialTeamId}/roster`;

export function basketballTriviaItems(teamBySlug) {
  const create = (scope, rows, mapper) => rows.map((row) => {
    const team = teamBySlug.get(row[0]);
    if (!team) throw new Error(`Missing NBA team for ${row[0]}`);
    return mapper(team, row);
  });

  const mascotItems = create('mascot', mascots, (team, [, answer]) => ({
    scope: 'mascot', team, answer,
    prompt: 'Which mascot represents this NBA team?',
    sourcePageUrl: mascotSource,
  }));
  const arenaItems = create('arena', arenas, (team, [, answer]) => ({
    scope: 'arena', team, answer,
    prompt: 'Which arena does this NBA team call home?',
    sourcePageUrl: arenaSource,
  }));
  const retiredNumberItems = create('retired-number', retiredLegends, (team, [, legend, number]) => ({
    scope: 'retired-number', team, answer: number,
    prompt: `Which number did this team retire for ${legend}?`,
    sourcePageUrl: teamPage(team[1]), legend, number,
  }));
  const legendItems = create('franchise-legend', retiredLegends, (team, [, legend, number]) => ({
    scope: 'franchise-legend', team, answer: legend,
    prompt: `Which franchise legend had ${number} retired by this team?`,
    sourcePageUrl: teamPage(team[1]), legend, number,
  }));

  const items = [...mascotItems, ...arenaItems, ...retiredNumberItems, ...legendItems];
  for (const scope of ['mascot', 'arena', 'retired-number', 'franchise-legend']) {
    const scoped = items.filter((item) => item.scope === scope);
    if (scoped.length !== 12 || new Set(scoped.map((item) => item.answer)).size !== 12) {
      throw new Error(`Basketball ${scope} pack must contain 12 distinct answers.`);
    }
  }
  return items;
}
