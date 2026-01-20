// Temporary in-memory storage for pending OTP verifications

const pendingVerifications = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [email, data] of pendingVerifications.entries()) {
    if (now > data.expiresAt) {
      pendingVerifications.delete(email);
      console.log(`Cleaned up expired OTP for ${email}`);
    }
  }
}, 10 * 60 * 1000); 

const storePendingVerification = (email, userData, otp, expiresAt) => {
  pendingVerifications.set(email, {
    ...userData,
    otp,
    expiresAt
  });
  console.log(`Stored pending verification for ${email}`);
};

const getPendingVerification = (email) => {
  return pendingVerifications.get(email);
};

const removePendingVerification = (email) => {
  pendingVerifications.delete(email);
  console.log(`Removed pending verification for ${email}`);
};

module.exports = {
  storePendingVerification,
  getPendingVerification,
  removePendingVerification
};
