export const saveDraftMock = (data) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() > 0.2) {
        resolve({
          success: true,
          id: Date.now(),
          ...data,
        });
      } else {
        reject(new Error("Network Error"));
      }
    }, 1000);
  });
};