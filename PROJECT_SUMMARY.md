# HeatSafe — Project Summary

**Track fit:** Resilient Cities & Infrastructure · Dashboard · Interactive Map  
**Repo:** https://github.com/HaithamCa/fortyguard-heatmap  
**Live demo:** https://heatsafe-nine.vercel.app  
**Built with:** FortyGuard Temperature API® (async heatmap + status)

## Problem

Urban heat is uneven. A few blocks can be much hotter than nearby streets, but people and planners often only see city-wide averages. That makes it hard to choose safer routes, place cooling resources, or communicate risk quickly.

## Solution

**HeatSafe** turns FortyGuard hyperlocal temperature intelligence into an actionable map experience:

1. Draw an area of interest
2. Run a FortyGuard heatmap analysis
3. Visualize cooler → hotter zones with clear color coding
4. Highlight minimum / average / maximum locations
5. Recommend cooler places (and flag hotspots)
6. Open recommended places directly in Google Maps

## How FortyGuard powers it

- Uses production Temperature API endpoints (`/v1/heatmap`, `/v1/status/:id`)
- Follows the official async **submit → poll** pattern
- Transforms tile `map_data` and `stats_data` into summary metrics and place recommendations
- Keeps the API key server-side (never exposed in the browser)

## Impact

- Helps residents find cooler nearby places during heat events
- Gives planners a fast visual audit of hotspots inside a neighborhood
- Converts raw temperature tiles into decisions: where to go, where to avoid, what to deploy

## Demo notes

- Draw a **small AOI inside the United States** (current API coverage)
- Prefer granularity `100` for faster demos
- If status is slow, keep waiting — upstream timeouts are retried automatically

## Team

Solo / team submission for FortyGuard Hackathon’26.
