# MixUp

MixUp is a MERN social app scaffold for connecting people through shared hobbies.

This first version includes JWT auth, nearby events on a Leaflet + OpenStreetMap map, event category filtering, swipe-based interest matching, and MongoDB GeoJSON locations with `2dsphere` indexes.

## Project Structure

```txt
root/
  client/   React + Vite frontend
  server/   Express + MongoDB API
```

## Setup

```bash
cd server
cp .env.example .env
npm install

cd ../client
cp .env.example .env
npm install
```

Update `server/.env` with your `MONGO_URI` and `JWT_SECRET`.

To enable live external event listings on the map, also set:

```bash
TICKETMASTER_API_KEY=your_ticketmaster_api_key
SERPAPI_API_KEY=your_serpapi_key
```

If `TICKETMASTER_API_KEY` is omitted, the map will not show external event listings.
If `SERPAPI_API_KEY` is set, authenticated users can import Google Events search results as templates while creating new MixUp events.

## Run

```bash
cd server
npm run dev
```

```bash
cd client
npm run dev
```

The client defaults to `http://localhost:5173` and the API to `http://localhost:5000`.

Protected API routes require `Authorization: Bearer <token>`.
