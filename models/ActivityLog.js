import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  adminName: {
    type: String,
    required: true,
    default: 'admin'
  },
  action: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  details: {
    type: String
  }
}, { timestamps: true });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export const logAdminActivity = async (username, action, details = '') => {
  try {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];
    
    await ActivityLog.create({
      adminName: username || 'admin',
      action,
      date: dateStr,
      time: timeStr,
      details
    });
    console.log(`📝 Activity Logged: [${username || 'admin'}] - ${action}`);
  } catch (error) {
    console.error('Error creating activity log:', error.message);
  }
};

export default ActivityLog;
