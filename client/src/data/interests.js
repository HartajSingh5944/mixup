export const interestCategories = [
  {
    name: 'Arts & Entertainment',
    interests: [
      ['music_concerts', 'Music concerts'],
      ['live_bands', 'Live bands'],
      ['dj_nights', 'DJ nights'],
      ['open_mic', 'Open mic'],
      ['stand_up_comedy', 'Stand-up comedy'],
      ['theatre_drama', 'Theatre / drama'],
      ['musical_theatre', 'Musical theatre'],
      ['dance_performances', 'Dance performances'],
      ['movie_screenings_film_festivals', 'Movie screenings / film festivals'],
      ['poetry_slams_spoken_word', 'Poetry slams / spoken word'],
      ['magic_shows', 'Magic shows'],
      ['talent_shows', 'Talent shows'],
    ],
  },
  {
    name: 'Sports & Fitness',
    interests: [
      ['football_soccer_matches', 'Football / soccer matches'],
      ['cricket_matches', 'Cricket matches'],
      ['basketball_games', 'Basketball games'],
      ['badminton_tournaments', 'Badminton tournaments'],
      ['table_tennis', 'Table tennis'],
      ['running_marathons', 'Running / marathons'],
      ['cycling_events', 'Cycling events'],
      ['fitness_bootcamps', 'Fitness bootcamps'],
      ['yoga_sessions', 'Yoga sessions'],
      ['zumba_dance_fitness', 'Zumba / dance fitness'],
      ['gym_meetups_lifting_clubs', 'Gym meetups / lifting clubs'],
      ['indoor_climbing_bouldering', 'Indoor climbing / bouldering'],
      ['adventure_sports', 'Adventure sports'],
    ],
  },
  {
    name: 'Learning & Workshops',
    interests: [
      ['coding_bootcamps', 'Coding bootcamps'],
      ['hackathons', 'Hackathons'],
      ['tech_meetups', 'Tech meetups'],
      ['startup_entrepreneurship_events', 'Start-up / entrepreneurship events'],
      ['design_ui_ux_workshops', 'Design / UI-UX workshops'],
      ['photography_workshops', 'Photography workshops'],
      ['art_painting_workshops', 'Art & painting workshops'],
      ['music_production_dj_workshops', 'Music production / DJ workshops'],
      ['language_exchange_meetups', 'Language exchange meetups'],
      ['public_speaking_communication_workshops', 'Public speaking / communication workshops'],
      ['career_guidance_resume_clinics', 'Career guidance / resume clinics'],
    ],
  },
  {
    name: 'Social & Community',
    interests: [
      ['college_meetups', 'College meetups'],
      ['freshers_farewell_parties', 'Freshers / farewell parties'],
      ['alumni_gatherings', 'Alumni gatherings'],
      ['city_based_social_meetups', 'City-based social meetups'],
      ['networking_events', 'Networking events'],
      ['game_nights', 'Game nights'],
      ['book_clubs', 'Book clubs'],
      ['anime_manga_meetups', 'Anime / manga meetups'],
      ['fandom_meetups', 'Fandom meetups'],
    ],
  },
  {
    name: 'Food & Culture',
    interests: [
      ['food_festivals', 'Food festivals'],
      ['street_food_walks', 'Street food walks'],
      ['restaurant_cafe_meetups', 'Restaurant / cafe meetups'],
      ['cooking_classes', 'Cooking classes'],
      ['cultural_festivals', 'Cultural festivals'],
      ['garba_dandiya_nights', 'Garba / dandiya nights'],
      ['traditional_dance_music_events', 'Traditional dance / music events'],
      ['heritage_walks_city_tours', 'Heritage walks / city tours'],
    ],
  },
  {
    name: 'Tech & Professional',
    interests: [
      ['developer_conferences', 'Developer conferences'],
      ['tech_talks_seminars', 'Tech talks / seminars'],
      ['product_launches_demos', 'Product launches / demos'],
      ['startup_pitch_nights', 'Startup pitch nights'],
      ['investor_networking', 'Investor networking'],
      ['design_meetups', 'Design meetups'],
      ['data_science_ai_meetups', 'Data science / AI meetups'],
      ['career_fairs', 'Career fairs'],
      ['professional_networking_mixers', 'Professional networking mixers'],
    ],
  },
  {
    name: 'Online / Hybrid',
    interests: [
      ['online_webinars', 'Online webinars'],
      ['virtual_workshops', 'Virtual workshops'],
      ['online_game_tournaments', 'Online game tournaments'],
      ['online_hackathons', 'Online hackathons'],
      ['live_stream_concerts_performances', 'Live-stream concerts / performances'],
    ],
  },
  {
    name: 'Hobbies & Clubs',
    interests: [
      ['chess_tournaments', 'Chess tournaments'],
      ['esports_lan_parties', 'Esports / LAN parties'],
      ['dnd_tabletop_sessions', 'DnD / tabletop sessions'],
      ['photography_walks', 'Photography walks'],
      ['sketching_art_jams', 'Sketching / art jams'],
      ['gardening_meetups', 'Gardening meetups'],
      ['pet_meetups', 'Pet meetups'],
      ['car_bike_enthusiast_meets', 'Car / bike enthusiast meets'],
      ['cosplay_meetups', 'Cosplay meetups'],
      ['maker_diy_events', 'Maker / DIY events'],
    ],
  },
  {
    name: 'Volunteering & Causes',
    interests: [
      ['ngo_volunteering_drives', 'NGO volunteering drives'],
      ['blood_donation_camps', 'Blood donation camps'],
      ['clean_up_drives', 'Clean-up drives'],
      ['fundraisers_charity_events', 'Fundraisers / charity events'],
      ['awareness_campaigns', 'Awareness campaigns'],
    ],
  },
];

const interestLabelByValue = interestCategories.reduce((labels, category) => {
  category.interests.forEach(([value, label]) => {
    labels[value] = label;
  });
  return labels;
}, {});

export const getInterestLabel = (value) =>
  interestLabelByValue[value] || value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export const normalizeCustomInterest = (interest) =>
  interest
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

