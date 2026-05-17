export function getRelativeTime(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSeconds < 10) return 'এইমাত্র';
  if (diffSeconds < 60) return `${diffSeconds} সেকেন্ড আগে`;
  if (diffMinutes < 60) return `${diffMinutes} মিনিট আগে`;
  if (diffHours < 24) return `${diffHours} ঘণ্টা আগে`;
  if (diffDays === 1) return 'গতকাল';
  if (diffDays < 7) return `${diffDays} দিন আগে`;
  if (diffWeeks < 5) return `${diffWeeks} সপ্তাহ আগে`;
  if (diffMonths < 12) return `${diffMonths} মাস আগে`;
  return date.toLocaleDateString('bn-BD'); // পুরনো হলে তারিখ দেখাবে
}
