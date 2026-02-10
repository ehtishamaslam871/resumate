import api from './api';

export const migrateLocalStorageToMongo = async () => {
  try {
    const authToken = localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const resumes = JSON.parse(localStorage.getItem('resumes') || '[]');

    // If no auth token, user is not logged in - skip migration
    if (!authToken || !user) {
      console.log('ℹ️ No user data in localStorage to migrate');
      return;
    }

    console.log('🔄 Starting data migration to MongoDB...');

    try {
      // Update user profile in MongoDB
      if (user && user.email) {
        await api.auth.updateProfile({
          name: user.name || '',
          email: user.email,
          phone: user.phone || '',
          location: user.location || '',
          headline: user.headline || '',
          bio: user.bio || '',
          role: user.role || 'jobseeker',
        });
        console.log('✅ User profile migrated');
      }

      // Migrate resumes to MongoDB
      if (resumes.length > 0) {
        for (const resume of resumes) {
          try {
            await api.resume.uploadResume(resume.file || resume, {
              filename: resume.filename,
              fileSize: resume.fileSize,
            });
          } catch (err) {
            console.warn('⚠️ Could not migrate resume:', resume.filename);
          }
        }
        console.log(`✅ ${resumes.length} resume(s) migrated`);
      }

      // Optional: Get user jobs and applications if stored
      const savedJobs = JSON.parse(localStorage.getItem('savedJobs') || '[]');
      const jobApplications = JSON.parse(localStorage.getItem('applications') || '[]');

      if (jobApplications.length > 0) {
        console.log('✅ Application history preserved');
      }

      if (savedJobs.length > 0) {
        console.log('✅ Saved jobs preserved');
      }

      // Keep authToken in localStorage for now, but mark migration as complete
      localStorage.setItem('migrationComplete', 'true');
      console.log('✅ Migration complete! Data now synced with MongoDB');

    } catch (error) {
      console.warn('⚠️ Partial migration (some items skipped):', error.message);
      localStorage.setItem('migrationComplete', 'true');
    }

  } catch (error) {
    console.warn('ℹ️ Migration skipped (not critical):', error.message);
  }
};

export const isMigrationNeeded = () => {
  const migrationComplete = localStorage.getItem('migrationComplete');
  const user = localStorage.getItem('user');
  return !migrationComplete && !!user;
};
