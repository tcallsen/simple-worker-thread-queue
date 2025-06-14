export async function processJob (jobOptions, job) {
  const result = {
    message: `Hello ${jobOptions.name}`,
  };
  // result will be saved to the job data
  return result;
};
