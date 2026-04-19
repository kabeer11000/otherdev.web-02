// Selective Motion features for optimal bundle size
// This reduces bundle from 34kb to 4.6kb by only importing needed features

import { domAnimation } from 'framer-motion';

// Export only the features we need for Framer-style animations
// domAnimation includes: layout, whileHover, whileTap, whileInView, drag, etc.
// We avoid domMax which includes more complex features we don't need
export default domAnimation;