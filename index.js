import { gotScraping } from 'got-scraping';

const RESTAURANTS = [
  { id: 1543, name: 'Jeju Noodle Bar', city: 'ny', urlName: 'jeju-noodle-bar' },
  { id: 65452, name: 'Tatiana', city: 'new-york-ny', urlName: 'tatiana' }
];
const PARTY_SIZE = 6;
const START_DATE = '2024-09-01';
const END_DATE = '2025-09-01';

const API_KEY = 'VbWk7s3L4KiK5fzlO7JD3Q5EYolJI7n5';
const discordWebhookUrl = 'https://discord.com/api/webhooks/1280035092634538007/efnkOfGXQDBN-o1x9YifMVHCTTzK4TBsPWREWud-3yXAnSccOjDcprkeYUCshn_UF1Ys';

async function sendDiscordMessage(restaurant, availableDates) {
  try {
    const message = `New reservations available for ${restaurant.name}!`;
    const fields = availableDates.map(date => ({
      name: 'Available Date',
      value: `[${date.date}](https://resy.com/cities/${restaurant.city}/venues/${restaurant.urlName}?date=${date.date}&seats=${PARTY_SIZE})`,
      inline: true
    }));

    await gotScraping.post(discordWebhookUrl, {
      json: {
        embeds: [
          {
            title: `${restaurant.name} Reservations`,
            description: message,
            color: 5814783,
            fields: fields,
            timestamp: new Date().toISOString(),
          },
        ],
      },
    });
    console.log(`Discord message sent successfully for ${restaurant.name}`);
  } catch (error) {
    console.error(`Error sending Discord message for ${restaurant.name}:`, error);
  }
}

async function checkReservations(restaurant) {
  try {
    const response = await gotScraping.get('https://api.resy.com/4/venue/calendar', {
      searchParams: {
        venue_id: restaurant.id,
        num_seats: PARTY_SIZE,
        start_date: START_DATE,
        end_date: END_DATE
      },
      headers: {
        'Authorization': `ResyAPI api_key="${API_KEY}"`,
        'Origin': 'https://resy.com'
      },
      headerGeneratorOptions: {
        browsers: [
          { name: "chrome", minVersion: 87 }
        ],
        devices: ["desktop"],
        operatingSystems: ["windows"]
      }
    });

    // Parse the JSON response
    const data = JSON.parse(response.body);

    const availableDates = data.scheduled.filter(day =>
      day.inventory.reservation === 'available'
    );

    if (availableDates.length > 0) {
      console.log(`New reservations available for ${restaurant.name} on:`);
      availableDates.forEach(date => console.log(date.date));
      await sendDiscordMessage(restaurant, availableDates);
    } else {
      console.log(`No new reservations available for ${restaurant.name}`);
    }

  } catch (error) {
    console.error(`Error checking reservations for ${restaurant.name}:`, error);
  }
}

async function checkAllReservations() {
  for (const restaurant of RESTAURANTS) {
    await checkReservations(restaurant);
  }
}

// Check every 10 seconds
setInterval(checkAllReservations, 10 * 1000);

// Initial check 
checkAllReservations();
