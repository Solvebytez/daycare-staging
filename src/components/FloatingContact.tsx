'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Mail, MessageCircle, X, ChevronUp } from 'lucide-react';

export default function FloatingContact() {
  const [isExpanded, setIsExpanded] = useState(false);

  const contactOptions = [
    {
      icon: Phone,
      label: 'Call Us',
      action: 'tel:+1-416-555-0123',
      color: 'bg-green-500 hover:bg-green-600',
      delay: 0.1
    },
    {
      icon: Mail,
      label: 'Email',
      action: 'mailto:hello@daycareconcierge.ca',
      color: 'bg-blue-500 hover:bg-blue-600',
      delay: 0.2
    },
    {
      icon: MessageCircle,
      label: 'Live Chat',
      action: '#',
      color: 'bg-purple-500 hover:bg-purple-600',
      delay: 0.3
    }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Contact Options */}
      <AnimatePresence>
        {isExpanded && (
          <div className="mb-4 space-y-3">
            {contactOptions.map((option) => (
              <motion.div
                key={option.label}
                initial={{ opacity: 0, x: 20, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.8 }}
                transition={{ delay: option.delay, duration: 0.2 }}
                className="flex items-center justify-end"
              >
                <a
                  href={option.action}
                  className={`${option.color} text-white p-3 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 flex items-center space-x-2 group`}
                >
                  <option.icon className="h-5 w-5" />
                  <span className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                    {option.label}
                  </span>
                </a>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Main Floating Button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`relative w-16 h-16 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 ${
          isExpanded 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center text-white"
            >
              <X className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div
              key="expand"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center text-white"
            >
              <ChevronUp className="h-6 w-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Tooltip */}
      {!isExpanded && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap"
        >
          Quick Contact
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </motion.div>
      )}
    </div>
  );
}
