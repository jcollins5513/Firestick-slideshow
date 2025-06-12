export const is360Image = (file) => {
  // Heuristic: filename contains '360' or 'pano', or user marks it
  return !!(file && file.name && /360|pano/i.test(file.name));
};

export const isVideo = (file) => {
  if (!file) return false;
  if (file.type) return file.type.startsWith('video/');
  if (file.name) return /\.(mp4|webm|mov|m4v|hevc)$/i.test(file.name);
  return false;
};

export const isImage = (file) => {
  if (!file) return false;
  if (file.type) return file.type.startsWith('image/');
  if (file.name) return /\.(jpg|jpeg|png|gif|bmp|heic|heif|avif)$/i.test(file.name);
  return false;
};
