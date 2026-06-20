import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import { cn } from "@/lib/utils";

export function AppSkeletonTheme({ children }) {
  return (
    <SkeletonTheme
      baseColor="#eceef1"
      highlightColor="#f7f8fa"
      borderRadius={8}
      duration={1.35}
    >
      {children}
    </SkeletonTheme>
  );
}

export function SkeletonBlock({ className, ...props }) {
  return <Skeleton className={cn("block", className)} {...props} />;
}
