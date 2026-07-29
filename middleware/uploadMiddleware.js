import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const filetypes = /jpe?g|png|webp|svg|gif/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype || extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images (jpg, jpeg, png, webp, svg, gif) are allowed!'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB Limit
});

export const getFileUrl = (file) => {
  if (!file) return null;

  // Try saving to local uploads directory if filesystem is writable
  try {
    const projectRootPath = path.resolve();
    const uploadsDir = path.join(projectRootPath, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const ext = path.extname(file.originalname || '.png') || '.png';
    const filename = `${file.fieldname || 'image'}-${Date.now()}${ext}`;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, file.buffer);
    return `/uploads/${filename}`;
  } catch (err) {
    console.warn('⚠️ Serverless read-only filesystem notice (converting upload to Data URI):', err.message);
  }

  // Fallback to Data URI for Vercel / serverless environments
  const mime = file.mimetype || 'image/png';
  const base64 = file.buffer.toString('base64');
  return `data:${mime};base64,${base64}`;
};

export default upload;
