const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/user');

const DB_URI = process.env.MONGODB_URI;

if (!DB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env');
  process.exit(1);
}

// Authentic student names from diverse universities
const studentProfiles = [
  // 1. Champions (Active, high streaks, high study time, regular quizzes & AI tutor)
  { name: 'Aarav Sharma', weeklyHours: 8.5, totalHours: 54, streak: 12, quizzes: 18, materials: 24, ai: 14, daysAgoActive: 0.1 },
  { name: 'Ananya Verma', weeklyHours: 7.2, totalHours: 42, streak: 9, quizzes: 14, materials: 20, ai: 11, daysAgoActive: 0.2 },
  { name: 'Rohan Patel', weeklyHours: 6.8, totalHours: 38, streak: 8, quizzes: 12, materials: 16, ai: 9, daysAgoActive: 0.4 },
  { name: 'Priya Iyer', weeklyHours: 9.0, totalHours: 62, streak: 15, quizzes: 21, materials: 28, ai: 16, daysAgoActive: 0.1 },
  { name: 'Ishaan Gupta', weeklyHours: 5.5, totalHours: 31, streak: 7, quizzes: 10, materials: 14, ai: 8, daysAgoActive: 0.3 },
  { name: 'Aditi Rao', weeklyHours: 7.8, totalHours: 48, streak: 11, quizzes: 16, materials: 22, ai: 12, daysAgoActive: 0.2 },
  { name: 'Aditya Singh', weeklyHours: 6.2, totalHours: 36, streak: 6, quizzes: 11, materials: 15, ai: 7, daysAgoActive: 0.5 },
  { name: 'Sneha Nair', weeklyHours: 8.1, totalHours: 50, streak: 14, quizzes: 19, materials: 25, ai: 15, daysAgoActive: 0.1 },
  { name: 'Vikram Joshi', weeklyHours: 5.8, totalHours: 29, streak: 5, quizzes: 9, materials: 13, ai: 6, daysAgoActive: 0.6 },
  { name: 'Pooja Deshmukh', weeklyHours: 7.5, totalHours: 44, streak: 10, quizzes: 15, materials: 19, ai: 10, daysAgoActive: 0.3 },
  { name: 'Karan Mehra', weeklyHours: 6.4, totalHours: 34, streak: 7, quizzes: 13, materials: 17, ai: 8, daysAgoActive: 0.4 },
  { name: 'Tanvi Kulkarni', weeklyHours: 8.8, totalHours: 58, streak: 16, quizzes: 20, materials: 26, ai: 17, daysAgoActive: 0.1 },
  { name: 'Aryan Reddy', weeklyHours: 5.2, totalHours: 28, streak: 5, quizzes: 8, materials: 12, ai: 5, daysAgoActive: 0.8 },
  { name: 'Divya Nambiar', weeklyHours: 7.0, totalHours: 40, streak: 8, quizzes: 14, materials: 18, ai: 11, daysAgoActive: 0.3 },
  { name: 'Siddharth Bose', weeklyHours: 6.6, totalHours: 37, streak: 7, quizzes: 12, materials: 15, ai: 8, daysAgoActive: 0.5 },
  { name: 'Meera Chawla', weeklyHours: 9.4, totalHours: 66, streak: 18, quizzes: 24, materials: 30, ai: 19, daysAgoActive: 0.1 },
  { name: 'Kavya Pillai', weeklyHours: 6.0, totalHours: 33, streak: 6, quizzes: 10, materials: 14, ai: 7, daysAgoActive: 0.4 },
  { name: 'Rahul Sengupta', weeklyHours: 7.6, totalHours: 46, streak: 11, quizzes: 17, materials: 21, ai: 13, daysAgoActive: 0.2 },
  { name: 'Riya Mukherjee', weeklyHours: 8.3, totalHours: 52, streak: 13, quizzes: 18, materials: 23, ai: 14, daysAgoActive: 0.2 },
  { name: 'Varun Bhatia', weeklyHours: 5.9, totalHours: 32, streak: 6, quizzes: 11, materials: 15, ai: 8, daysAgoActive: 0.6 },

  // 2. Steady Learners (Consistent cadence, moderate study time, good quiz attempts)
  { name: 'Nikhil Agarwal', weeklyHours: 3.8, totalHours: 22, streak: 4, quizzes: 7, materials: 10, ai: 5, daysAgoActive: 1.1 },
  { name: 'Shruti Tiwari', weeklyHours: 4.2, totalHours: 25, streak: 4, quizzes: 8, materials: 11, ai: 6, daysAgoActive: 1.0 },
  { name: 'Manish Pandey', weeklyHours: 3.5, totalHours: 19, streak: 3, quizzes: 6, materials: 8, ai: 4, daysAgoActive: 1.5 },
  { name: 'Sakshi Saxena', weeklyHours: 4.0, totalHours: 24, streak: 4, quizzes: 7, materials: 9, ai: 5, daysAgoActive: 1.2 },
  { name: 'Gaurav Dubey', weeklyHours: 3.2, totalHours: 18, streak: 3, quizzes: 5, materials: 7, ai: 3, daysAgoActive: 1.8 },
  { name: 'Bhavya Hegde', weeklyHours: 4.5, totalHours: 26, streak: 5, quizzes: 8, materials: 12, ai: 6, daysAgoActive: 0.9 },
  { name: 'Rohit Chauhan', weeklyHours: 3.6, totalHours: 20, streak: 3, quizzes: 6, materials: 8, ai: 4, daysAgoActive: 1.6 },
  { name: 'Neha Bhatt', weeklyHours: 4.1, totalHours: 23, streak: 4, quizzes: 7, materials: 10, ai: 5, daysAgoActive: 1.3 },
  { name: 'Akash Mishra', weeklyHours: 3.4, totalHours: 17, streak: 3, quizzes: 5, materials: 7, ai: 3, daysAgoActive: 2.0 },
  { name: 'Shreya Das', weeklyHours: 4.6, totalHours: 27, streak: 5, quizzes: 9, materials: 11, ai: 6, daysAgoActive: 1.0 },
  { name: 'Deepak Yadav', weeklyHours: 3.1, totalHours: 16, streak: 2, quizzes: 4, materials: 6, ai: 3, daysAgoActive: 2.2 },
  { name: 'Kritika Roy', weeklyHours: 3.9, totalHours: 21, streak: 4, quizzes: 7, materials: 9, ai: 5, daysAgoActive: 1.4 },
  { name: 'Harshit Bansal', weeklyHours: 4.3, totalHours: 24, streak: 4, quizzes: 8, materials: 10, ai: 6, daysAgoActive: 1.1 },
  { name: 'Ankita Ghosh', weeklyHours: 3.7, totalHours: 20, streak: 3, quizzes: 6, materials: 8, ai: 4, daysAgoActive: 1.7 },
  { name: 'Saurav Nanda', weeklyHours: 4.4, totalHours: 25, streak: 4, quizzes: 8, materials: 11, ai: 5, daysAgoActive: 1.2 },

  // 3. At-Risk Learners (Dropped streak, low study time, inactivity gaps 4-9 days)
  { name: 'Mohit Rawat', weeklyHours: 0.8, totalHours: 9, streak: 0, quizzes: 2, materials: 3, ai: 1, daysAgoActive: 4.5 },
  { name: 'Preeti Solanki', weeklyHours: 0.5, totalHours: 8, streak: 0, quizzes: 1, materials: 2, ai: 1, daysAgoActive: 5.2 },
  { name: 'Kunal Kapoor', weeklyHours: 1.2, totalHours: 11, streak: 1, quizzes: 3, materials: 4, ai: 1, daysAgoActive: 3.8 },
  { name: 'Ayesha Khan', weeklyHours: 0.4, totalHours: 6, streak: 0, quizzes: 1, materials: 2, ai: 0, daysAgoActive: 6.1 },
  { name: 'Abhishek Rathore', weeklyHours: 0.9, totalHours: 10, streak: 0, quizzes: 2, materials: 3, ai: 1, daysAgoActive: 4.9 },
  { name: 'Nisha Bhasin', weeklyHours: 0.6, totalHours: 7, streak: 0, quizzes: 1, materials: 2, ai: 1, daysAgoActive: 5.8 },
  { name: 'Tarun Vashisth', weeklyHours: 1.1, totalHours: 12, streak: 1, quizzes: 2, materials: 4, ai: 1, daysAgoActive: 4.2 },
  { name: 'Simran Bajaj', weeklyHours: 0.3, totalHours: 5, streak: 0, quizzes: 1, materials: 1, ai: 0, daysAgoActive: 7.0 },
  { name: 'Yashwardhan Dixit', weeklyHours: 0.7, totalHours: 8, streak: 0, quizzes: 2, materials: 3, ai: 1, daysAgoActive: 5.5 },
  { name: 'Palak Sethi', weeklyHours: 0.5, totalHours: 7, streak: 0, quizzes: 1, materials: 2, ai: 0, daysAgoActive: 6.4 },

  // 4. Dormant Accounts (Long inactivity > 14 days, broken engagement, high dropout risk)
  { name: 'Vishal Tripathi', weeklyHours: 0.0, totalHours: 2.5, streak: 0, quizzes: 0, materials: 1, ai: 0, daysAgoActive: 18.0 },
  { name: 'Sonali Biswas', weeklyHours: 0.0, totalHours: 1.8, streak: 0, quizzes: 0, materials: 1, ai: 0, daysAgoActive: 22.5 },
  { name: 'Pranav Kulkarni', weeklyHours: 0.0, totalHours: 3.2, streak: 0, quizzes: 1, materials: 1, ai: 0, daysAgoActive: 16.2 },
  { name: 'Richa Kaushik', weeklyHours: 0.0, totalHours: 2.0, streak: 0, quizzes: 0, materials: 1, ai: 0, daysAgoActive: 27.0 },
  { name: 'Naveen Somani', weeklyHours: 0.0, totalHours: 1.5, streak: 0, quizzes: 0, materials: 0, ai: 0, daysAgoActive: 34.0 }
];

function generateActivityDates(streak, daysAgoActive, totalDaysHistory = 30) {
  const dates = [];
  const now = Date.now();
  const msPerDay = 86400000;

  // Recent active days
  if (streak > 0) {
    for (let i = 0; i < streak; i++) {
      const d = new Date(now - ((daysAgoActive + i) * msPerDay));
      dates.push(d);
    }
  }

  // Scattered historical days based on totalDaysHistory
  const historicalDays = Math.min(totalDaysHistory, 15);
  for (let j = streak + 1; j < historicalDays; j++) {
    if (Math.random() > 0.45) {
      const d = new Date(now - (j * msPerDay));
      dates.push(d);
    }
  }

  return dates.sort((a, b) => b - a);
}

async function seedStudents() {
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    await mongoose.connect(DB_URI);
    console.log('✅ Connected to MongoDB Atlas successfully.');

    const defaultPasswordHash = await bcrypt.hash('StudyMate@2026', 10);

    let seededCount = 0;
    let updatedCount = 0;

    for (const prof of studentProfiles) {
      const email = prof.name.toLowerCase().replace(/\s+/g, '.') + '@studymate.ac.in';
      const [firstName, ...rest] = prof.name.split(' ');
      const lastName = rest.join(' ');

      const now = Date.now();
      const lastActivityAt = new Date(now - (prof.daysAgoActive * 86400000));
      const activityDates = generateActivityDates(prof.streak, prof.daysAgoActive);

      const stats = {
        weeklyTimeMinutes: Math.round(prof.weeklyHours * 60),
        totalTimeMinutes: Math.round(prof.totalHours * 60),
        currentStreak: prof.streak,
        quizzesCompleted: prof.quizzes,
        materialsReviewed: prof.materials,
        aiConversations: prof.ai,
        lastActivityAt: lastActivityAt,
        activityDates: activityDates,
        weekStartDate: new Date(now - (3 * 86400000))
      };

      const existingUser = await User.findOne({ email });

      if (existingUser) {
        existingUser.firstName = firstName;
        existingUser.lastName = lastName;
        existingUser.stats = stats;
        await existingUser.save();
        updatedCount++;
      } else {
        const newUser = new User({
          firstName,
          lastName,
          email,
          password: defaultPasswordHash,
          userType: 'guest',
          stats,
          createdAt: new Date(now - ((prof.daysAgoActive + 45) * 86400000))
        });
        await newUser.save();
        seededCount++;
      }
    }

    console.log(`\n🎉 SEEDING COMPLETE!`);
    console.log(`   ✨ New Students Seeded: ${seededCount}`);
    console.log(`   🔄 Existing Records Updated: ${updatedCount}`);
    console.log(`   📊 Total Realistic Student Cohort: ${studentProfiles.length} records in MongoDB Atlas.`);

    // Print summary stats from the live database
    const totalUsers = await User.countDocuments();
    console.log(`   🌐 Total Users in MongoDB Atlas: ${totalUsers}`);

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB Atlas.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during seeding:', err);
    process.exit(1);
  }
}

seedStudents();
