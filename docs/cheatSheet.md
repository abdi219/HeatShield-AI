# FortyGuard Temperature API Specifications

## 1. Authentication & Workflow
- Header Format: `api-key: YOUR_API_KEY` (No OAuth required).
- Async Engine: Every POST request submits a job to the engine and immediately returns an `activity_id`.
- Polling Loop: You query `GET /v1/status?activity_id=YOUR_ID` until the status returns `Completed`, which then includes the full result payload.

## 2. Core API Endpoints & Capabilities
* **Create Heatmap (`POST /v1/heatmap`):** Takes a polygon/bounding box area (AOI) and generates hyper-local 2-meter ground temperature map tiles and color gradients.
* **Heat Intelligence (`POST /v1/heat-intelligence`):** Calculates area-level microclimate statistics, thermal risk scores, and localized temperature deviations.
* **Environmental Parameters (`POST /v1/environmental-parameters`):** Retrieves specific environmental parameters like surface/air temperature, humidity, and solar irradiance.
* **Image Segmentation (`POST /v1/satellite-segmentation` & `/v1/streetview-segmentation`):** Analyzes satellite or street imagery to identify physical urban features like concrete, asphalt, trees, and canopy shade.
* **Task & Usage Tracking (`GET /v1/status` & `GET /v1/credits`):** Polls job progress and monitors remaining trial API credits.

## 3. Error Handling Codes
- 400/422: Invalid polygon coordinates or parameters.
- 401: Invalid or missing API key.
- 429: Rate limit exceeded.
- Completed: Polling finished; payload contains final GeoJSON/data.