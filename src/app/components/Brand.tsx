import logo from "../../imports/image-7.png";

export function BrandLogo({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src={logo}
      alt="Grab-Eat! Japanese Food House"
      style={{ width: size, height: size }}
      className={`object-contain ${className}`}
    />
  );
}

export const BRAND = {
  name: "GRAB-EAT!",
  tagline: "Japanese Food House",
  full: "GRAB-EAT! Japanese Food House",
};
