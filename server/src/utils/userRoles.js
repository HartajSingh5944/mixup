const getAdminEmails = () =>
  (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const resolveUserRole = (user) => {
  if (!user) {
    return 'user';
  }

  if (user.role === 'admin') {
    return 'admin';
  }

  return getAdminEmails().includes(user.email?.toLowerCase()) ? 'admin' : 'user';
};

module.exports = { resolveUserRole };
