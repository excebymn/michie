export const IconPlus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const IconHeart = ({ filled }: { filled?: boolean }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
);

export const IconTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" /><path d="M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

export const IconPencil = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </svg>
);

export const IconImage = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
);

export const IconShuffle = () => (
  <svg viewBox="0 0 640 640" fill="currentColor">
    <path d="M467.8,98.4c12-5,25.7-2.2,34.9,6.9l64,64c6,6,9.4,14.1,9.4,22.6s-3.4,16.6-9.4,22.6l-64,64c-9.2,9.2-22.9,11.9-34.9,6.9S448,268.9,448,256v-32h-32c-10.1,0-19.6,4.7-25.6,12.8L358,280l-40-53.3l21.2-28.3c18.1-24.2,46.6-38.4,76.8-38.4h32v-32C448,115.1,455.8,103.4,467.8,98.4z M218,360l40,53.3l-21.2,28.3C218.7,465.8,190.2,480,160,480H96c-17.7,0-32-14.3-32-32s14.3-32,32-32h64c10.1,0,19.6-4.7,25.6-12.8L218,360z M502.6,534.6c-9.2,9.2-22.9,11.9-34.9,6.9S448,524.9,448,512v-32h-32c-30.2,0-58.7-14.2-76.8-38.4L185.6,236.8c-6-8.1-15.5-12.8-25.6-12.8H96c-17.7,0-32-14.3-32-32s14.3-32,32-32h64c30.2,0,58.7,14.2,76.8,38.4l153.6,204.8c6,8.1,15.5,12.8,25.6,12.8h32v-32c0-12.9,7.8-24.6,19.8-29.6s25.7-2.2,34.9,6.9l64,64c6,6,9.4,14.1,9.4,22.6s-3.4,16.6-9.4,22.6l-64,64L502.6,534.6z" />
  </svg>
);

export const IconPlay = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6,3 20,12 6,21" /></svg>
);

export const IconX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" />
  </svg>
);

export const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const IconMusicNote = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
  </svg>
);