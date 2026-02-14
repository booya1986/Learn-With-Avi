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

const DECEL = Easing.bezier(0.16, 1, 0.3, 1);

interface StatItem {
  value: number;
  suffix: string;
  label: string;
  color: string;
}

const stats: StatItem[] = [
  { value: 87, suffix: "%", label: "Completion Rate", color: colors.featureBlue },
  { value: 2.3, suffix: "x", label: "Faster Learning", color: colors.featurePurple },
  { value: 42, suffix: "min", label: "Avg. Session", color: colors.featureGreen },
  { value: 94, suffix: "", label: "NPS Score", color: colors.featureAmber },
];

export const StatsScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        background: colors.black,
        justifyContent: "center",
        alignItems: "center",
        fontFamily,
        padding: 60,
      }}
    >
      {/* Ambient orbs */}
      <GradientOrb
        color1={colors.featureBlue}
        color2={colors.purple}
        size={600}
        position={{ x: -250, y: -350 }}
        opacity={0.2}
      />
      <GradientOrb
        color1={colors.featureGreen}
        color2={colors.blue}
        size={450}
        position={{ x: 200, y: 300 }}
        opacity={0.15}
      />

      {/* Bokeh */}
      <BokehParticles
        count={6}
        colors={[colors.featureBlue, colors.featurePurple, colors.featureGreen]}
        minSize={60}
        maxSize={140}
        blurAmount={35}
      />

      {/* Header — WordReveal */}
      <div style={{ zIndex: 10, marginBottom: 70 }}>
        <WordReveal
          text="Real Results"
          startFrame={0}
          framesPerWord={4}
          fontSize={72}
          fontWeight={800}
          color={colors.white}
        />
      </div>

      {/* Stats cards — staggered entrance */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 28,
          width: "100%",
          maxWidth: 850,
          zIndex: 10,
        }}
      >
        {stats.map((stat, index) => {
          const cardDelay = 8 + index * 8;

          // Card scale entrance with deceleration
          const cardScale = interpolate(
            frame,
            [cardDelay, cardDelay + 12],
            [0.9, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: DECEL,
            }
          );
          const cardOpacity = interpolate(
            frame,
            [cardDelay, cardDelay + 10],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: DECEL,
            }
          );

          // Number count-up
          const countProgress = interpolate(
            frame,
            [cardDelay + 4, cardDelay + 22],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.ease),
            }
          );
          const displayValue =
            stat.suffix === "x"
              ? (stat.value * countProgress).toFixed(1)
              : Math.round(stat.value * countProgress);

          return (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 28,
                padding: "24px 32px",
                borderRadius: 20,
                background: colors.whiteAlpha05,
                border: `1px solid ${colors.whiteAlpha10}`,
                transform: `scale(${cardScale})`,
                opacity: cardOpacity,
              }}
            >
              {/* Value with count-up */}
              <span
                style={{
                  fontSize: 56,
                  fontWeight: 900,
                  color: stat.color,
                  minWidth: 190,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {displayValue}
                {stat.suffix}
              </span>

              {/* Label */}
              <span
                style={{
                  fontSize: 32,
                  color: colors.whiteAlpha90,
                  fontWeight: 500,
                }}
              >
                {stat.label}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
