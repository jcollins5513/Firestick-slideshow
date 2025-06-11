export const is360Image = (file) => {
  // Heuristic: filename contains '360' or 'pano', or user marks it
  return !!(file && file.name && /360|pano/i.test(file.name));
};

export const isVideo = (file) => {
  return !!(file && file.type && file.type.startsWith('video/'));
};

export const isImage = (file) => {
  return !!(file && file.type && file.type.startsWith('image/'));
};
