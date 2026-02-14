import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  Easing,
} from "remotion";
import { colors, fontFamily } from "../styles";
import { GradientOrb } from "../components/GradientOrb";
import { BokehParticles } from "../components/BokehParticles";
import { WordReveal } from "../components/WordReveal";
import { LightStreak } from "../components/LightStreak";

const DECEL = Easing.bezier(0.16, 1, 0.3, 1);

export const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Logo entrance — deceleration scale
  const logoScale = interpolate(frame, [0, 18], [1.15, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: DECEL,
  });
  const logoOpacity = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: DECEL,
  });

  // Button entrance
  const buttonScale = interpolate(frame, [28, 40], [0.9, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: DECEL,
  });
  const buttonOpacity = interpolate(frame, [28, 38], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: DECEL,
  });

  // Subtle button glow pulse
  const buttonGlow = interpolate(frame % 50, [0, 25, 50], [0.4, 0.8, 0.4]);

  // URL fade in
  const urlOpacity = interpolate(frame, [38, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: DECEL,
  });

  return (
    <AbsoluteFill
      style={{
        background: colors.black,
        justifyContent: "center",
        alignItems: "center",
        fontFamily,
      }}
    >
      {/* Ambient orbs */}
      <GradientOrb
        color1={colors.purple}
        color2={colors.blue}
        size={700}
        position={{ x: -150, y: -250 }}
        opacity={0.3}
      />
      <GradientOrb
        color1={colors.featureBlue}
        color2={colors.indigo}
        size={500}
        position={{ x: 180, y: 280 }}
        opacity={0.2}
      />

      {/* Large bokeh for dramatic CTA */}
      <BokehParticles
        count={8}
        colors={[colors.purple, colors.blue, colors.featureBlue, colors.indigo]}
        minSize={100}
        maxSize={240}
        blurAmount={50}
      />

      {/* Entrance light streak */}
      <LightStreak startFrame={3} duration={12} />

      {/* Logo — dramatic scale entrance */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          opacity: logoOpacity,
          textAlign: "center",
          marginBottom: 40,
          zIndex: 10,
        }}
      >
        <h1
          style={{
            fontSize: 96,
            fontWeight: 900,
            color: colors.white,
            margin: 0,
            letterSpacing: "-3px",
            lineHeight: 1.05,
          }}
        >
          Learn
        </h1>
        <h1
          style={{
            fontSize: 96,
            fontWeight: 900,
            color: "transparent",
            backgroundImage: `linear-gradient(135deg, ${colors.featureBlue}, ${colors.purple})`,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            margin: 0,
            marginTop: -6,
            letterSpacing: "-3px",
            lineHeight: 1.05,
          }}
        >
          WithAvi
        </h1>
      </div>

      {/* CTA text — WordReveal */}
      <div style={{ zIndex: 10, marginBottom: 48, maxWidth: 800 }}>
        <WordReveal
          text="Start Your AI-Powered Learning Journey"
          startFrame={14}
          framesPerWord={2}
          fontSize={52}
          fontWeight={700}
          color={colors.white}
        />
      </div>

      {/* CTA Button */}
      <div
        style={{
          transform: `scale(${buttonScale})`,
          opacity: buttonOpacity,
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "28px 64px",
            borderRadius: 100,
            background: `linear-gradient(135deg, ${colors.featureBlue}, ${colors.purple})`,
            boxShadow: `0 0 ${30 * buttonGlow}px ${colors.purple}80`,
          }}
        >
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <span
            style={{
              color: colors.white,
              fontSize: 38,
              fontWeight: 800,
            }}
          >
            Try It Free
          </span>
        </div>
      </div>

      {/* URL */}
      <p
        style={{
          position: "absolute",
          bottom: 150,
          fontSize: 30,
          color: colors.whiteAlpha70,
          fontWeight: 500,
          opacity: urlOpacity,
          letterSpacing: "4px",
          zIndex: 10,
        }}
      >
        learnwithavi.com
      </p>

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          display: "flex",
          alignItems: "center",
          gap: 12,
          opacity: urlOpacity,
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: colors.featureGreen,
          }}
        />
        <span
          style={{
            fontSize: 22,
            color: colors.whiteAlpha50,
            fontWeight: 400,
          }}
        >
          Free to start
        </span>
      </div>
    </AbsoluteFill>
  );
};
