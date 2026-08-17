export const platformLimits = {
  twitter: 280,
  linkedin: 3000,
  instagram: 2200,
};

export const validatePost = (content, platform) => {
  if (!content.trim()) {
    return {
      isValid: false,
      error: "Post cannot be empty.",
    };
  }

  const limit = platformLimits[platform];

  if (content.length > limit) {
    return {
      isValid: false,
      error: `Character limit is ${limit}`,
    };
  }

  return {
    isValid: true,
    error: null,
  };
};