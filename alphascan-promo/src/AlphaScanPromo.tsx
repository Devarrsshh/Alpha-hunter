import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const BG = "#080B14";
const INDIGO = "#6366F1";
const WHITE = "#F1F5F9";
const MUTED = "#94A3B8";

function punch(frame: number, start: number, fps: number) {
  const s = spring({
    frame: frame - start,
    fps,
    config: { damping: 10, stiffness: 200, mass: 0.6 },
  });
  return interpolate(s, [0, 1], [0.7, 1]);
}

function fadeInOut(
  frame: number,
  inStart: number,
  inEnd: number,
  outStart: number,
  outEnd: number
) {
  return interpolate(
    frame,
    [inStart, inEnd, outStart, outEnd],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
}

const Scene = ({
  children,
  start,
  end,
  size = 100,
  accent = false,
}: {
  children: React.ReactNode;
  start: number;
  end: number;
  color?: string;
  size?: number;
  accent?: boolean;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = fadeInOut(frame, start, start + 8, end - 8, end);
  const scale = punch(frame, start, fps);

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 60px",
        opacity,
      }}
    >
      <div
        style={{
          fontSize: size,
          fontWeight: 900,
          color: WHITE,
          textAlign: "center",
          lineHeight: 1.05,
          letterSpacing: "-0.04em",
          fontFamily: "sans-serif",
          transform: `scale(${scale})`,
          textShadow: accent ? `0 0 60px ${INDIGO}99` : "none",
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

export const AlphaScanPromo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const screenshots = [
    { file: "screenshot1.png", start: 270, end: 320 },
    { file: "screenshot2.png", start: 315, end: 365 },
    { file: "screenshot3.png", start: 360, end: 395 },
  ];

  const ctaOpacity = fadeInOut(frame, 395, 415, 445, 450);
  const ctaScale = punch(frame, 395, fps);

  return (
    <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
      <Audio src={staticFile("music.mp3")} volume={0.8} />

      {/* scene 1: logo */}
      <Scene start={0} end={45} size={88}>
        Alpha<span style={{ color: INDIGO }}>Scan</span>
      </Scene>

      {/* scene 2: find crypto alpha */}
      <Scene start={45} end={90} size={96}>
        Find Crypto
        <br />
        <span style={{ color: INDIGO }}>Alpha</span>
      </Scene>

      {/* scene 3: before everyone else */}
      <Scene start={90} end={135} size={88} accent>
        Before
        <br />
        Everyone Else
      </Scene>

      {/* scene 4: 33 hunters */}
      <Scene start={135} end={180} size={80}>
        <span style={{ color: INDIGO, fontSize: 140, display: "block", lineHeight: 1 }}>33</span>
        hunters. tracked.
      </Scene>

      {/* scene 5: ai extracted */}
      <Scene start={180} end={225} size={100} accent>
        AI
        <br />
        <span style={{ color: INDIGO }}>extracted.</span>
      </Scene>

      {/* scene 6: updated daily */}
      <Scene start={225} end={270} size={96}>
        updated
        <br />
        <span style={{ color: INDIGO }}>daily.</span>
      </Scene>

      {/* screenshots */}
      <AbsoluteFill style={{
        display: "flex", alignItems: "center",
        justifyContent: "center", padding: "0 40px",
      }}>
        {screenshots.map(({ file, start, end }) => {
          const op = fadeInOut(frame, start, start + 12, end - 10, end);
          const scale = punch(frame, start, fps);
          const zoom = interpolate(frame, [start, end], [1, 1.06], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          });
          return (
            <div
              key={file}
              style={{
                position: "absolute",
                width: "100%",
                opacity: op,
                transform: `scale(${scale})`,
                borderRadius: 24,
                overflow: "hidden",
                border: `1.5px solid ${INDIGO}88`,
                boxShadow: `0 0 80px ${INDIGO}55, 0 0 20px ${INDIGO}33`,
              }}
            >
              <Img
                src={staticFile(file)}
                style={{
                  width: "100%", display: "block",
                  transform: `scale(${zoom})`,
                  transformOrigin: "center top",
                }}
              />
            </div>
          );
        })}
      </AbsoluteFill>

      {/* cta */}
      <AbsoluteFill style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        opacity: ctaOpacity,
        transform: `scale(${ctaScale})`,
      }}>
        <div style={{
          fontSize: 52, fontWeight: 900, color: INDIGO,
          letterSpacing: "-0.03em", fontFamily: "sans-serif",
          textShadow: `0 0 40px ${INDIGO}88`,
        }}>
          alphascanapp.xyz
        </div>
      </AbsoluteFill>

    </AbsoluteFill>
  );
};