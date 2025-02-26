import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useState } from 'react';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <motion.button
      onClick={toggleLanguage}
      className="relative px-4 py-2 rounded-full bg-gray-800 text-white flex items-center"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <motion.div
        className="absolute inset-0 bg-blue-500 rounded-full"
        initial={false}
        animate={{
          x: i18n.language === 'en' ? '0%' : '100%',
          opacity: 0.2
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
      <motion.span
        animate={{
          x: i18n.language === 'en' ? '0%' : '100%'
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {i18n.language === 'en' ? 'EN' : 'AR'}
      </motion.span>
      <motion.div
        className="absolute top-1 right-2 text-xs"
        animate={{
          opacity: isHovered ? 1 : 0,
          y: isHovered ? 0 : 5
        }}
      >
        {i18n.language === 'en' ? 'العربية' : 'English'}
      </motion.div>
    </motion.button>
  );
};

export default LanguageSwitcher;