# Deployment

## Vercel — frontend

1. Import the repository into Vercel.
2. Set the project root to `frontend`.
3. Set the build command to `npm run build`.
4. Set the output directory to `dist`.
5. Add `VITE_API_URL=https://your-render-service.onrender.com/api` as a Production Environment Variable.
6. Deploy.

## Render — backend

1. Create a new Blueprint from this repository.
2. Use the included `render.yaml` configuration.
3. Add `MONGO_URI`, `CLIENT_URL`, and `GROQ_API_KEY` in the Render dashboard.
4. The `JWT_SECRET` value is generated automatically.
5. Deploy and confirm the `/health` endpoint returns HTTP 200.

## Required variables

- `MONGO_URI`: MongoDB connection string.
- `JWT_SECRET`: long random value.
- `CLIENT_URL`: Vercel frontend URL.
- `GROQ_API_KEY`: optional only for AI features.
- `GROQ_MODEL`: optional AI model identifier.

> Do not commit real secrets. The repository's environment files are ignored.
