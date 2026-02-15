# Frontend Switched Back to Old Version

## What Changed

### Directories
- ✅ `frontend` → `frontend_new_vite` (New Vite+React frontend - disabled)
- ✅ `frontend_old_backup` → `frontend` (Old Next.js frontend - active)

### Services
- ✅ Backend: http://localhost:8000 (unchanged)
- ✅ Frontend: http://localhost:3000 (now running old Next.js version)

## Current Frontend: Next.js (Original)

This is the original skeleton/starter frontend from the beginning of the project.

### Features
- Next.js framework
- Basic structure
- May have limited functionality
- Simpler codebase

## To Switch Back to New Frontend

If you want to use the new Vite frontend again:

```bash
# Stop frontend
lsof -ti:3000 | xargs kill -9

# Switch directories
cd /Users/ramchandrachawla/PersonalProjects/Hackathon/HackNCState/proofpulse
mv frontend frontend_old_backup
mv frontend_new_vite frontend

# Start new frontend
cd frontend
npm run dev -- --port 3000
```

## Services Status

- Backend: http://localhost:8000
- Frontend: http://localhost:3000 (OLD Next.js version)

## Note

The old frontend may not have all the features that were added to the new frontend:
- Demo button integration
- Enhanced API calls
- Progress bar updates
- Result screen improvements
- Button debouncing

You're now running the original basic version.
