import { Composition } from "remotion";
import { PromoVideo } from "./PromoVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="PromoVideo"
        component={PromoVideo}
        durationInFrames={645} // ~21.5s at 30fps (5 scenes x 3.5s + 4s CTA)
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
