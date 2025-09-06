export function getAvatarUrl(identifier) {
  const safeId = encodeURIComponent(identifier || "user");
  return `https://api.dicebear.com/7.x/thumbs/svg?seed=${safeId}&radius=50&backgroundType=gradientLinear`;
}
