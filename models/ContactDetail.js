import mongoose from 'mongoose';

const contactDetailSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    default: '+91 99133 77965'
  },
  email: {
    type: String,
    required: true,
    default: 'prmaterialhouse@gmail.com'
  },
  address: {
    type: String,
    required: true,
    default: 'Remote Pan, Ahmedabad, Gujarat, India'
  },
  googleMapUrl: {
    type: String,
    required: true,
    default: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d117508.83594612808!2d72.50742456428723!3d23.02250495819777!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1m3!2d72.5713621!3d23.022505!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin'
  },
  whatsappNumber: {
    type: String,
    required: true,
    default: '919913377965'
  }
}, { timestamps: true });

const ContactDetail = mongoose.model('ContactDetail', contactDetailSchema);
export default ContactDetail;
