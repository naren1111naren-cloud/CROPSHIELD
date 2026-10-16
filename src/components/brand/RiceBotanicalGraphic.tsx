import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { forestEase, botanicalSwayVariants, panicleDroopVariants } from '../../lib/motion';

interface RiceBotanicalGraphicProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const RiceBotanicalGraphic: React.FC<RiceBotanicalGraphicProps> = ({
  className = '',
  size = 'md',
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Dimensions based on size
  const width = size === 'sm' ? 140 : size === 'lg' ? 260 : 200;
  const height = size === 'sm' ? 175 : size === 'lg' ? 325 : 250;

  return (
    <div className={`relative flex items-center justify-center select-none pointer-events-none ${className}`}>
      {/* Subtle organic ambient glow halo in sage/botanical green */}
      <div className="absolute inset-0 bg-radial from-[#B8DCC1]/30 via-[#70B77E]/10 to-transparent blur-xl rounded-full" />

      <motion.svg
        width={width}
        height={height}
        viewBox="0 0 200 250"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: forestEase }}
      >
        {/* Whole Stalk Base Group with organic gentle sway */}
        <motion.g
          style={{ transformOrigin: '100px 240px' }}
          variants={shouldReduceMotion ? {} : botanicalSwayVariants}
          initial="initial"
          animate="animate"
        >
          {/* Main Central Culm (Rice Stem) */}
          <path
            d="M 100 240 C 100 190, 102 140, 108 95 C 111 75, 118 55, 130 38"
            stroke="#174D32"
            strokeWidth="3.2"
            strokeLinecap="round"
          />

          {/* Stem Nodal Rings (Natural Poaceae Anatomy) */}
          <line x1="97.5" y1="200" x2="102.5" y2="200" stroke="#4F8A52" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="99" y1="150" x2="105" y2="150" stroke="#4F8A52" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="102" y1="105" x2="108" y2="105" stroke="#4F8A52" strokeWidth="2" strokeLinecap="round" />

          {/* Left Arching Leaf (Vegetative Tillering Blade) */}
          <motion.g
            style={{ transformOrigin: '101px 175px' }}
            animate={
              shouldReduceMotion
                ? {}
                : {
                    rotate: [-1.5, 1.8, -1.5],
                    transition: { duration: 6.8, repeat: Infinity, ease: 'easeInOut' },
                  }
            }
          >
            <path
              d="M 101 175 C 80 160, 45 155, 20 180 C 40 160, 75 145, 102 165 Z"
              fill="#4F8A52"
              fillOpacity="0.85"
            />
            {/* Fine leaf midrib venation */}
            <path
              d="M 101 175 C 72 158, 48 160, 20 180"
              stroke="#A8C3A0"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </motion.g>

          {/* Right Upper Flag Leaf (Photosynthetic Sun-Gathering Blade) */}
          <motion.g
            style={{ transformOrigin: '104px 125px' }}
            animate={
              shouldReduceMotion
                ? {}
                : {
                    rotate: [1.2, -1.5, 1.2],
                    transition: { duration: 7.2, repeat: Infinity, ease: 'easeInOut' },
                  }
            }
          >
            <path
              d="M 104 125 C 130 110, 168 115, 188 140 C 165 120, 130 102, 106 116 Z"
              fill="#174D32"
              fillOpacity="0.9"
            />
            {/* Midrib venation */}
            <path
              d="M 104 125 C 132 112, 162 118, 188 140"
              stroke="#70B77E"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            {/* Morning Dew Droplet with Light Refraction */}
            <motion.circle
              cx="160"
              cy="124"
              r="2.8"
              fill="#FFFFFF"
              fillOpacity="0.95"
              animate={
                shouldReduceMotion
                  ? {}
                  : {
                      scale: [1, 1.25, 1],
                      opacity: [0.75, 1, 0.75],
                      transition: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
                    }
              }
            />
            <circle cx="160" cy="124" r="4.2" stroke="#B8DCC1" strokeWidth="0.8" strokeOpacity="0.6" />
          </motion.g>

          {/* Drooping Golden-Sage Rice Panicle (Grain Spikelets) */}
          <motion.g
            style={{ transformOrigin: '130px 38px' }}
            variants={shouldReduceMotion ? {} : panicleDroopVariants}
            initial="initial"
            animate="animate"
          >
            {/* Curved Rachis (Panicle Backbone) */}
            <path
              d="M 130 38 C 142 30, 158 35, 165 52 C 168 62, 166 75, 160 88"
              stroke="#A8C3A0"
              strokeWidth="1.8"
              strokeLinecap="round"
            />

            {/* Individual Rice Grains / Spikelets (Golden-Amber & Botanical Green) */}
            {[
              { cx: 136, cy: 33, rx: 3.5, ry: 7.5, rot: 25, fill: '#D7AD63' },
              { cx: 145, cy: 33, rx: 3.5, ry: 8.0, rot: 40, fill: '#E5C07B' },
              { cx: 154, cy: 37, rx: 3.5, ry: 8.0, rot: 55, fill: '#D7AD63' },
              { cx: 161, cy: 45, rx: 3.5, ry: 8.0, rot: 75, fill: '#70B77E' },
              { cx: 165, cy: 55, rx: 3.5, ry: 8.0, rot: 95, fill: '#D7AD63' },
              { cx: 165, cy: 66, rx: 3.5, ry: 7.5, rot: 110, fill: '#E5C07B' },
              { cx: 163, cy: 77, rx: 3.2, ry: 7.2, rot: 125, fill: '#70B77E' },
              { cx: 158, cy: 87, rx: 3.0, ry: 6.8, rot: 140, fill: '#D7AD63' },
              // Secondary pedicel branch grains
              { cx: 140, cy: 45, rx: 2.8, ry: 6.5, rot: 45, fill: '#B8DCC1' },
              { cx: 148, cy: 52, rx: 3.0, ry: 7.0, rot: 65, fill: '#D7AD63' },
              { cx: 154, cy: 62, rx: 3.0, ry: 7.0, rot: 85, fill: '#E5C07B' },
            ].map((grain, idx) => (
              <ellipse
                key={idx}
                cx={grain.cx}
                cy={grain.cy}
                rx={grain.rx}
                ry={grain.ry}
                transform={`rotate(${grain.rot} ${grain.cx} ${grain.cy})`}
                fill={grain.fill}
                stroke="#174D32"
                strokeWidth="0.8"
                strokeOpacity="0.5"
              />
            ))}
          </motion.g>
        </motion.g>

        {/* Small Soil Horizon Bed Base Arc */}
        <path
          d="M 65 242 Q 100 236 135 242"
          stroke="#DCE4D9"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </motion.svg>
    </div>
  );
};
