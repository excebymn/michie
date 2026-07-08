export const IconGrip = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <circle cx="9" cy="6" r="1.5" />
    <circle cx="9" cy="12" r="1.5" />
    <circle cx="9" cy="18" r="1.5" />
    <circle cx="15" cy="6" r="1.5" />
    <circle cx="15" cy="12" r="1.5" />
    <circle cx="15" cy="18" r="1.5" />
  </svg>
);

export const IconRemove = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <line x1="6" y1="6" x2="18" y2="18" />
    <line x1="18" y1="6" x2="6" y2="18" />
  </svg>
);

export const IconQueueEmpty = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="4" y1="7" x2="20" y2="7" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="17" x2="14" y2="17" />
  </svg>
);

export const IconHeart = ({ filled }: { filled?: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
);

export const IconShuffle = () => (
  <svg viewBox="0 0 640 640" fill="currentColor">
    <path d="M467.8,98.4c12-5,25.7-2.2,34.9,6.9l64,64c6,6,9.4,14.1,9.4,22.6s-3.4,16.6-9.4,22.6l-64,64c-9.2,9.2-22.9,11.9-34.9,6.9S448,268.9,448,256v-32h-32c-10.1,0-19.6,4.7-25.6,12.8L358,280l-40-53.3l21.2-28.3c18.1-24.2,46.6-38.4,76.8-38.4h32v-32C448,115.1,455.8,103.4,467.8,98.4z M218,360l40,53.3l-21.2,28.3C218.7,465.8,190.2,480,160,480H96c-17.7,0-32-14.3-32-32s14.3-32,32-32h64c10.1,0,19.6-4.7,25.6-12.8L218,360z M502.6,534.6c-9.2,9.2-22.9,11.9-34.9,6.9S448,524.9,448,512v-32h-32c-30.2,0-58.7-14.2-76.8-38.4L185.6,236.8c-6-8.1-15.5-12.8-25.6-12.8H96c-17.7,0-32-14.3-32-32s14.3-32,32-32h64c30.2,0,58.7,14.2,76.8,38.4l153.6,204.8c6,8.1,15.5,12.8,25.6,12.8h32v-32c0-12.9,7.8-24.6,19.8-29.6s25.7-2.2,34.9,6.9l64,64c6,6,9.4,14.1,9.4,22.6s-3.4,16.6-9.4,22.6l-64,64L502.6,534.6z" />
  </svg>
);

export const IconRepeat = () => (
  <svg viewBox="0 0 640 640" fill="currentColor">
    <path d="M534.6,182.6c12.5-12.5,12.5-32.8,0-45.3l-64-64c-9.2-9.2-22.9-11.9-34.9-6.9S416,83.1,416,96v32H256c-106,0-192,86-192,192c0,17.7,14.3,32,32,32s32-14.3,32-32c0-70.7,57.3-128,128-128h160v32c0,12.9,7.8,24.6,19.8,29.6s25.7,2.2,34.9-6.9l64-64L534.6,182.6z M105.4,457.4c-12.5,12.5-12.5,32.8,0,45.3l64,64c9.2,9.2,22.9,11.9,34.9,6.9S224,556.9,224,544v-32h160c106,0,192-86,192-192c0-17.7-14.3-32-32-32s-32,14.3-32,32c0,70.7-57.3,128-128,128H224v-32c0-12.9-7.8-24.6-19.8-29.6s-25.7-2.2-34.9,6.9l-64,64L105.4,457.4z" />
  </svg>
);

export const IconPlayingBars = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <rect x="4" y="10" width="3" height="8" />
    <rect x="10.5" y="6" width="3" height="12" />
    <rect x="17" y="12" width="3" height="6" />
  </svg>
);
